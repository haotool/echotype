/**
 * EchoType - ChatGPT DOM Selectors
 * @module content/chatgpt/selectors
 *
 * Centralized DOM selectors for ChatGPT interface.
 * Supports multiple languages and handles UI changes gracefully.
 * 
 * Strategy: SVG href fragments are prioritized for stability,
 * with aria-label as fallback for accessibility.
 * 
 * @version 3.0.0
 * @updated 2026-01-09
 */

import { $ } from '@shared/utils';
import type { DictationStatus, EchoTypeError } from '@shared/types';

// ============================================================================
// Selector Definitions
// ============================================================================

/**
 * SVG href fragments for dictation buttons.
 * These are more stable than aria-labels as they reference specific icon IDs.
 * 
 * Note: These values should be updated if ChatGPT changes their icon system.
 */
const SVG_HREFS = {
  // Start dictation button icon (microphone)
  start: ['#29f921', '#microphone', '#mic-icon'],
  // Stop/Cancel dictation button icon (stop/pause)
  stop: ['#85f94b', '#stop-icon', '#pause-icon'],
  // Submit dictation button icon (send/check)
  submit: ['#fa1dbd', '#send-icon', '#check-icon'],
} as const;

/**
 * Multi-language aria-label selectors for dictation buttons.
 * ChatGPT uses different labels based on user's language setting.
 * Used as fallback when SVG selectors don't match.
 */
const DICTATION_LABELS = {
  start: [
    // Traditional Chinese
    '聽寫按鈕',
    '語音輸入',
    // Simplified Chinese  
    '听写按钮',
    '语音输入',
    // English
    'Voice input',
    'Dictation button',
    'Start voice input',
    'Record voice',
  ],
  stop: [
    // Traditional Chinese
    '停止聽寫',
    '停止錄音',
    // Simplified Chinese
    '停止听写',
    '停止录音',
    // English
    'Stop recording',
    'Stop dictation',
    'Stop voice input',
  ],
  submit: [
    // Traditional Chinese
    '提交聽寫',
    '傳送聽寫',
    // Simplified Chinese
    '提交听写',
    '发送听写',
    // English
    'Submit recording',
    'Submit dictation',
    'Send voice input',
  ],
} as const;

/**
 * Build selector string prioritizing SVG href, with aria-label fallback.
 * 
 * @param svgHrefs - SVG href fragments to match
 * @param ariaLabels - Aria-label values as fallback
 * @returns Combined CSS selector string
 */
function buildButtonSelector(
  svgHrefs: readonly string[],
  ariaLabels: readonly string[]
): string {
  // SVG href selectors (priority)
  const svgSelectors = svgHrefs.map(
    href => `button:has(svg use[href*="${href}"])`
  );
  
  // Aria-label selectors (fallback)
  const ariaSelectors = ariaLabels.map(
    label => `button[aria-label="${label}"]`
  );
  
  return [...svgSelectors, ...ariaSelectors].join(', ');
}

/**
 * Build selector string from multiple aria-labels only
 * @deprecated Use buildButtonSelector for better stability
 */
export function buildAriaLabelSelector(labels: readonly string[]): string {
  return labels.map(label => `button[aria-label="${label}"]`).join(', ');
}

/**
 * ChatGPT DOM selectors with SVG priority and multi-language fallback.
 */
export const SELECTORS = {
  /** Start dictation button (SVG priority, aria-label fallback) */
  startBtn: buildButtonSelector(SVG_HREFS.start, DICTATION_LABELS.start),
  /** Stop dictation button (appears when recording) */
  stopBtn: buildButtonSelector(SVG_HREFS.stop, DICTATION_LABELS.stop),
  /** Submit dictation button */
  submitBtn: buildButtonSelector(SVG_HREFS.submit, DICTATION_LABELS.submit),
  /** ProseMirror composer/textarea - primary selector */
  composer: '#prompt-textarea',
  /** Alternative composer selectors */
  composerAlt: [
    '#prompt-textarea',
    '[data-testid="prompt-textarea"]',
    '[data-testid="prompt-textarea"] [contenteditable="true"]',
    '[contenteditable="true"][data-virtualkeyboard]',
    'textarea[name="prompt-textarea"]',
    'textarea[data-testid="prompt-textarea"]',
    '.ProseMirror[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
  ],
} as const;

// ============================================================================
// Debug Logger
// ============================================================================

const DEBUG = process.env.NODE_ENV === 'development';

function log(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[EchoType:Selectors]', ...args);
  }
}

// ============================================================================
// Element Accessors
// ============================================================================

/**
 * Get the composer (input) element.
 * Tries multiple selectors for resilience.
 *
 * @returns The composer element or null
 */
export function getComposerElement(): HTMLElement | null {
  // Try primary selector first
  let el = $(SELECTORS.composer);
  if (el instanceof HTMLElement) {
    return el;
  }
  
  // Try alternative selectors
  for (const selector of SELECTORS.composerAlt) {
    el = $(selector);
    if (el instanceof HTMLElement) {
      log('Found composer with alt selector:', selector);
      return el;
    }
  }
  
  return null;
}

/**
 * Read text content from the composer.
 *
 * @returns The text content (may include ProseMirror artifacts)
 */
export function readComposerRawText(): string {
  const el = getComposerElement();
  if (!el) return '';
  if (el instanceof HTMLTextAreaElement) {
    return el.value || '';
  }
  return el.innerText || el.textContent || '';
}

/**
 * Wait for the composer element to appear.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns True if composer is found before timeout
 */
export async function waitForComposer(timeoutMs = 3000): Promise<boolean> {
  if (getComposerElement()) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      if (getComposerElement()) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// ============================================================================
// Button Finders
// ============================================================================

/**
 * Find the start dictation button.
 */
export function findStartButton(): HTMLButtonElement | null {
  const el = $(SELECTORS.startBtn);
  return el instanceof HTMLButtonElement ? el : null;
}

/**
 * Find the stop dictation button.
 */
export function findStopButton(): HTMLButtonElement | null {
  const el = $(SELECTORS.stopBtn);
  return el instanceof HTMLButtonElement ? el : null;
}

/**
 * Find the submit dictation button.
 */
export function findSubmitButton(): HTMLButtonElement | null {
  const el = $(SELECTORS.submitBtn);
  return el instanceof HTMLButtonElement ? el : null;
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
  if (findStopButton()) return 'listening';
  if (findStartButton()) return 'idle';
  return 'unknown';
}

/**
 * Check if a specific button type exists in the DOM.
 *
 * @param type - Button type to check
 * @returns True if button exists
 */
export function buttonExists(type: 'start' | 'stop' | 'submit'): boolean {
  switch (type) {
    case 'start': return Boolean(findStartButton());
    case 'stop': return Boolean(findStopButton());
    case 'submit': return Boolean(findSubmitButton());
    default: return false;
  }
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  missing: string[];
  warnings: string[];
  error?: EchoTypeError;
  debug?: {
    composerFound: boolean;
    startBtnFound: boolean;
    stopBtnFound: boolean;
    submitBtnFound: boolean;
  };
}

/**
 * Perform health check to verify ChatGPT UI is accessible.
 * This should be called before any operation.
 *
 * @returns Health check result with detailed diagnostics
 */
export function performHealthCheck(): HealthCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const composerFound = Boolean(getComposerElement());
  const startBtnFound = Boolean(findStartButton());
  const stopBtnFound = Boolean(findStopButton());
  const submitBtnFound = Boolean(findSubmitButton());
  const dictationControlsFound = stopBtnFound || submitBtnFound;

  // Check composer (required)
  if (!composerFound) {
    missing.push('composer');
  }

  // Check for dictation buttons
  // Note: Only start OR stop button needs to be present (not both)
  // If neither is found, it might mean:
  // 1. User is not logged in
  // 2. Voice input is not available in this region
  // 3. DOM has changed
  if (!startBtnFound && !stopBtnFound) {
    // This is a warning, not a critical error
    // User might need to log in or enable voice input
    warnings.push('dictation buttons not found (login may be required)');
  }

  // If dictation is active, composer may be replaced by waveform canvas.
  // Consider health OK when dictation controls are present.
  if (!composerFound && dictationControlsFound) {
    warnings.push('composer hidden during dictation');
  }

  // For MVP, we require composer unless dictation controls indicate active dictation
  const healthy = composerFound || dictationControlsFound;

  return {
    healthy,
    missing,
    warnings,
    error: healthy
      ? undefined
      : {
          code: 'SELECTOR_NOT_FOUND',
          message: `Missing UI elements: ${missing.join(', ')}`,
          detail: missing.includes('composer')
            ? 'ChatGPT page may not be fully loaded. Please wait and try again.'
            : 'Voice input may not be available. Please ensure you are logged in to ChatGPT.',
        },
    debug: {
      composerFound,
      startBtnFound,
      stopBtnFound,
      submitBtnFound,
    },
  };
}

/**
 * Check if voice input feature is available.
 * This requires user to be logged in and have voice input enabled.
 */
export function isVoiceInputAvailable(): boolean {
  return Boolean(findStartButton() || findStopButton());
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
  const el = findStartButton();
  if (el) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      log('Start button is disabled');
      return false;
    }
    log('Clicking start button');
    el.click();
    return true;
  }
  log('Start button not found');
  return false;
}

/**
 * Click the stop dictation button.
 *
 * @returns True if button was clicked
 */
export function clickStopButton(): boolean {
  const el = findStopButton();
  if (el) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      log('Stop button is disabled');
      return false;
    }
    log('Clicking stop button');
    el.click();
    return true;
  }
  log('Stop button not found');
  return false;
}

/**
 * Click the submit dictation button.
 *
 * @returns True if button was clicked
 */
export function clickSubmitButton(): boolean {
  const el = findSubmitButton();
  if (el) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      log('Submit button is disabled');
      return false;
    }
    log('Clicking submit button');
    el.click();
    return true;
  }
  log('Submit button not found');
  return false;
}

// ============================================================================
// DOM Inspector (Development)
// ============================================================================

/**
 * Inspect DOM for dictation-related elements.
 * Useful for debugging selector issues.
 */
export function inspectDOM(force = false): void {
  if (!DEBUG && !force) return;
  
  console.group('[EchoType] DOM Inspection');
  
  // Find all buttons with aria-label
  const buttons = document.querySelectorAll('button[aria-label]');
  console.log('Buttons with aria-label:', buttons.length);
  buttons.forEach(btn => {
    const label = btn.getAttribute('aria-label');
    if (label?.toLowerCase().includes('voice') || 
        label?.toLowerCase().includes('record') ||
        label?.toLowerCase().includes('dictation') ||
        label?.includes('聽寫') ||
        label?.includes('錄音') ||
        label?.includes('語音')) {
      console.log(`  Found: "${label}"`);
    }
  });
  
  // Check composer
  const composer = getComposerElement();
  console.log('Composer found:', Boolean(composer), composer?.tagName, composer?.className);
  
  // Check health
  const health = performHealthCheck();
  console.log('Health check:', health);
  
  console.groupEnd();
}

// Export for development debugging
if (DEBUG) {
  (window as unknown as { __ECHOTYPE_SELECTORS__: unknown }).__ECHOTYPE_SELECTORS__ = {
    SELECTORS,
    DICTATION_LABELS,
    inspectDOM,
    performHealthCheck,
    getComposerElement,
    findStartButton,
    findStopButton,
    findSubmitButton,
  };
}
