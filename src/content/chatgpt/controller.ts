/**
 * EchoType - ChatGPT Dictation Controller
 * @module content/chatgpt/controller
 *
 * Main controller for ChatGPT dictation operations.
 * Orchestrates selectors, capture, diff, and clear modules.
 */

import { normalizeText, sleep } from '@shared/utils';
import { MSG, createMessage } from '@shared/protocol';
import type {
  DictationStatus,
  CaptureResult,
  ClearResult,
  EchoTypeError,
} from '@shared/types';
import type { CmdSubmitPayload, ResultReadyPayload, ErrorPayload, StatusChangedPayload } from '@shared/protocol';

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
  checkMicrophonePermission,
  detectMicrophoneToast,
  observeMicrophoneToast,
  type MicrophonePermissionResult,
  type ToastDetectionResult,
} from './selectors';
import { readComposerText, captureAfterSubmit, cancelCapture, captureStableText } from './capture';
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

// Toast observer cleanup function
let toastObserverCleanup: (() => void) | null = null;

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

async function waitForExpectedStatus(
  expected: DictationStatus[],
  timeoutMs = 2000
): Promise<DictationStatus | null> {
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const current = detectStatus();
    if (expected.includes(current)) {
      return current;
    }
    await sleep(100);
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
  status?: DictationStatus;
  debug?: {
    loginStatus: { loggedIn: boolean; reason: string };
    voiceAvailable: boolean;
    micPermission?: MicrophonePermissionResult;
    health: unknown;
    buttonClicked: boolean;
    status?: DictationStatus;
    attempts?: number;
    visibilityState?: DocumentVisibilityState;
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

  // Check microphone permission (non-blocking, for diagnostics)
  const micPermission = await checkMicrophonePermission();
  console.log('[EchoType:Controller] Microphone permission:', micPermission);
  
  // Warn if permission is denied, but don't block (ChatGPT handles its own permission flow)
  if (micPermission.status === 'denied') {
    console.warn('[EchoType:Controller] Microphone permission denied');
    // Note: We don't return an error here because ChatGPT may still prompt for permission
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
        micPermission,
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
        micPermission,
        health,
        buttonClicked: false,
      },
    };
  }

  // Snapshot baseline
  state.baselineText = readComposerText();
  state.isActive = true;
  console.log('[EchoType:Controller] Baseline text:', state.baselineText.substring(0, 100));

  // Click start button with verification and fallback
  console.log('[EchoType:Controller] Clicking start button...');
  const visibilityState = document.visibilityState;
  const strategies: Array<'direct' | 'focus' | 'mouse'> = ['direct', 'focus', 'mouse'];
  let clicked = false;
  let status: DictationStatus | null = null;
  let attempts = 0;

  for (const strategy of strategies) {
    attempts += 1;
    if (!clickStartButton(strategy)) {
      continue;
    }
    clicked = true;
    status = await waitForExpectedStatus(['listening', 'recording', 'processing']);
    if (status) {
      break;
    }
  }

  if (!clicked) {
    state.baselineText = '';
    state.isActive = false;
    return {
      ok: false,
      error: {
        code: 'SELECTOR_NOT_FOUND',
        message: 'Could not find or click start button',
        detail: 'The start button was found but could not be clicked. It may be disabled or obscured.',
      },
      baseline: '',
      debug: {
        loginStatus,
        voiceAvailable,
        micPermission,
        health,
        buttonClicked: false,
        attempts,
        visibilityState,
      },
    };
  }

  if (!status) {
    state.baselineText = '';
    state.isActive = false;
    const isHidden = visibilityState === 'hidden';
    return {
      ok: false,
      error: {
        code: isHidden ? 'PAGE_INACTIVE' : 'TIMEOUT',
        message: isHidden
          ? 'Page is inactive; dictation start may require an active tab'
          : 'Start button click did not change status',
        detail: isHidden
          ? 'The ChatGPT tab is not active. Some UI actions may require an active tab or user gesture.'
          : 'No transition to listening/recording was detected after clicking start.',
      },
      baseline: '',
      debug: {
        loginStatus,
        voiceAvailable,
        micPermission,
        health,
        buttonClicked: true,
        attempts,
        visibilityState,
      },
    };
  }

  console.log('[EchoType:Controller] Dictation started successfully');

  // Start monitoring for microphone toast errors
  startToastMonitoring();

  // Check for immediate toast error (e.g., permission denied)
  const toastCheck = detectMicrophoneToast();
  if (toastCheck.found && toastCheck.type === 'microphone_error') {
    console.warn('[EchoType:Controller] Microphone toast detected:', toastCheck.message);
    // Don't fail immediately - let the user see the toast and handle it
    // The toast observer will notify the background script
  }

  return {
    ok: true,
    baseline: state.baselineText,
    status,
    debug: {
      loginStatus,
      voiceAvailable,
      micPermission,
      health,
      buttonClicked: true,
      status,
      attempts,
      visibilityState,
    },
  };
}

/**
 * Start monitoring for ChatGPT microphone toast messages.
 * Notifies background script when a toast is detected.
 */
function startToastMonitoring(): void {
  // Clean up any existing observer
  stopToastMonitoring();

  toastObserverCleanup = observeMicrophoneToast((result: ToastDetectionResult) => {
    if (result.type === 'microphone_error') {
      console.warn('[EchoType:Controller] Microphone toast detected:', result.message);
      
      // Notify background script about the error
      chrome.runtime.sendMessage({
        type: MSG.STATUS_CHANGED,
        status: 'error',
        error: {
          code: 'MICROPHONE_DENIED',
          message: result.message || 'Microphone access denied by ChatGPT.',
          detail: 'ChatGPT reported that microphone access is not available. Please check your browser settings.',
        },
      }).catch(() => {
        // Ignore errors if background is not available
      });
    }
  });
}

/**
 * Stop monitoring for ChatGPT toast messages.
 */
function stopToastMonitoring(): void {
  if (toastObserverCleanup) {
    toastObserverCleanup();
    toastObserverCleanup = null;
  }
}

/**
 * Cancel dictation and clear input.
 * Stops recording and cancels any pending capture.
 *
 * @returns Success status
 */
export function cancelDictation(): { ok: boolean } {
  stopToastMonitoring(); // Stop toast monitoring
  const clicked = clickStopButton();
  cancelCapture(); // Cancel any pending capture
  if (clicked) {
    state.baselineText = '';
    state.isActive = false;
    state.lastStatus = 'idle';
  }
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
export async function submitDictation(
  requireChange = true
): Promise<ResultReadyPayload | ErrorPayload> {
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
  const capture: CaptureResult = await captureAfterSubmit(preSubmitText, {
    requireChange,
  });

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
 * Submit dictation without capturing text.
 * Used for deferred capture workflows.
 */
export async function submitOnlyDictation(): Promise<StatusChangedPayload | ErrorPayload> {
  // Health check
  let health = performHealthCheck();
  const submitAvailable = buttonExists('submit') || buttonExists('stop');
  if (!health.healthy && health.missing.includes('composer')) {
    if (!submitAvailable) {
      await waitForComposer();
      health = performHealthCheck();
    }
  }
  if (!health.healthy && !submitAvailable) {
    return createMessage.error(health.error!);
  }

  const clicked = clickSubmitButton();
  if (!clicked) {
    return createMessage.error({
      code: 'SELECTOR_NOT_FOUND',
      message: 'Could not find submit button',
    });
  }

  state.lastStatus = 'processing';
  return createMessage.statusChanged('processing');
}

/**
 * Capture the current dictation result without clicking submit.
 * Intended for deferred capture after processing completes.
 */
export async function captureOnlyDictation(
  requireChange = false
): Promise<ResultReadyPayload | ErrorPayload> {
  const preCaptureText = readComposerText();
  const capture: CaptureResult = await captureStableText(preCaptureText, {
    requireChange,
    timeout: requireChange ? 9000 : 3200,
  });

  const finalText = normalizeText(capture.text);
  const addedText = computeAddedText(state.baselineText, finalText);

  const clear: ClearResult = await clearComposerRobust();

  state.baselineText = '';
  state.isActive = false;
  state.lastStatus = 'idle';

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
      const submitMessage = message as CmdSubmitPayload;
      const mode = submitMessage.mode ?? 'submit-and-capture';
      if (mode === 'submit-only') {
        const result = await submitOnlyDictation();
        sendResponse(result);
        break;
      }
      if (mode === 'capture-only') {
        const result = await captureOnlyDictation(submitMessage.requireChange ?? false);
        sendResponse(result);
        break;
      }
      const result = await submitDictation(submitMessage.requireChange ?? true);
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
