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

const globalScope = window as Window & {
  __ECHOTYPE_UNIVERSAL_SCRIPT_LOADED__?: boolean;
};
const alreadyLoaded = Boolean(globalScope.__ECHOTYPE_UNIVERSAL_SCRIPT_LOADED__);

if (!alreadyLoaded) {
  globalScope.__ECHOTYPE_UNIVERSAL_SCRIPT_LOADED__ = true;
}

// ============================================================================ 
// State
// ============================================================================

/** The most recent result received via broadcast */
let lastBroadcastedResult: string | null = null;

interface FocusState {
  element: HTMLElement;
  selectionStart?: number;
  selectionEnd?: number;
  range?: Range;
}

let lastFocusState: FocusState | null = null;

// ============================================================================
// Focus Detection
// ============================================================================

/**
 * Get the currently focused editable element.
 *
 * @returns The focused element or null
 */
function isEditableElement(element: Element | null): element is HTMLElement {
  if (!element) {
    return false;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element instanceof HTMLInputElement) {
      const type = element.type.toLowerCase();
      const textTypes = ['text', 'search', 'url', 'email', 'tel', 'password', ''];
      if (!textTypes.includes(type)) {
        return false;
      }
    }
    return true;
  }

  return element instanceof HTMLElement && element.isContentEditable;
}

function recordFocusState(element: HTMLElement): void {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const selectionStart = element.selectionStart ?? element.value.length;
    const selectionEnd = element.selectionEnd ?? element.value.length;
    lastFocusState = { element, selectionStart, selectionEnd };
    return;
  }

  if (element.isContentEditable) {
    const selection = getSelectionForElement(element);
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : undefined;
    lastFocusState = { element, range };
  }
}

function getFocusedEditableElement(): HTMLElement | null {
  const activeElement = getDeepActiveElement();
  if (isEditableElement(activeElement)) {
    return activeElement;
  }

  if (lastFocusState?.element && lastFocusState.element.isConnected && isEditableElement(lastFocusState.element)) {
    return lastFocusState.element;
  }

  return null;
}

function getDeepActiveElement(): Element | null {
  let active: Element | null = document.activeElement;
  while (active && active instanceof HTMLElement && active.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
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
  // Use execCommand for better compatibility with editors
  const doc = element.ownerDocument;
  const success = doc.execCommand('insertText', false, text);

  if (!success) {
    // Fallback: insert at cursor using Selection API
    const range = ensureSelectionRange(element);
    const selection = getSelectionForElement(element);
    if (selection && range) {
      range.deleteContents();

      const textNode = doc.createTextNode(text);
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

  if (element !== document.activeElement) {
    element.focus();
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    if (lastFocusState?.element === element) {
      const start = lastFocusState.selectionStart ?? element.selectionStart ?? element.value.length;
      const end = lastFocusState.selectionEnd ?? element.selectionEnd ?? element.value.length;
      element.setSelectionRange(start, end);
    }
    pasteIntoInput(element, text);
    return true;
  }

  if (element.isContentEditable) {
    if (lastFocusState?.element === element && lastFocusState.range) {
      const selection = getSelectionForElement(element);
      if (selection && lastFocusState.range.commonAncestorContainer.isConnected) {
        selection.removeAllRanges();
        selection.addRange(lastFocusState.range);
      }
    }
    pasteIntoContentEditable(element, text);
    return true;
  }

  return false;
}

function getSelectionForElement(element: HTMLElement): Selection | null {
  return element.ownerDocument.defaultView?.getSelection() ?? null;
}

function ensureSelectionRange(element: HTMLElement): Range | null {
  const selection = getSelectionForElement(element);
  if (!selection) {
    return null;
  }

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (element.contains(range.commonAncestorContainer)) {
      return range;
    }
  }

  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
}

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Handle incoming messages from background.
 */
if (!alreadyLoaded) {
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

  // Track last focused editable element for paste-after-return flows
  document.addEventListener('focusin', (event) => {
    const editable = getEditableFromEvent(event);
    if (editable) {
      recordFocusState(editable);
    }
  });

  document.addEventListener('selectionchange', () => {
    const active = getFocusedEditableElement();
    if (active) {
      recordFocusState(active);
    }
  });
}

function getEditableFromEvent(event: Event): HTMLElement | null {
  if (typeof event.composedPath === 'function') {
    for (const entry of event.composedPath()) {
      if (entry instanceof HTMLElement && isEditableElement(entry)) {
        return entry;
      }
    }
  }

  const target = event.target as Element | null;
  return isEditableElement(target) ? target : null;
}

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
