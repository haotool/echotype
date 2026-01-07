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
import type { HistoryItem } from '@shared/types';

import { loadSettings, onSettingsChange } from './settings';
import {
  ensureChatGPTTab,
  sendToChatGPTTab,
  returnToPreviousTab,
  getCurrentTab,
} from './tab-manager';
import { writeToClipboard } from './offscreen-bridge';
import { addToHistory, loadHistory, getLastHistoryItem } from './history';
import { updateBadge, showSuccessBadge, showErrorBadge, initBadge } from './badge';
import { playStartSound, playSuccessSound, playErrorSound } from './audio';
import './keepalive'; // Keep service worker alive

// ============================================================================
// Initialization
// ============================================================================

console.log('[EchoType] Background service worker started');

// Current settings (loaded async)
let currentSettings = {
  autoCopyToClipboard: true,
  autoPasteToActiveTab: false,
  returnFocusAfterStart: false,
  historySize: 5,
};

// Initialize settings and badge asynchronously
(async () => {
  currentSettings = await loadSettings();
  console.log('[EchoType] Settings loaded:', currentSettings);
  await initBadge();
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
 */
async function handleStartDictation(): Promise<void> {
  console.log('[EchoType] Start dictation command');

  // Ensure ChatGPT tab exists and is active
  const tabInfo = await ensureChatGPTTab(true);
  if (!tabInfo) {
    console.error('[EchoType] Failed to get ChatGPT tab');
    return;
  }

  // Wait a bit for tab to be ready
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Send start command to content script
  const result = await sendToChatGPTTab<{ ok: boolean; error?: unknown }>(
    createMessage.cmdStart('snapshot')
  );

  if (result?.ok) {
    console.log('[EchoType] Dictation started');
    await updateBadge('recording');
    await playStartSound();

    // Return to previous tab if setting enabled
    if (currentSettings.returnFocusAfterStart) {
      await returnToPreviousTab();
    }
  } else {
    console.error('[EchoType] Failed to start dictation:', result?.error);
    await showErrorBadge();
    await playErrorSound();
  }
}

/**
 * Handle the pause-dictation command.
 */
async function handlePauseDictation(): Promise<void> {
  console.log('[EchoType] Pause dictation command');

  const result = await sendToChatGPTTab<{ ok: boolean }>(
    createMessage.cmdPause()
  );

  if (result?.ok) {
    console.log('[EchoType] Dictation paused');
    await updateBadge('idle');
  }
}

/**
 * Handle the submit-dictation command.
 */
async function handleSubmitDictation(): Promise<void> {
  console.log('[EchoType] Submit dictation command');
  await updateBadge('processing');

  const result = await sendToChatGPTTab<ResultReadyPayload | ErrorPayload>(
    createMessage.cmdSubmit(true)
  );

  if (!result) {
    console.error('[EchoType] No response from ChatGPT tab');
    return;
  }

  if (result.type === MSG.ERROR) {
    console.error('[EchoType] Dictation error:', result.error);
    await showErrorBadge();
    await playErrorSound();
    return;
  }

  if (result.type === MSG.RESULT_READY) {
    const { addedText, capture, clear } = result;

    console.log('[EchoType] Dictation result:', {
      addedTextLength: addedText.length,
      captureReason: capture.reason,
      clearOk: clear.ok,
    });

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
  }
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
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[EchoType] Command received:', command);

  switch (command) {
    case 'start-dictation':
      await handleStartDictation();
      break;
    case 'pause-dictation':
      await handlePauseDictation();
      break;
    case 'submit-dictation':
      await handleSubmitDictation();
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
  // Handle status changes from ChatGPT content script
  if (message.type === MSG.STATUS_CHANGED) {
    const statusMessage = message as StatusChangedPayload;
    console.log('[EchoType] Status changed:', statusMessage.status);
    return false;
  }

  // Handle status requests from popup
  if (message.type === MSG.GET_STATUS) {
    sendResponse({ status: 'idle' }); // TODO: track actual status
    return false;
  }

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
