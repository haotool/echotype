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
type LocaleMessages = Record<string, { message: string }>;

const STORAGE_KEY_LANGUAGE = 'echotype_language';
let overrideMessages: LocaleMessages | null = null;

function applySubstitutions(
  message: string,
  substitutions?: string | string[]
): string {
  if (!substitutions) return message;
  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  let result = message;
  values.forEach((value, index) => {
    result = result.replace(new RegExp(`\\$${index + 1}`, 'g'), value);
  });

  const namedPlaceholders = result.match(/\$[A-Z0-9_]+\$/g);
  if (namedPlaceholders) {
    namedPlaceholders.forEach((placeholder, index) => {
      if (values[index]) {
        result = result.replace(new RegExp(placeholder.replace(/\$/g, '\\$&'), 'g'), values[index]);
      }
    });
  }

  return result;
}

function normalizeLocale(locale: string): string {
  return locale.replace('-', '_');
}

function getLocaleCandidates(locale: string): string[] {
  const normalized = normalizeLocale(locale);
  const base = normalized.split('_')[0];
  const candidates = [normalized];
  if (base && base !== normalized) {
    candidates.push(base);
  }
  return Array.from(new Set(candidates));
}

async function loadLocaleMessages(locale: string): Promise<LocaleMessages | null> {
  try {
    const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as LocaleMessages;
  } catch {
    return null;
  }
}

export async function setLocaleOverride(locale: string | null): Promise<boolean> {
  if (!locale) {
    overrideMessages = null;
    return false;
  }

  for (const candidate of getLocaleCandidates(locale)) {
    const messages = await loadLocaleMessages(candidate);
    if (messages) {
      overrideMessages = messages;
      return true;
    }
  }

  overrideMessages = null;
  return false;
}

export async function initI18n(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_LANGUAGE);
    const saved = result[STORAGE_KEY_LANGUAGE] as string | undefined;
    if (saved) {
      await setLocaleOverride(saved);
    }
  } catch {
    // Ignore storage access errors in non-extension contexts
  }
}

export function getMessage(
  key: string,
  substitutions?: string | string[]
): string {
  try {
    if (overrideMessages?.[key]?.message) {
      return applySubstitutions(overrideMessages[key].message, substitutions);
    }
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
    if (key && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
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
