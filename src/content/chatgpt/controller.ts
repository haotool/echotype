/**
 * EchoType - ChatGPT Dictation Controller
 * @module content/chatgpt/controller
 *
 * Main controller for ChatGPT dictation operations.
 * Orchestrates selectors, capture, diff, and clear modules.
 */

import { normalizeText } from '@shared/utils';
import { MSG, createMessage } from '@shared/protocol';
import type {
  DictationStatus,
  CaptureResult,
  ClearResult,
  EchoTypeError,
} from '@shared/types';
import type { ResultReadyPayload, ErrorPayload, StatusChangedPayload } from '@shared/protocol';

import {
  detectStatus,
  performHealthCheck,
  clickStartButton,
  clickStopButton,
  clickSubmitButton,
} from './selectors';
import { readComposerText, captureAfterSubmit, cancelCapture } from './capture';
import { computeAddedText } from './diff';
import { clearComposerRobust } from './clear';

// ============================================================================
// State
// ============================================================================

interface ControllerState {
  /** Baseline text captured before dictation started */
  baselineText: string;
  /** Whether dictation is in progress */
  isActive: boolean;
  /** Last known status */
  lastStatus: DictationStatus;
}

const state: ControllerState = {
  baselineText: '',
  isActive: false,
  lastStatus: 'unknown',
};

// ============================================================================
// Status Monitoring
// ============================================================================

/**
 * Get current dictation status.
 */
export function getStatus(): DictationStatus {
  return detectStatus();
}

/**
 * Update and return status if changed.
 *
 * @returns Status change message if status changed, null otherwise
 */
export function checkStatusChange(): StatusChangedPayload | null {
  const current = detectStatus();
  if (current !== state.lastStatus) {
    state.lastStatus = current;
    return createMessage.statusChanged(current);
  }
  return null;
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Start dictation.
 *
 * 1. Perform health check
 * 2. Snapshot baseline text
 * 3. Click start button
 *
 * @returns Success status and optional error
 */
export async function startDictation(): Promise<{
  ok: boolean;
  error?: EchoTypeError;
  baseline: string;
}> {
  // Health check
  const health = performHealthCheck();
  if (!health.healthy) {
    return { ok: false, error: health.error, baseline: '' };
  }

  // Snapshot baseline
  state.baselineText = readComposerText();
  state.isActive = true;

  // Click start button
  const clicked = clickStartButton();
  if (!clicked) {
    return {
      ok: false,
      error: {
        code: 'SELECTOR_NOT_FOUND',
        message: 'Could not find start button',
      },
      baseline: state.baselineText,
    };
  }

  return { ok: true, baseline: state.baselineText };
}

/**
 * Pause/stop dictation.
 *
 * @returns Success status
 */
export function pauseDictation(): { ok: boolean } {
  const clicked = clickStopButton();
  cancelCapture(); // Cancel any pending capture
  return { ok: clicked };
}

/**
 * Submit dictation and capture the result.
 *
 * Full workflow:
 * 1. Click submit button
 * 2. Wait for content to change and stabilize
 * 3. Compute added text (baseline diff)
 * 4. Clear the composer
 * 5. Return the result
 *
 * @returns Complete result with added text, capture info, and clear status
 */
export async function submitDictation(): Promise<ResultReadyPayload | ErrorPayload> {
  // Health check
  const health = performHealthCheck();
  if (!health.healthy) {
    return createMessage.error(health.error!);
  }

  const preSubmitText = readComposerText();

  // Click submit button
  const clicked = clickSubmitButton();
  if (!clicked) {
    return createMessage.error({
      code: 'SELECTOR_NOT_FOUND',
      message: 'Could not find submit button',
    });
  }

  // Capture stable text after submit
  const capture: CaptureResult = await captureAfterSubmit(preSubmitText);

  const finalText = normalizeText(capture.text);
  const addedText = computeAddedText(state.baselineText, finalText);

  // Clear the composer
  const clear: ClearResult = await clearComposerRobust();

  // Reset state
  state.baselineText = '';
  state.isActive = false;

  return createMessage.resultReady(addedText, finalText, capture, clear);
}

/**
 * Get current controller state for debugging.
 */
export function getControllerState(): Readonly<ControllerState> {
  return { ...state };
}

/**
 * Reset controller state.
 */
export function resetController(): void {
  state.baselineText = '';
  state.isActive = false;
  state.lastStatus = 'unknown';
  cancelCapture();
}

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Handle incoming command messages.
 *
 * @param message - The command message
 * @param sendResponse - Response callback
 */
export async function handleCommand(
  message: { type: string; [key: string]: unknown },
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case MSG.CMD_START: {
      const result = await startDictation();
      sendResponse(result);
      break;
    }

    case MSG.CMD_PAUSE: {
      const result = pauseDictation();
      sendResponse(result);
      break;
    }

    case MSG.CMD_SUBMIT: {
      const result = await submitDictation();
      sendResponse(result);
      break;
    }

    case MSG.CMD_GET_STATUS: {
      sendResponse({
        status: getStatus(),
        state: getControllerState(),
      });
      break;
    }

    default:
      sendResponse({ error: 'Unknown command' });
  }
}
