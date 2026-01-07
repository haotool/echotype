/**
 * EchoType - Universal Content Script
 * @module content/universal
 *
 * Injected into all web pages (except chrome://).
 * Handles pasting dictation results into focused elements.
 */

import { MSG } from '@shared/protocol';
import type {
  PasteTextPayload,
  BroadcastResultPayload,
} from '@shared/protocol';

// ============================================================================
// Initialization
// ============================================================================

// Don't log on every page to avoid noise
// console.log('[EchoType] Universal content script loaded');

// ============================================================================
// State
// ============================================================================

/** The most recent result received via broadcast */
let lastBroadcastedResult: string | null = null;

// ============================================================================
// Focus Detection
// ============================================================================

/**
 * Get the currently focused editable element.
 *
 * @returns The focused element or null
 */
function getFocusedEditableElement(): HTMLElement | null {
  const activeElement = document.activeElement;

  if (!activeElement || activeElement === document.body) {
    return null;
  }

  // Check for input/textarea
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    // Skip non-text inputs
    if (activeElement instanceof HTMLInputElement) {
      const type = activeElement.type.toLowerCase();
      const textTypes = ['text', 'search', 'url', 'email', 'tel', 'password', ''];
      if (!textTypes.includes(type)) {
        return null;
      }
    }
    return activeElement;
  }

  // Check for contenteditable
  if (
    activeElement instanceof HTMLElement &&
    activeElement.isContentEditable
  ) {
    return activeElement;
  }

  return null;
}

// ============================================================================
// Paste Operations
// ============================================================================

/**
 * Paste text into an input or textarea element.
 *
 * @param element - The input/textarea element
 * @param text - Text to paste
 */
function pasteIntoInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string
): void {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;

  // Insert text at cursor position
  const before = element.value.slice(0, start);
  const after = element.value.slice(end);
  element.value = before + text + after;

  // Move cursor to end of inserted text
  const newPosition = start + text.length;
  element.setSelectionRange(newPosition, newPosition);

  // Trigger input event for frameworks
  element.dispatchEvent(new InputEvent('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Paste text into a contenteditable element.
 *
 * @param element - The contenteditable element
 * @param text - Text to paste
 */
function pasteIntoContentEditable(element: HTMLElement, text: string): void {
  element.focus();

  // Use execCommand for better compatibility with editors
  const success = document.execCommand('insertText', false, text);

  if (!success) {
    // Fallback: insert at cursor using Selection API
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // Trigger input event
  element.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

/**
 * Paste text into the currently focused element.
 *
 * @param text - Text to paste
 * @returns True if successful
 */
function pasteIntoFocusedElement(text: string): boolean {
  const element = getFocusedEditableElement();

  if (!element) {
    console.log('[EchoType] No focused editable element');
    return false;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    pasteIntoInput(element, text);
    return true;
  }

  if (element.isContentEditable) {
    pasteIntoContentEditable(element, text);
    return true;
  }

  return false;
}

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Handle incoming messages from background.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle paste text command
  if (message.type === MSG.PASTE_TEXT) {
    const payload = message as PasteTextPayload;
    const success = pasteIntoFocusedElement(payload.text);
    sendResponse({ ok: success });
    return false;
  }

  // Handle paste last result command
  if (message.type === MSG.PASTE_LAST_RESULT) {
    if (lastBroadcastedResult) {
      const success = pasteIntoFocusedElement(lastBroadcastedResult);
      sendResponse({ ok: success });
    } else {
      sendResponse({ ok: false, error: 'No result available' });
    }
    return false;
  }

  // Handle broadcast result (store for later use)
  if (message.type === MSG.BROADCAST_RESULT) {
    const payload = message as BroadcastResultPayload;
    lastBroadcastedResult = payload.text;
    // No response needed for broadcasts
    return false;
  }

  return false;
});

// ============================================================================
// Debug API
// ============================================================================

// Expose debug API for development
if (process.env.NODE_ENV === 'development') {
  (window as unknown as { __ECHOTYPE_UNIVERSAL__: unknown }).__ECHOTYPE_UNIVERSAL__ = {
    getFocusedEditableElement,
    pasteIntoFocusedElement,
    getLastResult: () => lastBroadcastedResult,
  };
}
