/**
 * EchoType - Shared Type Definitions
 * @module shared/types
 */

// ============================================================================
// Dictation Status
// ============================================================================

export type DictationStatus = 'idle' | 'listening' | 'recording' | 'processing' | 'error' | 'unknown';

// ============================================================================
// Settings
// ============================================================================

export interface EchoTypeSettings {
  /** Auto-copy result to clipboard after completion */
  autoCopyToClipboard: boolean;
  /** Auto-paste result to active tab after completion */
  autoPasteToActiveTab: boolean;
  /** Return focus to original tab after starting dictation */
  returnFocusAfterStart: boolean;
  /** Maximum history items to keep */
  historySize: number;
}

export const DEFAULT_SETTINGS: EchoTypeSettings = {
  autoCopyToClipboard: true,
  autoPasteToActiveTab: false,
  returnFocusAfterStart: false,
  historySize: 5,
};

// ============================================================================
// History
// ============================================================================

export interface HistoryItem {
  /** Unique identifier */
  id?: string;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** The captured text */
  text: string;
  /** Source of the dictation */
  source?: string;
  /** ISO datetime when created */
  createdAt?: string;
}

// ============================================================================
// Capture Result
// ============================================================================

export interface CaptureResult {
  /** The captured text */
  text: string;
  /** Reason for capture completion */
  reason: CaptureReason;
}

export type CaptureReason =
  | 'stable'
  | 'timeout'
  | 'timeout-without-change'
  | 'canceled';

// ============================================================================
// Clear Result
// ============================================================================

export interface ClearResult {
  /** Whether clearing was successful */
  ok: boolean;
  /** Reason for the result */
  reason: ClearReason;
}

export type ClearReason =
  | `cleared-attempt-${number}`
  | 'clear-timeout'
  | 'no-composer';

// ============================================================================
// Error Codes
// ============================================================================

export type ErrorCode =
  | 'SELECTOR_NOT_FOUND'
  | 'TAB_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CLIPBOARD_ERROR'
  | 'TIMEOUT'
  | 'INJECTION_FAILED'
  | 'NOT_LOGGED_IN'
  | 'VOICE_INPUT_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

export interface EchoTypeError {
  code: ErrorCode;
  message: string;
  detail?: string;
}

// ============================================================================
// Tab Management
// ============================================================================

export interface ChatGPTTabInfo {
  tabId: number;
  windowId: number;
  url: string;
}
