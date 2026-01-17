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
  refreshTabIfNeeded,
  sendToChatGPTTab,
  returnToPreviousTab,
  getCurrentTab,
  getChatGPTTabInfo,
  waitForTabComplete,
  activateChatGPTTab,
  rememberCaptureOrigin,
  getCaptureOrigin,
  returnToCaptureOrigin,
  clearCaptureOrigin,
} from './tab-manager';
import { writeToClipboard } from './offscreen-bridge';
import { addToHistory, loadHistory, getLastHistoryItem } from './history';
import { updateBadge, showSuccessBadge, initBadge } from './badge';
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
  audioFeedbackEnabled: true,
  historySize: 5,
};

function canPlayAudio(): boolean {
  return currentSettings.audioFeedbackEnabled;
}

let submitInFlight = false;

// ============================================================================
// Dictation Status Management (Persistent via chrome.storage.session)
// ============================================================================

const STORAGE_KEY_DICTATION_STATUS = 'echotype_dictation_status';

// In-memory cache (synced with storage)
let currentDictationStatus: 'idle' | 'listening' | 'recording' | 'processing' | 'error' | 'unknown' = 'idle';

type DictationStatusType = 'idle' | 'listening' | 'recording' | 'processing' | 'error' | 'unknown';

const VALID_STATUSES: DictationStatusType[] = ['idle', 'listening', 'recording', 'processing', 'error', 'unknown'];

const STATUS_TRANSITIONS: Record<DictationStatusType, DictationStatusType[]> = {
  idle: ['listening', 'recording', 'processing', 'error', 'unknown'],
  listening: ['processing', 'idle', 'error', 'unknown', 'recording'],
  recording: ['processing', 'idle', 'error', 'unknown', 'listening'],
  processing: ['idle', 'error', 'unknown'],
  error: ['idle', 'unknown', 'listening', 'recording', 'processing'],
  unknown: ['idle', 'listening', 'recording', 'processing', 'error'],
};

function isValidTransition(
  from: DictationStatusType,
  to: DictationStatusType
): boolean {
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

const statusListeners = new Set<(status: DictationStatusType) => void>();

async function setStatusAndNotify(status: DictationStatusType): Promise<void> {
  if (currentDictationStatus === status) {
    return;
  }
  await setDictationStatus(status);
  await updateBadge(status);
  notifyStatusChange(createMessage.statusChanged(status));
  for (const listener of statusListeners) {
    try {
      listener(status);
    } catch (error) {
      console.warn('[EchoType] Status listener error:', error);
    }
  }
}

async function waitForStatus(
  expected: DictationStatusType[],
  timeoutMs: number
): Promise<DictationStatusType | null> {
  if (expected.includes(currentDictationStatus)) {
    return currentDictationStatus;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      statusListeners.delete(onStatus);
      resolve(null);
    }, timeoutMs);

    const onStatus = (status: DictationStatusType) => {
      if (!expected.includes(status)) return;
      clearTimeout(timeout);
      statusListeners.delete(onStatus);
      resolve(status);
    };

    statusListeners.add(onStatus);
  });
}

let resyncInFlight = false;

async function requestStatusResync(reason: string): Promise<DictationStatusType | null> {
  if (resyncInFlight) return null;
  resyncInFlight = true;
  try {
    const tabInfo = getChatGPTTabInfo();
    if (!tabInfo) {
      console.warn('[EchoType] Status resync skipped (no ChatGPT tab):', reason);
      return null;
    }

    const ready = await waitForTabComplete(tabInfo.tabId, 3000);
    if (ready) {
      await ensureChatGPTContentScript(tabInfo.tabId);
    }

    const response = await sendToChatGPTTab<{ status?: DictationStatusType }>(
      createMessage.cmdGetStatus()
    );
    if (isValidStatus(response?.status)) {
      return response.status;
    }
  } catch (error) {
    console.warn('[EchoType] Status resync failed:', error);
  } finally {
    resyncInFlight = false;
  }

  return null;
}

async function applyIncomingStatus(status: DictationStatusType, source: string): Promise<void> {
  if (!isValidStatus(status)) {
    console.warn('[EchoType] Ignoring invalid status:', status, source);
    return;
  }

  if (status === 'unknown') {
    const resynced = await requestStatusResync(`${source}:unknown`);
    if (resynced) {
      await setStatusAndNotify(resynced);
      return;
    }
    await setStatusAndNotify('error');
    return;
  }

  if (!isValidTransition(currentDictationStatus, status)) {
    console.warn('[EchoType] Invalid status transition:', currentDictationStatus, '->', status, source);
    const resynced = await requestStatusResync(`${source}:invalid`);
    if (resynced && isValidTransition(currentDictationStatus, resynced)) {
      await setStatusAndNotify(resynced);
      return;
    }
    await setStatusAndNotify('error');
    return;
  }

  await setStatusAndNotify(status);
}

function isValidStatus(status: unknown): status is DictationStatusType {
  return typeof status === 'string' && VALID_STATUSES.includes(status as DictationStatusType);
}

async function waitForProcessingCompletion(
  timeoutMs = 14000
): Promise<DictationStatusType | null> {
  const status = await waitForStatus(['idle', 'error'], timeoutMs);
  if (status) {
    return status;
  }

  const resynced = await requestStatusResync('processing-timeout');
  if (resynced) {
    await applyIncomingStatus(resynced, 'processing-resync');
    if (resynced === 'idle' || resynced === 'error') {
      return resynced;
    }
  }

  return null;
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
  await updateBadge(currentDictationStatus);
  notifyStatusChange(createMessage.statusChanged(currentDictationStatus));
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

  // Ensure ChatGPT tab exists (activation optional based on settings)
  const tabInfo = await ensureChatGPTTab(false);
  if (!tabInfo) {
    console.error('[EchoType] Failed to get ChatGPT tab');
    await setStatusAndNotify('error');
    if (canPlayAudio()) {
      await playErrorSound();
    }
    return {
      ok: false,
      error: {
        code: 'TAB_NOT_FOUND',
        message: 'Could not open ChatGPT. Please try again.',
      },
    };
  }

  await refreshTabIfNeeded(tabInfo.tabId);

  // Wait for tab to be fully ready
  const ready = await waitForTabComplete(tabInfo.tabId, 8000);
  if (!ready) {
    console.warn('[EchoType] Tab may not be fully loaded');
  }

  // Ensure content script is injected
  const injected = await ensureChatGPTContentScript(tabInfo.tabId);
  if (!injected) {
    console.error('[EchoType] Failed to inject content script');
    await setStatusAndNotify('error');
    if (canPlayAudio()) {
      await playErrorSound();
    }
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

  const preStatus = await requestStatusResync('start-check');
  if (preStatus && preStatus !== 'idle') {
    console.warn('[EchoType] Start blocked, current status:', preStatus);
    await applyIncomingStatus(preStatus, 'start-precheck');
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Dictation is not idle (${preStatus}).`,
      },
    };
  }

  await rememberCaptureOrigin({ force: true });

  const shouldActivateForStart = currentSettings.returnFocusAfterStart;
  if (shouldActivateForStart) {
    await activateChatGPTTab(tabInfo, { trackPrevious: true });
  }

  // Send start command with retry logic (handled by sendToChatGPTTab)
  let result = await sendToChatGPTTab<{ ok: boolean; error?: EchoTypeError; status?: DictationStatusType }>(
    createMessage.cmdStart('snapshot')
  );

  if (!result?.ok && result?.error?.code === 'PAGE_INACTIVE' && !shouldActivateForStart) {
    console.warn('[EchoType] Page inactive, activating tab and retrying start');
    await activateChatGPTTab(tabInfo, { trackPrevious: false });
    result = await sendToChatGPTTab<{ ok: boolean; error?: EchoTypeError; status?: DictationStatusType }>(
      createMessage.cmdStart('snapshot')
    );
  }

  if (result?.ok) {
    console.log('[EchoType] Dictation started successfully');
    const nextStatus = isValidStatus(result.status) ? result.status : 'recording';
    await applyIncomingStatus(nextStatus, 'start');
    if (canPlayAudio()) {
      await playStartSound();
    }

    // Return to previous tab if setting enabled
    if (currentSettings.returnFocusAfterStart && shouldActivateForStart) {
      await returnToPreviousTab();
    }
    return result;
  } else {
    const errorMessage = result?.error?.message || 'No response from ChatGPT tab';
    console.error('[EchoType] Failed to start dictation:', errorMessage);
    await setStatusAndNotify('error');
    if (canPlayAudio()) {
      await playErrorSound();
    }
    clearCaptureOrigin();
    if (shouldActivateForStart) {
      await returnToPreviousTab();
    }
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
    await setStatusAndNotify('idle');
    clearCaptureOrigin();
    return { ok: true };
  }
  await setStatusAndNotify('error');
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
 *
 * Flow: submit in ChatGPT tab, return immediately, wait for processing,
 * then activate briefly to capture results and return to origin.
 */
async function handleSubmitDictation(): Promise<ResultReadyPayload | ErrorPayload> {
  if (submitInFlight) {
    return createMessage.error({
      code: 'UNKNOWN_ERROR',
      message: 'Dictation submit already in progress.',
    });
  }

  submitInFlight = true;
  let originCleared = false;
  let needsReturn = false;
  let captureOrigin = null as { tabId: number; windowId: number | null } | null;
  let pasteTargetTabId: number | null = null;

  try {
    console.log('[EchoType] Submit dictation command');
    await setStatusAndNotify('processing');

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

    await rememberCaptureOrigin({ force: false });
    captureOrigin = getCaptureOrigin();
    pasteTargetTabId = captureOrigin?.tabId ?? null;
    needsReturn = Boolean(captureOrigin && captureOrigin.tabId !== tabInfo.tabId);

    if (needsReturn) {
      await activateChatGPTTab(tabInfo, { trackPrevious: false });
    }

    let submitAck = await sendToChatGPTTab<StatusChangedPayload | ErrorPayload>(
      createMessage.cmdSubmit({ mode: 'submit-only' })
    );

    if (!submitAck && ready) {
      await ensureChatGPTContentScript(tabInfo.tabId);
      submitAck = await sendToChatGPTTab<StatusChangedPayload | ErrorPayload>(
        createMessage.cmdSubmit({ mode: 'submit-only' })
      );
    }

    if (!submitAck) {
      console.error('[EchoType] No response from ChatGPT tab (submit)');
      if (needsReturn) {
        await returnToCaptureOrigin(true);
        originCleared = true;
      }
      return createMessage.error({
        code: 'UNKNOWN_ERROR',
        message: 'No response from ChatGPT tab',
      });
    }

    if (submitAck.type === MSG.ERROR) {
      console.error('[EchoType] Submit error:', submitAck.error);
      await setStatusAndNotify('error');
      if (canPlayAudio()) {
        await playErrorSound();
      }
      if (needsReturn) {
        await returnToCaptureOrigin(true);
        originCleared = true;
      }
      return submitAck;
    }

    if (submitAck.type === MSG.STATUS_CHANGED) {
      await applyIncomingStatus(submitAck.status as DictationStatusType, 'submit-ack');
    }

    if (needsReturn) {
      await returnToCaptureOrigin(false);
    }

    const completionStatus = await waitForProcessingCompletion();
    if (completionStatus === 'error') {
      await setStatusAndNotify('error');
      if (canPlayAudio()) {
        await playErrorSound();
      }
      if (needsReturn) {
        await returnToCaptureOrigin(true);
        originCleared = true;
      }
      return createMessage.error({
        code: 'UNKNOWN_ERROR',
        message: 'Dictation processing failed.',
      });
    }
    if (!completionStatus) {
      console.warn('[EchoType] Processing completion timeout, capturing anyway');
    }

    if (needsReturn) {
      await activateChatGPTTab(tabInfo, { trackPrevious: false });
    }

    const captureResult = await sendToChatGPTTab<ResultReadyPayload | ErrorPayload>(
      createMessage.cmdSubmit({
        mode: 'capture-only',
        requireChange: completionStatus !== 'idle',
      })
    );

    if (needsReturn) {
      await returnToCaptureOrigin(true);
      originCleared = true;
    } else {
      clearCaptureOrigin();
      originCleared = true;
    }

    if (!captureResult) {
      console.error('[EchoType] No response from ChatGPT tab (capture)');
      return createMessage.error({
        code: 'UNKNOWN_ERROR',
        message: 'No response from ChatGPT tab',
      });
    }

    if (captureResult.type === MSG.ERROR) {
      console.error('[EchoType] Dictation error:', captureResult.error);
      await setStatusAndNotify('error');
      if (canPlayAudio()) {
        await playErrorSound();
      }
      return captureResult;
    }

    if (captureResult.type === MSG.RESULT_READY) {
      const { addedText, capture, clear } = captureResult;

      console.log('[EchoType] Dictation result:', {
        addedTextLength: addedText.length,
        captureReason: capture.reason,
        clearOk: clear.ok,
      });

      await setStatusAndNotify('idle');

      if (addedText) {
        const historyItem = await addToHistory(addedText);
        await showSuccessBadge();
        if (canPlayAudio()) {
          await playSuccessSound();
        }

        if (currentSettings.autoCopyToClipboard) {
          const copied = await writeToClipboard(addedText);
          console.log('[EchoType] Auto-copied to clipboard:', copied);
        }

        broadcastResult(addedText, historyItem);

        if (currentSettings.autoPasteToActiveTab) {
          if (needsReturn && !originCleared) {
            await returnToCaptureOrigin(true);
            originCleared = true;
          }
          await handlePasteLastResult(pasteTargetTabId ?? undefined);
        }
      }

      return captureResult;
    }

    return captureResult;
  } finally {
    submitInFlight = false;
    if (!originCleared) {
      if (needsReturn) {
        await returnToCaptureOrigin(true);
      } else {
        clearCaptureOrigin();
      }
    }
  }
}

/**
 * Handle the paste-last-result command.
 */
async function handlePasteLastResult(targetTabId?: number): Promise<void> {
  console.log('[EchoType] Paste last result command');

  const lastItem = await getLastHistoryItem();
  if (!lastItem) {
    console.log('[EchoType] No history to paste');
    return;
  }

  const tabId = targetTabId ?? await getCurrentTab();
  if (!tabId) {
    console.log('[EchoType] No active tab');
    return;
  }

  const chatgptTab = getChatGPTTabInfo();
  if (chatgptTab?.tabId === tabId) {
    console.log('[EchoType] Skipping auto paste into ChatGPT tab');
    return;
  }

  // Send paste command to target tab
  try {
    await chrome.tabs.sendMessage(tabId, createMessage.pasteText(lastItem.text));
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
      if (currentDictationStatus === 'processing') {
        return;
      }
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
    applyIncomingStatus(statusMessage.status as DictationStatusType, 'content-status');
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
});
