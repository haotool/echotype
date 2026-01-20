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
} from './controller';
import { inspectDOM, performHealthCheck, getDiagnosticInfo, findSubmitButton, detectStatus } from './selectors';
import { readComposerText, captureStableText } from './capture';
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
 * Captures text and sends to background for clipboard copy.
 */
async function handleManualSubmitClick(): Promise<void> {
  if (!manualSubmitAutoCopyEnabled) return;
  
  const status = detectStatus();
  // Only capture if we're in recording/listening state
  if (status !== 'recording' && status !== 'listening') {
    console.log('[EchoType] Manual submit ignored - not in dictation mode:', status);
    return;
  }
  
  console.log('[EchoType] Manual submit detected, capturing text...');
  
  // Wait a moment for the text to appear in composer
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Capture the text
  const preText = readComposerText();
  const capture = await captureStableText(preText, { requireChange: false, timeout: 3000 });
  const text = normalizeText(capture.text);
  
  if (text) {
    console.log('[EchoType] Manual submit captured:', text.substring(0, 50));
    // Send to background for clipboard copy and history
    safeSendMessage({
      type: MSG.MANUAL_SUBMIT_CAPTURE,
      text,
      timestamp: Date.now(),
    });
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
