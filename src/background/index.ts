/**
 * EchoType - Background Service Worker
 * @module background
 *
 * Main entry point for the extension's background service worker.
 * Handles keyboard commands, tab management, and message routing.
 */

import { MSG, createMessage } from '@shared/protocol';
import type {
  ResultReadyPayload,
  ErrorPayload,
  StatusChangedPayload,
} from '@shared/protocol';
import type { HistoryItem, EchoTypeError } from '@shared/types';

import { loadSettings, onSettingsChange } from './settings';
import {
  ensureChatGPTTab,
  sendToChatGPTTab,
  returnToPreviousTab,
  getCurrentTab,
  waitForTabComplete,
} from './tab-manager';
import { writeToClipboard } from './offscreen-bridge';
import { addToHistory, loadHistory, getLastHistoryItem } from './history';
import { updateBadge, showSuccessBadge, showErrorBadge, initBadge } from './badge';
import { playStartSound, playSuccessSound, playErrorSound } from './audio';
import './keepalive'; // Keep service worker alive via alarms
import { startHeartbeat, getLastHeartbeat, isServiceWorkerHealthy, getFormattedUptime } from './heartbeat';
import { notifyStatusChange } from './messaging';

// ============================================================================
// Initialization
// ============================================================================

console.log('[EchoType] Background service worker started');

const STORAGE_KEY_DEV_MODE = 'echotype_dev_mode';
const CHATGPT_MATCH = 'https://chatgpt.com/*';

function getChatGPTContentScriptFile(): string | null {
  const manifest = chrome.runtime.getManifest();
  const scripts = manifest.content_scripts ?? [];
  const entry = scripts.find((script) => script.matches?.includes(CHATGPT_MATCH));
  return entry?.js?.[0] ?? null;
}

async function isChatGPTContentScriptReady(tabId: number): Promise<boolean> {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Boolean((window as { __ECHOTYPE_CONTENT_SCRIPT_LOADED__?: boolean }).__ECHOTYPE_CONTENT_SCRIPT_LOADED__),
    });
    return Boolean(result[0]?.result);
  } catch (error) {
    console.warn('[EchoType] Content script probe failed:', error);
    return false;
  }
}

async function ensureChatGPTContentScript(tabId: number): Promise<boolean> {
  const file = getChatGPTContentScriptFile();
  if (!file) {
    console.warn('[EchoType] No ChatGPT content script entry in manifest');
    return false;
  }

  try {
    const ready = await isChatGPTContentScriptReady(tabId);
    if (ready) {
      return true;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    });
    return true;
  } catch (error) {
    console.error('[EchoType] Failed to inject content script:', error);
    return false;
  }
}

// Current settings (loaded async)
let currentSettings = {
  autoCopyToClipboard: true,
  autoPasteToActiveTab: false,
  returnFocusAfterStart: false,
  historySize: 5,
};

// ============================================================================
// Dictation Status Management (Persistent via chrome.storage.session)
// ============================================================================

const STORAGE_KEY_DICTATION_STATUS = 'echotype_dictation_status';

// In-memory cache (synced with storage)
let currentDictationStatus: 'idle' | 'listening' | 'recording' | 'processing' | 'unknown' = 'idle';

type DictationStatusType = 'idle' | 'listening' | 'recording' | 'processing' | 'unknown';

const VALID_STATUSES: DictationStatusType[] = ['idle', 'listening', 'recording', 'processing', 'unknown'];

function isValidStatus(status: unknown): status is DictationStatusType {
  return typeof status === 'string' && VALID_STATUSES.includes(status as DictationStatusType);
}

/**
 * Get dictation status from persistent storage.
 * Service Workers are ephemeral - global variables can be reset on termination.
 * Using chrome.storage.session ensures state survives SW restarts.
 */
async function getDictationStatus(): Promise<DictationStatusType> {
  try {
    const result = await chrome.storage.session.get(STORAGE_KEY_DICTATION_STATUS);
    const status = result[STORAGE_KEY_DICTATION_STATUS];
    if (isValidStatus(status)) {
      currentDictationStatus = status;
      return status;
    }
  } catch (error) {
    console.warn('[EchoType] Failed to get status from storage:', error);
  }
  return currentDictationStatus;
}

/**
 * Set dictation status to both memory and persistent storage.
 * This ensures consistency across SW terminations.
 */
async function setDictationStatus(status: DictationStatusType): Promise<void> {
  currentDictationStatus = status;
  try {
    await chrome.storage.session.set({ [STORAGE_KEY_DICTATION_STATUS]: status });
    console.log('[EchoType] Status persisted:', status);
  } catch (error) {
    console.warn('[EchoType] Failed to persist status:', error);
  }
}

// Initialize settings, badge, status, and heartbeat asynchronously
(async () => {
  currentSettings = await loadSettings();
  console.log('[EchoType] Settings loaded:', currentSettings);
  
  // Restore status from storage (survives SW termination)
  await getDictationStatus();
  console.log('[EchoType] Restored status:', currentDictationStatus);
  
  await initBadge();
  await startHeartbeat(); // Start heartbeat tracking
})();

// Listen for settings changes
onSettingsChange((settings) => {
  currentSettings = settings;
  console.log('[EchoType] Settings updated:', settings);
});

// ============================================================================
// Command Handlers
// ============================================================================

/**
 * Handle the start-dictation command.
 * Includes robust retry logic and content script injection.
 */
async function handleStartDictation(): Promise<{ ok: boolean; error?: EchoTypeError }> {
  console.log('[EchoType] Start dictation command');

  // Ensure ChatGPT tab exists and is active
  const tabInfo = await ensureChatGPTTab(true);
  if (!tabInfo) {
    console.error('[EchoType] Failed to get ChatGPT tab');
    await showErrorBadge();
    await playErrorSound();
    return {
      ok: false,
      error: {
        code: 'TAB_NOT_FOUND',
        message: 'Could not open ChatGPT. Please try again.',
      },
    };
  }

  // Wait for tab to be fully ready
  const ready = await waitForTabComplete(tabInfo.tabId, 8000);
  if (!ready) {
    console.warn('[EchoType] Tab may not be fully loaded');
  }

  // Ensure content script is injected
  const injected = await ensureChatGPTContentScript(tabInfo.tabId);
  if (!injected) {
    console.error('[EchoType] Failed to inject content script');
    await showErrorBadge();
    await playErrorSound();
    return {
      ok: false,
      error: {
        code: 'INJECTION_FAILED',
        message: 'Could not connect to ChatGPT page. Please refresh and try again.',
      },
    };
  }

  // Small delay to ensure content script is initialized
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Send start command with retry logic (handled by sendToChatGPTTab)
  const result = await sendToChatGPTTab<{ ok: boolean; error?: EchoTypeError }>(
    createMessage.cmdStart('snapshot')
  );

  if (result?.ok) {
    console.log('[EchoType] Dictation started successfully');
    await setDictationStatus('recording');
    await updateBadge('recording');
    await playStartSound();

    // Return to previous tab if setting enabled
    if (currentSettings.returnFocusAfterStart) {
      await returnToPreviousTab();
    }
    return result;
  } else {
    const errorMessage = result?.error?.message || 'No response from ChatGPT tab';
    console.error('[EchoType] Failed to start dictation:', errorMessage);
    await showErrorBadge();
    await playErrorSound();
    return {
      ok: false,
      error: result?.error ?? {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Handle the cancel-dictation command (formerly pause).
 * Cancels recording and clears the input.
 */
async function handleCancelDictation(): Promise<{ ok: boolean; error?: EchoTypeError }> {
  console.log('[EchoType] Cancel dictation command');

  const tabInfo = await ensureChatGPTTab(false);
  if (!tabInfo) {
    return {
      ok: false,
      error: {
        code: 'TAB_NOT_FOUND',
        message: 'No ChatGPT tab available',
      },
    };
  }

  const ready = await waitForTabComplete(tabInfo.tabId);
  if (ready) {
    await ensureChatGPTContentScript(tabInfo.tabId);
  }

  let result = await sendToChatGPTTab<{ ok: boolean }>(
    createMessage.cmdPause()
  );
  if (!result && ready) {
    await ensureChatGPTContentScript(tabInfo.tabId);
    result = await sendToChatGPTTab<{ ok: boolean }>(
      createMessage.cmdPause()
    );
  }

  if (result?.ok) {
    console.log('[EchoType] Dictation paused');
    await setDictationStatus('idle');
    await updateBadge('idle');
    return { ok: true };
  }
  return {
    ok: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'No response from ChatGPT tab',
    },
  };
}

/**
 * Handle the submit-dictation command.
 */
async function handleSubmitDictation(): Promise<ResultReadyPayload | ErrorPayload> {
  console.log('[EchoType] Submit dictation command');
  await updateBadge('processing');

  const tabInfo = await ensureChatGPTTab(false);
  if (!tabInfo) {
    return createMessage.error({
      code: 'TAB_NOT_FOUND',
      message: 'No ChatGPT tab available',
    });
  }

  const ready = await waitForTabComplete(tabInfo.tabId);
  if (ready) {
    await ensureChatGPTContentScript(tabInfo.tabId);
  }

  let result = await sendToChatGPTTab<ResultReadyPayload | ErrorPayload>(
    createMessage.cmdSubmit(true)
  );
  if (!result && ready) {
    await ensureChatGPTContentScript(tabInfo.tabId);
    result = await sendToChatGPTTab<ResultReadyPayload | ErrorPayload>(
      createMessage.cmdSubmit(true)
    );
  }

  if (!result) {
    console.error('[EchoType] No response from ChatGPT tab');
    return createMessage.error({
      code: 'UNKNOWN_ERROR',
      message: 'No response from ChatGPT tab',
    });
  }

  if (result.type === MSG.ERROR) {
    console.error('[EchoType] Dictation error:', result.error);
    await showErrorBadge();
    await playErrorSound();
    return result;
  }

  if (result.type === MSG.RESULT_READY) {
    const { addedText, capture, clear } = result;

    console.log('[EchoType] Dictation result:', {
      addedTextLength: addedText.length,
      captureReason: capture.reason,
      clearOk: clear.ok,
    });

    // CRITICAL: Reset dictation status to idle after successful submit
    // Use setDictationStatus to persist to storage (survives SW termination)
    await setDictationStatus('idle');
    await updateBadge('idle');
    
    // Forward status change to popup (ensures UI sync)
    // Using reliable messaging module for better error handling
    notifyStatusChange(createMessage.statusChanged('idle'));

    // Only process if we have added text
    if (addedText) {
      // Add to history
      const historyItem = await addToHistory(addedText);
      await showSuccessBadge();
      await playSuccessSound();

      // Auto-copy to clipboard if enabled
      if (currentSettings.autoCopyToClipboard) {
        const copied = await writeToClipboard(addedText);
        console.log('[EchoType] Auto-copied to clipboard:', copied);
      }

      // Broadcast result to universal content scripts
      broadcastResult(addedText, historyItem);

      // Auto-paste if enabled
      if (currentSettings.autoPasteToActiveTab) {
        await returnToPreviousTab();
        await handlePasteLastResult();
      }
    }
    return result;
  }
  return result;
}

/**
 * Handle the paste-last-result command.
 */
async function handlePasteLastResult(): Promise<void> {
  console.log('[EchoType] Paste last result command');

  const lastItem = await getLastHistoryItem();
  if (!lastItem) {
    console.log('[EchoType] No history to paste');
    return;
  }

  const currentTabId = await getCurrentTab();
  if (!currentTabId) {
    console.log('[EchoType] No active tab');
    return;
  }

  // Send paste command to current tab
  try {
    await chrome.tabs.sendMessage(currentTabId, createMessage.pasteText(lastItem.text));
    console.log('[EchoType] Paste command sent');
  } catch (error) {
    console.error('[EchoType] Failed to send paste command:', error);
  }
}

// ============================================================================
// Broadcast
// ============================================================================

/**
 * Broadcast result to all tabs with universal content script.
 *
 * @param text - The dictation text
 * @param historyItem - The history item
 */
async function broadcastResult(text: string, historyItem: HistoryItem): Promise<void> {
  const message = createMessage.broadcastResult(text, historyItem);

  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Ignore tabs without content script
        });
      }
    }
  } catch (error) {
    console.error('[EchoType] Broadcast error:', error);
  }
}

// ============================================================================
// Command Listener
// ============================================================================

/**
 * Listen for keyboard commands.
 * 
 * Commands:
 * - toggle-dictation: Start if idle, Submit if recording
 * - cancel-dictation: Cancel recording and clear input
 * - paste-last-result: Paste last result to active tab
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[EchoType] Command received:', command);

  switch (command) {
    case 'toggle-dictation':
      // Toggle: Start if idle, Submit if recording
      if (currentDictationStatus === 'recording' || currentDictationStatus === 'listening') {
        await handleSubmitDictation();
      } else {
        await handleStartDictation();
      }
      break;
    case 'cancel-dictation':
      await handleCancelDictation();
      break;
    case 'paste-last-result':
      await handlePasteLastResult();
      break;
  }
});

// ============================================================================
// Message Listener
// ============================================================================

/**
 * Listen for messages from content scripts and popup.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle commands from popup/options
  if (message.type === MSG.CMD_START) {
    (async () => {
      const result = await handleStartDictation();
      sendResponse(result);
    })();
    return true;
  }

  if (message.type === MSG.CMD_PAUSE) {
    (async () => {
      const result = await handleCancelDictation();
      sendResponse(result);
    })();
    return true;
  }

  if (message.type === MSG.CMD_SUBMIT) {
    (async () => {
      const result = await handleSubmitDictation();
      sendResponse(result);
    })();
    return true;
  }

  // Handle status changes from ChatGPT content script
  if (message.type === MSG.STATUS_CHANGED) {
    const statusMessage = message as StatusChangedPayload;
    // Persist status to storage (async, but don't block)
    setDictationStatus(statusMessage.status as typeof currentDictationStatus);
    console.log('[EchoType] Status changed:', currentDictationStatus);
    
    // Forward status change to popup (fixes state sync bug)
    // Using reliable messaging module for better error handling
    notifyStatusChange(statusMessage);
    return false;
  }

  if (message.type === MSG.CMD_GET_STATUS || message.type === MSG.GET_STATUS) {
    // Return status from memory (already synced from storage on SW start)
    // Also refresh from storage to ensure consistency
    getDictationStatus().then(() => {
      sendResponse({ status: currentDictationStatus });
    });
    return true; // Async response
  }

  // Handle status requests from popup
  // (Handled above to support CMD_GET_STATUS and GET_STATUS)

  // Handle history requests from popup
  if (message.type === MSG.GET_HISTORY) {
    loadHistory().then((items) => {
      sendResponse({ history: items });
    });
    return true;
  }

  // Handle history requests (legacy)
  if (message.type === MSG.HISTORY_GET) {
    loadHistory().then((items) => {
      sendResponse({ type: MSG.HISTORY_RESULT, items });
    });
    return true;
  }

  // Handle history clear
  if (message.type === MSG.HISTORY_CLEAR) {
    import('./history').then(({ clearHistory }) => {
      clearHistory().then(() => sendResponse({ ok: true }));
    });
    return true;
  }

  // Handle heartbeat/health check requests (for developer mode)
  if (message.type === 'GET_HEALTH') {
    (async () => {
      const heartbeat = await getLastHeartbeat();
      const healthy = await isServiceWorkerHealthy();
      const uptime = await getFormattedUptime();
      sendResponse({
        healthy,
        heartbeat,
        uptime,
        timestamp: Date.now(),
      });
    })();
    return true;
  }

  // Dev-only forwarder (options -> background -> ChatGPT content script)
  if (message.type === MSG.DEV_FORWARD) {
    (async () => {
      const result = await chrome.storage.local.get(STORAGE_KEY_DEV_MODE);
      if (result[STORAGE_KEY_DEV_MODE] !== true) {
        sendResponse({ ok: false, error: 'dev-mode-disabled' });
        return;
      }

      const payload = message.message;
      if (
        !payload ||
        (payload.type !== MSG.INSPECT_DOM && 
         payload.type !== MSG.DEV_HANDSHAKE &&
         payload.type !== MSG.GET_DIAGNOSTIC)
      ) {
        sendResponse({ ok: false, error: 'unsupported-dev-message' });
        return;
      }

      const tabInfo = await ensureChatGPTTab(false);
      if (!tabInfo) {
        sendResponse({ ok: false, error: 'no-chatgpt-tab' });
        return;
      }

      const ready = await waitForTabComplete(tabInfo.tabId);
      if (ready) {
        await ensureChatGPTContentScript(tabInfo.tabId);
      }

      try {
        const response = await chrome.tabs.sendMessage(tabInfo.tabId, payload);
        sendResponse({ ok: true, tabId: tabInfo.tabId, response });
      } catch {
        const readyRetry = ready || (await waitForTabComplete(tabInfo.tabId));
        if (!readyRetry) {
          sendResponse({ ok: false, error: 'chatgpt-tab-not-ready' });
          return;
        }
        await ensureChatGPTContentScript(tabInfo.tabId);
        try {
          const response = await chrome.tabs.sendMessage(tabInfo.tabId, payload);
          sendResponse({ ok: true, tabId: tabInfo.tabId, response });
        } catch (retryError) {
          sendResponse({ ok: false, error: String(retryError) });
        }
      }
    })();
    return true;
  }

  return false;
});

// ============================================================================
// Installation
// ============================================================================

/**
 * Handle extension installation/update.
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[EchoType] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});
