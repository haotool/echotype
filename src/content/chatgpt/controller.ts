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
  buttonExists,
  clickStartButton,
  clickStopButton,
  clickSubmitButton,
  waitForComposer,
  checkLoginStatus,
  isVoiceInputAvailable,
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
 * 1. Check login status
 * 2. Perform health check
 * 3. Snapshot baseline text
 * 4. Click start button
 *
 * @returns Success status and optional error
 */
export async function startDictation(): Promise<{
  ok: boolean;
  error?: EchoTypeError;
  baseline: string;
  debug?: {
    loginStatus: { loggedIn: boolean; reason: string };
    voiceAvailable: boolean;
    health: unknown;
    buttonClicked: boolean;
  };
}> {
  console.log('[EchoType:Controller] startDictation called');
  
  // Check login status first
  const loginStatus = checkLoginStatus();
  console.log('[EchoType:Controller] Login status:', loginStatus);
  
  if (!loginStatus.loggedIn) {
    console.warn('[EchoType:Controller] User not logged in:', loginStatus.reason);
    return {
      ok: false,
      error: {
        code: 'NOT_LOGGED_IN',
        message: 'Please log in to ChatGPT to use voice dictation.',
        detail: 'Voice dictation requires an active ChatGPT session. Please log in and try again.',
      },
      baseline: '',
      debug: {
        loginStatus,
        voiceAvailable: false,
        health: null,
        buttonClicked: false,
      },
    };
  }

  // Check if voice input is available
  const voiceAvailable = isVoiceInputAvailable();
  console.log('[EchoType:Controller] Voice input available:', voiceAvailable);
  
  if (!voiceAvailable) {
    console.warn('[EchoType:Controller] Voice input not available');
    return {
      ok: false,
      error: {
        code: 'VOICE_INPUT_UNAVAILABLE',
        message: 'Voice input is not available.',
        detail: 'The voice dictation button was not found. This feature may not be available in your region or browser.',
      },
      baseline: '',
      debug: {
        loginStatus,
        voiceAvailable,
        health: null,
        buttonClicked: false,
      },
    };
  }

  // Health check
  let health = performHealthCheck();
  console.log('[EchoType:Controller] Initial health check:', health);
  
  if (!health.healthy && health.missing.includes('composer')) {
    console.log('[EchoType:Controller] Waiting for composer...');
    await waitForComposer();
    health = performHealthCheck();
    console.log('[EchoType:Controller] Health check after wait:', health);
  }
  
  if (!health.healthy) {
    return {
      ok: false,
      error: health.error,
      baseline: '',
      debug: {
        loginStatus,
        voiceAvailable,
        health,
        buttonClicked: false,
      },
    };
  }

  // Snapshot baseline
  state.baselineText = readComposerText();
  state.isActive = true;
  console.log('[EchoType:Controller] Baseline text:', state.baselineText.substring(0, 100));

  // Click start button
  console.log('[EchoType:Controller] Clicking start button...');
  const clicked = clickStartButton();
  console.log('[EchoType:Controller] Button clicked:', clicked);
  
  if (!clicked) {
    return {
      ok: false,
      error: {
        code: 'SELECTOR_NOT_FOUND',
        message: 'Could not find or click start button',
        detail: 'The start button was found but could not be clicked. It may be disabled or obscured.',
      },
      baseline: state.baselineText,
      debug: {
        loginStatus,
        voiceAvailable,
        health,
        buttonClicked: false,
      },
    };
  }

  console.log('[EchoType:Controller] Dictation started successfully');
  return {
    ok: true,
    baseline: state.baselineText,
    debug: {
      loginStatus,
      voiceAvailable,
      health,
      buttonClicked: true,
    },
  };
}

/**
 * Cancel dictation and clear input.
 * Stops recording and cancels any pending capture.
 *
 * @returns Success status
 */
export function cancelDictation(): { ok: boolean } {
  const clicked = clickStopButton();
  cancelCapture(); // Cancel any pending capture
  return { ok: clicked };
}

/**
 * Pause/stop dictation (alias for cancelDictation).
 * @deprecated Use cancelDictation instead
 */
export function pauseDictation(): { ok: boolean } {
  return cancelDictation();
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
  let health = performHealthCheck();
  const submitAvailable = buttonExists('submit') || buttonExists('stop');
  if (!health.healthy && health.missing.includes('composer')) {
    // During active dictation, the composer can be replaced by a waveform canvas.
    // Allow submit to proceed if dictation controls are present.
    if (!submitAvailable) {
      await waitForComposer();
      health = performHealthCheck();
    }
  }
  if (!health.healthy && !submitAvailable) {
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
  state.lastStatus = 'idle';

  // Notify background of status change to idle (critical for state sync)
  try {
    chrome.runtime.sendMessage(createMessage.statusChanged('idle')).catch(() => {
      // Ignore if background is not available
    });
  } catch {
    // Extension context may be invalidated
  }

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
