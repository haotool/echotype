/**
 * EchoType - Message Protocol Definitions
 * @module shared/protocol
 *
 * Defines all message types for communication between:
 * - Background Service Worker
 * - ChatGPT Content Script
 * - Universal Content Script
 * - Offscreen Document
 */

import type {
  CaptureResult,
  ClearResult,
  DictationStatus,
  EchoTypeError,
  EchoTypeSettings,
  HistoryItem,
} from './types';

// ============================================================================
// Message Type Constants
// ============================================================================

export const MSG = {
  // Commands (Background → Content)
  CMD_START: 'CMD_START',
  CMD_PAUSE: 'CMD_PAUSE',
  CMD_SUBMIT: 'CMD_SUBMIT',
  CMD_GET_STATUS: 'CMD_GET_STATUS',

  // Results (Content → Background)
  RESULT_READY: 'RESULT_READY',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ERROR: 'ERROR',

  // Broadcast (Background → All)
  BROADCAST_RESULT: 'BROADCAST_RESULT',
  BROADCAST_SETTINGS: 'BROADCAST_SETTINGS',

  // Universal Content Script
  PASTE_TEXT: 'PASTE_TEXT',
  PASTE_LAST_RESULT: 'PASTE_LAST_RESULT',

  // Offscreen
  OFFSCREEN_CLIPBOARD_WRITE: 'OFFSCREEN_CLIPBOARD_WRITE',
  OFFSCREEN_CLIPBOARD_RESULT: 'OFFSCREEN_CLIPBOARD_RESULT',
  OFFSCREEN_PLAY_SOUND: 'OFFSCREEN_PLAY_SOUND',

  // History
  HISTORY_GET: 'HISTORY_GET',
  HISTORY_RESULT: 'HISTORY_RESULT',
  HISTORY_CLEAR: 'HISTORY_CLEAR',

  // Popup
  GET_STATUS: 'GET_STATUS',
  GET_HISTORY: 'GET_HISTORY',

  // Developer tools
  INSPECT_DOM: 'INSPECT_DOM',
  DEV_FORWARD: 'DEV_FORWARD',
  DEV_HANDSHAKE: 'DEV_HANDSHAKE',
  GET_DIAGNOSTIC: 'GET_DIAGNOSTIC',
} as const;

export type MessageType = (typeof MSG)[keyof typeof MSG];

// ============================================================================
// Message Payloads
// ============================================================================

// --- Commands ---

export interface CmdStartPayload {
  type: typeof MSG.CMD_START;
  /** Baseline mode: 'snapshot' captures current text before starting */
  baselineMode: 'snapshot' | 'empty';
}

export interface CmdPausePayload {
  type: typeof MSG.CMD_PAUSE;
}

export interface CmdSubmitPayload {
  type: typeof MSG.CMD_SUBMIT;
  /** Require content change before capturing */
  requireChange: boolean;
}

export interface CmdGetStatusPayload {
  type: typeof MSG.CMD_GET_STATUS;
}

export interface InspectDomPayload {
  type: typeof MSG.INSPECT_DOM;
}

export interface DevHandshakePayload {
  type: typeof MSG.DEV_HANDSHAKE;
}

export interface DevForwardPayload {
  type: typeof MSG.DEV_FORWARD;
  message: { type: string; [key: string]: unknown };
}
// --- Results ---

export interface ResultReadyPayload {
  type: typeof MSG.RESULT_READY;
  /** The added text (baseline diff) */
  addedText: string;
  /** The full text before clearing */
  fullText: string;
  /** Capture metadata */
  capture: CaptureResult;
  /** Clear metadata */
  clear: ClearResult;
  /** Timestamp */
  timestamp: string;
}

export interface StatusChangedPayload {
  type: typeof MSG.STATUS_CHANGED;
  status: DictationStatus;
}

export interface ErrorPayload {
  type: typeof MSG.ERROR;
  error: EchoTypeError;
}

// --- Broadcast ---

export interface BroadcastResultPayload {
  type: typeof MSG.BROADCAST_RESULT;
  text: string;
  historyItem: HistoryItem;
}

export interface BroadcastSettingsPayload {
  type: typeof MSG.BROADCAST_SETTINGS;
  settings: EchoTypeSettings;
}

// --- Universal ---

export interface PasteTextPayload {
  type: typeof MSG.PASTE_TEXT;
  text: string;
}

export interface PasteLastResultPayload {
  type: typeof MSG.PASTE_LAST_RESULT;
}

// --- Offscreen ---

export interface OffscreenClipboardWritePayload {
  type: typeof MSG.OFFSCREEN_CLIPBOARD_WRITE;
  text: string;
}

export interface OffscreenClipboardResultPayload {
  type: typeof MSG.OFFSCREEN_CLIPBOARD_RESULT;
  success: boolean;
  error?: string;
}

// --- History ---

export interface HistoryGetPayload {
  type: typeof MSG.HISTORY_GET;
}

export interface HistoryResultPayload {
  type: typeof MSG.HISTORY_RESULT;
  items: HistoryItem[];
}

export interface HistoryClearPayload {
  type: typeof MSG.HISTORY_CLEAR;
}

// ============================================================================
// Union Types
// ============================================================================

export type CommandMessage =
  | CmdStartPayload
  | CmdPausePayload
  | CmdSubmitPayload
  | CmdGetStatusPayload
  | InspectDomPayload
  | DevForwardPayload;

export type ResultMessage =
  | ResultReadyPayload
  | StatusChangedPayload
  | ErrorPayload;

export type BroadcastMessage = BroadcastResultPayload | BroadcastSettingsPayload;

export type UniversalMessage = PasteTextPayload | PasteLastResultPayload;

export type OffscreenMessage =
  | OffscreenClipboardWritePayload
  | OffscreenClipboardResultPayload;

export type HistoryMessage =
  | HistoryGetPayload
  | HistoryResultPayload
  | HistoryClearPayload;

export type AnyMessage =
  | CommandMessage
  | ResultMessage
  | BroadcastMessage
  | UniversalMessage
  | OffscreenMessage
  | HistoryMessage;

// ============================================================================
// Type Guards
// ============================================================================

export function isCommandMessage(msg: AnyMessage): msg is CommandMessage {
  return (
    msg.type === MSG.CMD_START ||
    msg.type === MSG.CMD_PAUSE ||
    msg.type === MSG.CMD_SUBMIT ||
    msg.type === MSG.CMD_GET_STATUS ||
    msg.type === MSG.INSPECT_DOM ||
    msg.type === MSG.DEV_FORWARD
  );
}

export function isResultMessage(msg: AnyMessage): msg is ResultMessage {
  return (
    msg.type === MSG.RESULT_READY ||
    msg.type === MSG.STATUS_CHANGED ||
    msg.type === MSG.ERROR
  );
}

// ============================================================================
// Message Creators
// ============================================================================

export const createMessage = {
  cmdStart: (baselineMode: 'snapshot' | 'empty' = 'snapshot'): CmdStartPayload => ({
    type: MSG.CMD_START,
    baselineMode,
  }),

  cmdPause: (): CmdPausePayload => ({
    type: MSG.CMD_PAUSE,
  }),

  cmdSubmit: (requireChange = true): CmdSubmitPayload => ({
    type: MSG.CMD_SUBMIT,
    requireChange,
  }),

  cmdGetStatus: (): CmdGetStatusPayload => ({
    type: MSG.CMD_GET_STATUS,
  }),

  inspectDom: (): InspectDomPayload => ({
    type: MSG.INSPECT_DOM,
  }),

  devHandshake: (): DevHandshakePayload => ({
    type: MSG.DEV_HANDSHAKE,
  }),

  devForward: (message: { type: string; [key: string]: unknown }): DevForwardPayload => ({
    type: MSG.DEV_FORWARD,
    message,
  }),

  resultReady: (
    addedText: string,
    fullText: string,
    capture: CaptureResult,
    clear: ClearResult
  ): ResultReadyPayload => ({
    type: MSG.RESULT_READY,
    addedText,
    fullText,
    capture,
    clear,
    timestamp: new Date().toISOString(),
  }),

  statusChanged: (status: DictationStatus): StatusChangedPayload => ({
    type: MSG.STATUS_CHANGED,
    status,
  }),

  error: (error: EchoTypeError): ErrorPayload => ({
    type: MSG.ERROR,
    error,
  }),

  broadcastResult: (text: string, historyItem: HistoryItem): BroadcastResultPayload => ({
    type: MSG.BROADCAST_RESULT,
    text,
    historyItem,
  }),

  pasteText: (text: string): PasteTextPayload => ({
    type: MSG.PASTE_TEXT,
    text,
  }),

  offscreenClipboardWrite: (text: string): OffscreenClipboardWritePayload => ({
    type: MSG.OFFSCREEN_CLIPBOARD_WRITE,
    text,
  }),

  historyGet: (): HistoryGetPayload => ({
    type: MSG.HISTORY_GET,
  }),

  historyClear: (): HistoryClearPayload => ({
    type: MSG.HISTORY_CLEAR,
  }),
};
