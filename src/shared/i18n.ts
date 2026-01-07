/**
 * EchoType - Internationalization Utilities
 * @module shared/i18n
 *
 * Provides helper functions for i18n support using chrome.i18n API.
 * Updated: 2026-01-08T00:15:00+08:00 [context7:chrome/extensions]
 */

/**
 * Get a localized message by key.
 * Falls back to the key itself if message not found.
 *
 * @param key - The message key from messages.json
 * @param substitutions - Optional substitution values
 * @returns The localized message string
 */
export function getMessage(
  key: string,
  substitutions?: string | string[]
): string {
  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  } catch {
    // Fallback for non-extension context (e.g., testing)
    return key;
  }
}

/**
 * Get the current UI language.
 *
 * @returns The UI language code (e.g., 'en', 'zh-TW')
 */
export function getUILanguage(): string {
  try {
    return chrome.i18n.getUILanguage();
  } catch {
    return 'en';
  }
}

/**
 * Apply i18n translations to elements with data-i18n attribute.
 * Elements should have data-i18n="messageKey" attribute.
 *
 * @example
 * <span data-i18n="btnStart">Start</span>
 * After calling applyI18n(), the text will be replaced with the localized message.
 */
export function applyI18n(): void {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = getMessage(key);
    }
  });

  // Also handle data-i18n-placeholder for input elements
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key && element instanceof HTMLInputElement) {
      element.placeholder = getMessage(key);
    }
  });

  // Handle data-i18n-title for title attributes
  const titleElements = document.querySelectorAll('[data-i18n-title]');
  titleElements.forEach((element) => {
    const key = element.getAttribute('data-i18n-title');
    if (key) {
      element.setAttribute('title', getMessage(key));
    }
  });
}

/**
 * Format a relative time string.
 *
 * @param timestamp - The timestamp in milliseconds
 * @returns A localized relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return getMessage('justNow');
  }

  if (minutes < 60) {
    return getMessage('minutesAgo', String(minutes));
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return getMessage('yesterday');
  }

  return `${days}d ago`;
}
