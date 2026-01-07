/**
 * EchoType - Robust Composer Clear
 * @module content/chatgpt/clear
 *
 * Implements reliable clearing of the ChatGPT ProseMirror composer.
 * Handles framework reactivity and potential refill issues.
 */

import { sleep, isEmptyText } from '@shared/utils';
import type { ClearResult, ClearReason } from '@shared/types';
import { getComposerElement, readComposerRawText } from './selectors';

// ============================================================================
// Configuration
// ============================================================================

export interface ClearConfig {
  /** Maximum number of clear attempts */
  attempts: number;
  /** Timeout per attempt in ms */
  timeoutPerAttempt: number;
  /** Duration to verify empty state in ms */
  verifyDuration: number;
}

export const DEFAULT_CLEAR_CONFIG: ClearConfig = {
  attempts: 4,
  timeoutPerAttempt: 1800,
  verifyDuration: 320,
};

// ============================================================================
// Selection Helpers
// ============================================================================

/**
 * Select all content in an element.
 *
 * @param el - The element to select content in
 * @returns True if successful
 */
function selectAllContent(el: HTMLElement): boolean {
  try {
    el.focus();
    const selection = window.getSelection();
    if (!selection) return false;

    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete the current selection using execCommand.
 *
 * @returns True if command executed
 */
function deleteSelection(): boolean {
  try {
    document.execCommand('selectAll');
    document.execCommand('delete');
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatch input events to notify frameworks of changes.
 *
 * @param el - The element to dispatch events on
 */
function dispatchInputEvents(el: HTMLElement): void {
  try {
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } catch {
    // Ignore event dispatch errors
  }
}

// ============================================================================
// Clear Operations
// ============================================================================

/**
 * Attempt to clear the composer content once.
 *
 * This uses multiple strategies:
 * 1. Focus + selectAll + delete (browser input pipeline)
 * 2. Direct innerHTML manipulation (fallback)
 * 3. Input events to notify ProseMirror
 *
 * @param el - The composer element
 */
function attemptClear(el: HTMLElement): void {
  // Strategy 1: Browser input pipeline
  el.focus();
  selectAllContent(el);
  deleteSelection();

  // Strategy 2: Direct DOM manipulation
  // Some cases execCommand only clears to <p><br></p>
  try {
    el.innerHTML = '<p></p>';
    dispatchInputEvents(el);
  } catch {
    // Ignore manipulation errors
  }
}

/**
 * Read and normalize the current composer text for clearing verification.
 *
 * @returns Current text (raw, not normalized for display)
 */
function readCurrentText(): string {
  return readComposerRawText();
}

// ============================================================================
// Main Clear Function
// ============================================================================

/**
 * Robustly clear the composer with retry and verification.
 *
 * The algorithm:
 * 1. Attempt to clear the content
 * 2. Wait for the empty state to stabilize
 * 3. If framework refills, retry
 * 4. Return success/failure status
 *
 * @param config - Clear configuration
 * @returns Clear result with success status and reason
 */
export async function clearComposerRobust(
  config: Partial<ClearConfig> = {}
): Promise<ClearResult> {
  const { attempts, timeoutPerAttempt, verifyDuration } = {
    ...DEFAULT_CLEAR_CONFIG,
    ...config,
  };

  const el = getComposerElement();
  if (!el) {
    return { ok: false, reason: 'no-composer' };
  }

  for (let attempt = 1; attempt <= attempts; attempt++) {
    // Step 1: Attempt to clear
    attemptClear(el);

    // Step 2: Wait for empty state to stabilize
    const start = performance.now();
    let lastText = readCurrentText();
    let stableStart = performance.now();

    while (performance.now() - start < timeoutPerAttempt) {
      await sleep(80);

      const currentText = readCurrentText();

      // Text changed, reset stability timer
      if (currentText !== lastText) {
        lastText = currentText;
        stableStart = performance.now();
      }

      // Check if empty and stable
      if (isEmptyText(currentText) && performance.now() - stableStart >= verifyDuration) {
        const reason: ClearReason = `cleared-attempt-${attempt}`;
        return { ok: true, reason };
      }
    }
  }

  // All attempts exhausted
  const finalEmpty = isEmptyText(readCurrentText());
  return { ok: finalEmpty, reason: 'clear-timeout' };
}

/**
 * Quick check if the composer is currently empty.
 *
 * @returns True if empty
 */
export function isComposerEmpty(): boolean {
  return isEmptyText(readComposerRawText());
}

/**
 * Force focus on the composer element.
 *
 * @returns True if focused successfully
 */
export function focusComposer(): boolean {
  const el = getComposerElement();
  if (!el) return false;
  el.focus();
  return document.activeElement === el;
}
