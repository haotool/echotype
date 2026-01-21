/**
 * EchoType - Centralized Constants
 * @module shared/constants
 *
 * Single source of truth for all storage keys, URLs, and other constants.
 * This eliminates duplicate definitions across the codebase.
 */

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * All storage keys used by the extension.
 * Centralizing these prevents typos and makes refactoring easier.
 */
export const STORAGE_KEYS = {
  /** User settings (chrome.storage.sync) */
  SETTINGS: 'echotype_settings',
  /** Theme preference (chrome.storage.local) */
  THEME: 'echotype_theme',
  /** Language preference (chrome.storage.local) */
  LANGUAGE: 'echotype_language',
  /** Developer mode flag (chrome.storage.local) */
  DEV_MODE: 'echotype_dev_mode',
  /** Dictation history (chrome.storage.session) */
  HISTORY: 'echotype_history',
  /** Current dictation status (chrome.storage.session) */
  DICTATION_STATUS: 'echotype_dictation_status',
  /** Heartbeat data (chrome.storage.local) */
  HEARTBEAT: 'echotype-heartbeat',
} as const;

// ============================================================================
// URLs
// ============================================================================

/**
 * ChatGPT-related URLs and patterns.
 */
export const CHATGPT_URLS = {
  /** Base URL for ChatGPT */
  BASE: 'https://chatgpt.com',
  /** URL for temporary chat (no history) */
  TEMPORARY_CHAT: 'https://chatgpt.com/?temporary-chat=true',
  /** URL pattern for matching ChatGPT tabs */
  PATTERN: 'https://chatgpt.com/*',
} as const;

// ============================================================================
// Paths
// ============================================================================

/**
 * Extension internal paths.
 */
export const PATHS = {
  /** Offscreen document HTML path */
  OFFSCREEN_DOCUMENT: 'src/offscreen/index.html',
  /** Tone worklet for audio */
  TONE_WORKLET: 'tone-worklet.js',
} as const;

// ============================================================================
// Alarm Names
// ============================================================================

/**
 * Chrome alarms API names.
 */
export const ALARM_NAMES = {
  /** Keep-alive alarm to prevent service worker termination */
  KEEPALIVE: 'echotype-keepalive',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
export type ChatGPTUrl = (typeof CHATGPT_URLS)[keyof typeof CHATGPT_URLS];
