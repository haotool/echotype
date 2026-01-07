/**
 * EchoType - Offscreen Document
 * @module offscreen
 *
 * Handles clipboard operations for the extension.
 * MV3 Service Workers don't have DOM access.
 */

import { MSG } from '@shared/protocol';
import type {
  OffscreenClipboardWritePayload,
  OffscreenClipboardResultPayload,
} from '@shared/protocol';

// ============================================================================
// Initialization
// ============================================================================

console.log('[EchoType] Offscreen document loaded');

// ============================================================================
// Clipboard Operations
// ============================================================================

/**
 * Write text to the clipboard.
 *
 * @param text - Text to write
 * @returns Success status
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('[EchoType] Clipboard write error:', error);

    // Fallback using execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const result = document.execCommand('copy');
      textarea.remove();
      return result;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Listen for messages from the background script.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Only handle messages targeted at offscreen
  if (message.target !== 'offscreen') {
    return false;
  }

  // Handle clipboard write request
  if (message.type === MSG.OFFSCREEN_CLIPBOARD_WRITE) {
    const payload = message as OffscreenClipboardWritePayload;

    writeToClipboard(payload.text).then((success) => {
      const response: OffscreenClipboardResultPayload = {
        type: MSG.OFFSCREEN_CLIPBOARD_RESULT,
        success,
        error: success ? undefined : 'Clipboard write failed',
      };
      sendResponse(response);
    });

    return true; // Keep channel open for async response
  }

  // Handle ping (for existence check)
  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
