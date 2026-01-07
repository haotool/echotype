/**
 * Audio Feedback for EchoType
 * @module src/background/audio
 * 
 * Provides audio feedback sounds using Offscreen Document.
 * Updated: 2026-01-07T22:39:00+08:00 [context7:chrome/extensions]
 */

import { MSG } from '@shared/protocol';

/**
 * Sound types available
 */
export type SoundType = 'start' | 'success' | 'error' | 'click';

/**
 * Sound configuration
 */
const SOUND_CONFIG: Record<SoundType, { frequency: number; duration: number; type: OscillatorType }> = {
  start: { frequency: 440, duration: 150, type: 'sine' },      // A4 - start tone
  success: { frequency: 880, duration: 200, type: 'sine' },    // A5 - high success
  error: { frequency: 220, duration: 300, type: 'square' },    // A3 - low error
  click: { frequency: 1000, duration: 50, type: 'sine' },      // Quick click
};

/**
 * Ensure offscreen document exists for audio playback
 */
async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) {
    return; // Already exists
  }

  await chrome.offscreen.createDocument({
    url: 'src/offscreen/index.html',
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: 'Play audio feedback sounds',
  });
}

/**
 * Play a sound effect via offscreen document
 */
export async function playSound(type: SoundType): Promise<void> {
  try {
    await ensureOffscreenDocument();
    
    const config = SOUND_CONFIG[type];
    
    await chrome.runtime.sendMessage({
      type: MSG.OFFSCREEN_PLAY_SOUND,
      target: 'offscreen',
      data: config,
    });
  } catch (error) {
    console.error('[audio] Failed to play sound:', error);
  }
}

/**
 * Play start sound
 */
export async function playStartSound(): Promise<void> {
  await playSound('start');
}

/**
 * Play success sound
 */
export async function playSuccessSound(): Promise<void> {
  await playSound('success');
}

/**
 * Play error sound
 */
export async function playErrorSound(): Promise<void> {
  await playSound('error');
}
