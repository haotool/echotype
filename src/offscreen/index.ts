/**
 * EchoType - Offscreen Document
 * @module offscreen
 *
 * Handles clipboard operations and audio playback for the extension.
 * MV3 Service Workers don't have DOM access.
 * Updated: 2026-01-07T22:40:00+08:00
 */

import { MSG } from '@shared/protocol';
import type {
  OffscreenClipboardWritePayload,
  OffscreenClipboardResultPayload,
} from '@shared/protocol';

// ============================================================================
// Initialization
// ============================================================================

console.log('[EchoType] Offscreen document loaded');

// Audio context for sound generation
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// ============================================================================
// Audio Operations
// ============================================================================

/**
 * Play a simple beep sound using Web Audio API
 */
function playBeep(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine'
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Fade out to avoid click
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.error('[EchoType] Audio playback error:', error);
  }
}

// ============================================================================
// Clipboard Operations
// ============================================================================

/**
 * Write text to the clipboard.
 *
 * @param text - Text to write
 * @returns Success status
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('[EchoType] Clipboard write error:', error);

    // Fallback using execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
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
// Message Handler
// ============================================================================

/**
 * Listen for messages from the background script.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Only handle messages targeted at offscreen
  if (message.target !== 'offscreen') {
    return false;
  }

  // Handle clipboard write request
  if (message.type === MSG.OFFSCREEN_CLIPBOARD_WRITE) {
    const payload = message as OffscreenClipboardWritePayload;

    writeToClipboard(payload.text).then((success) => {
      const response: OffscreenClipboardResultPayload = {
        type: MSG.OFFSCREEN_CLIPBOARD_RESULT,
        success,
        error: success ? undefined : 'Clipboard write failed',
      };
      sendResponse(response);
    });

    return true; // Keep channel open for async response
  }

  // Handle sound playback request
  if (message.type === MSG.OFFSCREEN_PLAY_SOUND) {
    const { frequency, duration, type } = message.data;
    playBeep(frequency, duration, type);
    sendResponse({ ok: true });
    return false;
  }

  // Handle ping (for existence check)
  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
