/**
 * EchoType - Shared Utility Functions
 * @module shared/utils
 *
 * Extracted and refined from demo.js
 */

// ============================================================================
// Text Processing
// ============================================================================

/**
 * Normalize text by cleaning up whitespace and special characters.
 * Handles ProseMirror's non-breaking spaces and other quirks.
 *
 * @param text - The text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string | null | undefined): string {
  return String(text || '')
    .replace(/\u00A0/g, ' ') // Non-breaking space → regular space
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/[ \t]+\n/g, '\n') // Trailing whitespace before newline
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();
}

/**
 * Check if text is effectively empty.
 * ProseMirror often leaves <p></p> or <p><br></p> which results in "" or "\n".
 *
 * @param text - The text to check
 * @returns True if text is empty or whitespace-only
 */
export function isEmptyText(text: string | null | undefined): boolean {
  return normalizeText(text).replace(/\n/g, '').trim() === '';
}

/**
 * Escape HTML special characters for safe display.
 *
 * @param text - The text to escape
 * @returns HTML-escaped text
 */
export function escapeHTML(text: string): string {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ============================================================================
// Time & ID Generation
// ============================================================================

/**
 * Get current time as HH:MM:SS string.
 *
 * @returns Time string in format "HH:MM:SS"
 */
export function nowTimestamp(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/**
 * Generate a unique ID combining timestamp and random string.
 *
 * @returns Unique ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a throttled version of a function.
 *
 * @param fn - The function to throttle
 * @param wait - Minimum time between calls in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): T {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  }) as T;
}

/**
 * Create a debounced version of a function.
 *
 * @param fn - The function to debounce
 * @param wait - Wait time in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): T {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  }) as T;
}

// ============================================================================
// Clipboard
// ============================================================================

/**
 * Copy text to clipboard using modern Clipboard API with fallback.
 * Note: In content scripts, this may require user gesture.
 * For background, use Offscreen Document.
 *
 * @param text - The text to copy
 * @returns True if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  try {
    await navigator.clipboard.writeText(normalized);
    return true;
  } catch {
    // Fallback for older browsers or permission issues
    try {
      const textarea = document.createElement('textarea');
      textarea.value = normalized;
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
// DOM Utilities (Content Script Only)
// ============================================================================

/**
 * Query selector with optional root element.
 *
 * @param selector - CSS selector
 * @param root - Root element (defaults to document)
 * @returns Element or null
 */
export function $(
  selector: string,
  root: Document | Element = document
): Element | null {
  return root.querySelector(selector);
}

/**
 * Check if an element exists in the DOM.
 *
 * @param selector - CSS selector
 * @returns True if element exists
 */
export function exists(selector: string): boolean {
  return Boolean($(selector));
}

/**
 * Safely click an element by selector.
 *
 * @param selector - CSS selector
 * @returns True if element was found and clicked
 */
export function safeClick(selector: string): boolean {
  const el = $(selector);
  if (!el || !(el instanceof HTMLElement)) return false;
  el.click();
  return true;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a value is a non-empty string.
 *
 * @param value - The value to check
 * @returns True if non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Assert that a condition is true, throw if false.
 *
 * @param condition - The condition to check
 * @param message - Error message
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
