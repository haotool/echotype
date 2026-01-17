/**
 * EchoType - ChatGPT Content Script Entry Point
 * @module content/chatgpt
 *
 * This script is injected into chatgpt.com pages.
 * It handles dictation control commands from the background script.
 */

import { throttle } from '@shared/utils';
import { MSG } from '@shared/protocol';

import {
  handleCommand,
  checkStatusChange,
  getStatus,
  resetController,
} from './controller';
import { inspectDOM, performHealthCheck, getDiagnosticInfo } from './selectors';

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
