/**
 * EchoType - ChatGPT DOM Selectors
 * @module content/chatgpt/selectors
 *
 * Centralized DOM selectors for ChatGPT interface.
 * These may change when ChatGPT updates their UI.
 */

import { $ } from '@shared/utils';
import type { DictationStatus, EchoTypeError } from '@shared/types';

// ============================================================================
// Selector Definitions
// ============================================================================

/**
 * ChatGPT DOM selectors using aria-labels for resilience.
 * Chinese labels are used for Traditional Chinese UI.
 */
export const SELECTORS = {
  /** Start dictation button */
  startBtn: 'button[aria-label="聽寫按鈕"]',
  /** Stop dictation button (appears when recording) */
  stopBtn: 'button[aria-label="停止聽寫"]',
  /** Submit dictation button */
  submitBtn: 'button[aria-label="提交聽寫"]',
  /** ProseMirror composer/textarea */
  composer: '#prompt-textarea',
} as const;

/**
 * Alternative selectors for English UI.
 */
export const SELECTORS_EN = {
  startBtn: 'button[aria-label="Voice input"]',
  stopBtn: 'button[aria-label="Stop recording"]',
  submitBtn: 'button[aria-label="Submit recording"]',
  composer: '#prompt-textarea',
} as const;

// ============================================================================
// Element Accessors
// ============================================================================

/**
 * Get the composer (input) element.
 *
 * @returns The composer element or null
 */
export function getComposerElement(): HTMLElement | null {
  const el = $(SELECTORS.composer);
  return el instanceof HTMLElement ? el : null;
}

/**
 * Read text content from the composer.
 *
 * @returns The text content (may include ProseMirror artifacts)
 */
export function readComposerRawText(): string {
  const el = getComposerElement();
  if (!el) return '';
  return el.innerText || el.textContent || '';
}

// ============================================================================
// Status Detection
// ============================================================================

/**
 * Detect current dictation status based on visible buttons.
 *
 * @returns Current status
 */
export function detectStatus(): DictationStatus {
  if ($(SELECTORS.stopBtn)) return 'listening';
  if ($(SELECTORS.startBtn)) return 'idle';
  return 'unknown';
}

/**
 * Check if a specific selector exists in the DOM.
 *
 * @param key - Selector key
 * @returns True if element exists
 */
export function selectorExists(key: keyof typeof SELECTORS): boolean {
  return Boolean($(SELECTORS[key]));
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  missing: string[];
  error?: EchoTypeError;
}

/**
 * Perform health check to verify ChatGPT UI is accessible.
 * This should be called before any operation.
 *
 * @returns Health check result
 */
export function performHealthCheck(): HealthCheckResult {
  const missing: string[] = [];

  // Check composer (required)
  if (!getComposerElement()) {
    missing.push('composer');
  }

  // Check for at least one dictation button
  const hasStartBtn = selectorExists('startBtn');
  const hasStopBtn = selectorExists('stopBtn');

  if (!hasStartBtn && !hasStopBtn) {
    missing.push('dictation buttons');
  }

  const healthy = missing.length === 0;

  return {
    healthy,
    missing,
    error: healthy
      ? undefined
      : {
          code: 'SELECTOR_NOT_FOUND',
          message: `Missing UI elements: ${missing.join(', ')}`,
          detail: 'ChatGPT UI may have changed. Please check for extension updates.',
        },
  };
}

// ============================================================================
// Button Interactions
// ============================================================================

/**
 * Click the start dictation button.
 *
 * @returns True if button was clicked
 */
export function clickStartButton(): boolean {
  const el = $(SELECTORS.startBtn);
  if (el instanceof HTMLElement) {
    el.click();
    return true;
  }
  return false;
}

/**
 * Click the stop dictation button.
 *
 * @returns True if button was clicked
 */
export function clickStopButton(): boolean {
  const el = $(SELECTORS.stopBtn);
  if (el instanceof HTMLElement) {
    el.click();
    return true;
  }
  return false;
}

/**
 * Click the submit dictation button.
 *
 * @returns True if button was clicked
 */
export function clickSubmitButton(): boolean {
  const el = $(SELECTORS.submitBtn);
  if (el instanceof HTMLElement) {
    el.click();
    return true;
  }
  return false;
}
