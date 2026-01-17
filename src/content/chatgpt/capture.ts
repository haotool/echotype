/**
 * EchoType - Stable Text Capture
 * @module content/chatgpt/capture
 *
 * Implements the "wait for change + stable window" pattern
 * to reliably capture ChatGPT's transcription results.
 */

import { sleep, normalizeText } from '@shared/utils';
import type { CaptureResult, CaptureReason } from '@shared/types';
import { readComposerRawText, detectStatus } from './selectors';

// ============================================================================
// Configuration
// ============================================================================

export interface CaptureConfig {
  /** Polling interval in ms */
  interval: number;
  /** Duration of stability required in ms */
  stableMs: number;
  /** Maximum wait time in ms */
  timeout: number;
  /** Require content to change from old value */
  requireChange: boolean;
}

export const DEFAULT_CAPTURE_CONFIG: CaptureConfig = {
  interval: 80,
  stableMs: 520,
  timeout: 9000,
  requireChange: true,
};

// ============================================================================
// State
// ============================================================================

let captureToken = 0;

/**
 * Cancel any ongoing capture operation.
 */
export function cancelCapture(): void {
  captureToken++;
}

// ============================================================================
// Core Capture Functions
// ============================================================================

/**
 * Read and normalize the current composer text.
 *
 * @returns Normalized text content
 */
export function readComposerText(): string {
  return normalizeText(readComposerRawText());
}

/**
 * Wait for the composer content to change from the old value.
 *
 * @param oldText - The previous text to compare against
 * @param timeout - Maximum wait time in ms
 * @returns Result with success status and current text
 */
export async function waitForComposerChange(
  oldText: string,
  timeout: number = 5000
): Promise<{ ok: boolean; text: string; reason: string }> {
  const oldNormalized = normalizeText(oldText);
  const start = performance.now();

  while (performance.now() - start < timeout) {
    const current = readComposerText();
    if (normalizeText(current) !== oldNormalized) {
      return { ok: true, text: current, reason: 'changed' };
    }
    await sleep(60);
  }

  return { ok: false, text: readComposerText(), reason: 'no-change-timeout' };
}

/**
 * Wait for the dictation status to return to idle.
 *
 * @param timeout - Maximum wait time in ms
 * @returns Result with success status
 */
export async function waitForStatusIdle(
  timeout: number = 5000
): Promise<{ ok: boolean; reason: string }> {
  const start = performance.now();

  while (performance.now() - start < timeout) {
    if (detectStatus() === 'idle') {
      return { ok: true, reason: 'idle' };
    }
    await sleep(80);
  }

  return { ok: false, reason: 'idle-timeout' };
}

/**
 * Capture stable composer text after a change has been detected.
 *
 * This is the core capture algorithm:
 * 1. Wait for content to change from oldText (if requireChange is true)
 * 2. Once changed, wait for content to stabilize (no changes for stableMs)
 * 3. Return the stable content
 *
 * @param oldText - The text before the operation (for change detection)
 * @param config - Capture configuration
 * @returns Capture result with text and reason
 */
export async function captureStableText(
  oldText: string,
  config: Partial<CaptureConfig> = {}
): Promise<CaptureResult> {
  const { interval, stableMs, timeout, requireChange } = {
    ...DEFAULT_CAPTURE_CONFIG,
    ...config,
  };

  // Get a unique token for this capture operation
  const token = ++captureToken;
  const oldNormalized = normalizeText(oldText);
  const start = performance.now();

  let lastText = readComposerText();
  let stableStart = performance.now();
  let sawChange = !requireChange;

  while (true) {
    // Check if this capture was canceled
    if (token !== captureToken) {
      return { text: readComposerText(), reason: 'canceled' };
    }

    await sleep(interval);

    const now = performance.now();
    const currentText = readComposerText();

    // Check for initial change (if required)
    if (!sawChange && normalizeText(currentText) !== oldNormalized) {
      sawChange = true;
      lastText = currentText;
      stableStart = now;
    }

    // Check for subsequent changes after initial change
    if (sawChange && currentText !== lastText) {
      lastText = currentText;
      stableStart = now;
    }

    // Check for stability
    if (sawChange && now - stableStart >= stableMs) {
      return { text: currentText, reason: 'stable' };
    }

    // Check for timeout
    if (now - start >= timeout) {
      const reason: CaptureReason = sawChange ? 'timeout' : 'timeout-without-change';
      return { text: currentText, reason };
    }
  }
}

/**
 * Full capture workflow: wait for change signal, then capture stable text.
 *
 * This combines waiting for initial change (or status idle) with
 * the stable capture algorithm for maximum reliability.
 *
 * @param preSubmitText - Text before submit was clicked
 * @param config - Capture configuration
 * @returns Capture result
 */
export async function captureAfterSubmit(
  preSubmitText: string,
  config: Partial<CaptureConfig> = {}
): Promise<CaptureResult> {
  const requireChange = config.requireChange ?? true;
  // First, quickly wait for a change signal
  // This prevents declaring stable on unchanged content
  await Promise.race([
    waitForComposerChange(preSubmitText, 4500),
    waitForStatusIdle(4500),
  ]).catch(() => {
    // Ignore errors, proceed to stable capture
  });

  // Now do the full stable capture
  return captureStableText(preSubmitText, {
    ...config,
    requireChange,
  });
}
