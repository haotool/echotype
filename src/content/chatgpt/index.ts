/**
 * EchoType - ChatGPT Content Script Entry Point
 * @module content/chatgpt
 *
 * This script is injected into chatgpt.com pages.
 * It handles dictation control commands from the background script.
 */

import { throttle } from '@shared/utils';
import { MSG } from '@shared/protocol';
import type { EchoTypeSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';

import {
  handleCommand,
  checkStatusChange,
  getStatus,
  resetController,
  getControllerState,
} from './controller';
import { inspectDOM, performHealthCheck, getDiagnosticInfo, findSubmitButton, detectStatus } from './selectors';
import { readComposerText, captureAfterSubmit } from './capture';
import { clearComposerRobust } from './clear';
import { computeAddedText } from './diff';
import { normalizeText } from '@shared/utils';

// ============================================================================
// Initialization
// ============================================================================

const globalScope = window as Window & { __ECHOTYPE_CONTENT_SCRIPT_LOADED__?: boolean };

if (globalScope.__ECHOTYPE_CONTENT_SCRIPT_LOADED__) {
  console.log('[EchoType] ChatGPT content script already loaded');
} else {
  globalScope.__ECHOTYPE_CONTENT_SCRIPT_LOADED__ = true;
  console.log('[EchoType] ChatGPT content script loaded');

function safeSendMessage(message: unknown): void {
  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore send errors (background may be unavailable)
    });
  } catch (error) {
    // Extension context may be invalidated after reload
    console.warn('[EchoType] Message send failed:', error);
  }
}

// Perform initial health check
  const health = performHealthCheck();
  if (!health.healthy) {
    console.warn('[EchoType] Health check failed:', health.missing);
  } else {
    console.log('[EchoType] Health check passed, status:', getStatus());
  }

// ============================================================================
// Message Listener
// ============================================================================

/**
 * Listen for messages from the background script.
 */
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Check if this is a command message
  if (
    message.type === MSG.CMD_START ||
    message.type === MSG.CMD_PAUSE ||
    message.type === MSG.CMD_SUBMIT ||
    message.type === MSG.CMD_GET_STATUS
  ) {
    // Handle async commands
    handleCommand(message, sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === MSG.INSPECT_DOM) {
    inspectDOM(true);
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === MSG.DEV_HANDSHAKE) {
    sendResponse({
      ok: true,
      url: location.href,
      readyState: document.readyState,
    });
    return false;
  }

  // Get diagnostic info for Developer Mode
  if (message.type === MSG.GET_DIAGNOSTIC) {
    const diagnostic = getDiagnosticInfo();
    sendResponse({ ok: true, diagnostic });
    return false;
  }

  return false;
  });

// ============================================================================
// Status Change Observer
// ============================================================================

/**
 * Observe DOM mutations to detect status changes.
 * Throttled to prevent excessive updates.
 */
  const statusObserver = new MutationObserver(
  throttle(() => {
    const statusChange = checkStatusChange();
    if (statusChange) {
      // Notify background of status change
      safeSendMessage(statusChange);
    }
  }, 150)
);

// Start observing
  statusObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-disabled', 'disabled', 'class', 'style', 'hidden'],
  });

// ============================================================================
// Manual Submit Button Click Listener
// ============================================================================

const STORAGE_KEY = 'echotype_settings';
let manualSubmitAutoCopyEnabled = false;

/**
 * Load settings to check if manual submit auto-copy is enabled.
 */
async function loadManualSubmitSetting(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const settings = result[STORAGE_KEY] as Partial<EchoTypeSettings> | undefined;
    manualSubmitAutoCopyEnabled = settings?.manualSubmitAutoCopy ?? DEFAULT_SETTINGS.manualSubmitAutoCopy;
    console.log('[EchoType] Manual submit auto-copy:', manualSubmitAutoCopyEnabled);
  } catch {
    manualSubmitAutoCopyEnabled = false;
  }
}

// Load setting initially
loadManualSubmitSetting();

// Listen for setting changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[STORAGE_KEY]?.newValue) {
    const newSettings = changes[STORAGE_KEY].newValue as Partial<EchoTypeSettings>;
    manualSubmitAutoCopyEnabled = newSettings.manualSubmitAutoCopy ?? false;
    console.log('[EchoType] Manual submit auto-copy updated:', manualSubmitAutoCopyEnabled);
  }
});

/**
 * Handle manual submit button click.
 * Mirrors the full popup submit workflow:
 * 1. Wait for text to appear in composer
 * 2. Capture stable text
 * 3. Compute added text (baseline diff)
 * 4. Clear the composer
 * 5. Send to background for clipboard copy and history
 */
async function handleManualSubmitClick(): Promise<void> {
  if (!manualSubmitAutoCopyEnabled) return;
  
  const status = detectStatus();
  // Only capture if we're in recording/listening state
  if (status !== 'recording' && status !== 'listening') {
    console.log('[EchoType] Manual submit ignored - not in dictation mode:', status);
    return;
  }
  
  console.log('[EchoType] Manual submit detected, starting full capture workflow...');
  
  // Get baseline text from controller state (captured when dictation started)
  const controllerState = getControllerState();
  const baselineText = controllerState.baselineText || '';
  console.log('[EchoType] Baseline text:', baselineText.substring(0, 50));
  
  // Wait a moment for the submit click to be processed
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Read pre-submit text (may still be showing waveform)
  const preSubmitText = readComposerText();
  
  // Capture stable text after submit (same as popup workflow)
  // This waits for the text to appear and stabilize
  const capture = await captureAfterSubmit(preSubmitText, {
    requireChange: false, // Don't require change since user manually clicked
  });
  
  const finalText = normalizeText(capture.text);
  const addedText = computeAddedText(baselineText, finalText);
  
  console.log('[EchoType] Manual submit captured:', {
    finalText: finalText.substring(0, 50),
    addedText: addedText.substring(0, 50),
    captureReason: capture.reason,
  });
  
  // Clear the composer (same as popup workflow)
  const clearResult = await clearComposerRobust();
  console.log('[EchoType] Composer cleared:', clearResult);
  
  // Reset controller state
  resetController();
  
  // Send result to background for clipboard copy and history
  // Use addedText (baseline diff) as the primary result, same as popup
  const textToSave = addedText || finalText;
  if (textToSave) {
    safeSendMessage({
      type: MSG.MANUAL_SUBMIT_CAPTURE,
      text: textToSave,
      timestamp: Date.now(),
    });
    console.log('[EchoType] Manual submit complete, sent to background');
  } else {
    console.log('[EchoType] Manual submit: no text captured');
  }
}

/**
 * Set up click listener for submit button.
 * Uses event delegation on document body.
 */
function setupManualSubmitListener(): void {
  document.body.addEventListener('click', (event) => {
    if (!manualSubmitAutoCopyEnabled) return;
    
    const target = event.target as HTMLElement;
    const submitBtn = findSubmitButton();
    
    // Check if clicked element is or is within the submit button
    if (submitBtn && (target === submitBtn || submitBtn.contains(target))) {
      // Use setTimeout to let the click complete first
      setTimeout(() => {
        handleManualSubmitClick().catch(console.error);
      }, 50);
    }
  }, true); // Use capture phase to detect before default handlers
}

// Initialize manual submit listener
setupManualSubmitListener();

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Cleanup on unload.
 */
  window.addEventListener('unload', () => {
    statusObserver.disconnect();
    resetController();
    console.log('[EchoType] ChatGPT content script unloaded');
  });

// ============================================================================
// Debug API
// ============================================================================

// Expose debug API for development
  if (process.env.NODE_ENV === 'development') {
    (window as unknown as { __ECHOTYPE_DEBUG__: unknown }).__ECHOTYPE_DEBUG__ = {
      getStatus,
      checkStatusChange,
      resetController,
      performHealthCheck,
    };
  }
}
