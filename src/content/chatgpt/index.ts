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
import { performHealthCheck } from './selectors';

// ============================================================================
// Initialization
// ============================================================================

console.log('[EchoType] ChatGPT content script loaded');

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
      chrome.runtime.sendMessage(statusChange).catch(() => {
        // Ignore send errors (background may not be listening)
      });
    }
  }, 150)
);

// Start observing
statusObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['aria-label'],
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
