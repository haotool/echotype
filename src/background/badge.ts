/**
 * Extension Badge Status Indicator
 * @module src/background/badge
 * 
 * Provides visual feedback on the extension icon using chrome.action badge API.
 * Updated: 2026-01-07T22:34:00+08:00 [context7:chrome/extensions]
 */

import type { DictationStatus } from '@shared/types';

/**
 * Badge configuration for each status
 */
interface BadgeConfig {
  text: string;
  color: string;
}

/**
 * Badge configurations mapped by status
 */
const BADGE_CONFIGS: Record<DictationStatus, BadgeConfig> = {
  idle: {
    text: '',
    color: '#888888',
  },
  listening: {
    text: 'REC',
    color: '#E94560',
  },
  recording: {
    text: 'REC',
    color: '#E94560',
  },
  processing: {
    text: '...',
    color: '#FFA500',
  },
  error: {
    text: '!',
    color: '#FF4444',
  },
  unknown: {
    text: '?',
    color: '#888888',
  },
};

/**
 * Update the extension badge to reflect current status
 */
export async function updateBadge(status: DictationStatus): Promise<void> {
  const config = BADGE_CONFIGS[status];
  
  try {
    await chrome.action.setBadgeText({ text: config.text });
    await chrome.action.setBadgeBackgroundColor({ color: config.color });
    
    // Set badge text color for better contrast
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
    }
  } catch (error) {
    console.error('[badge] Failed to update badge:', error);
  }
}

/**
 * Clear the badge (set to idle state)
 */
export async function clearBadge(): Promise<void> {
  await updateBadge('idle');
}

/**
 * Flash the badge with a temporary status (e.g., success notification)
 */
export async function flashBadge(
  status: DictationStatus,
  durationMs: number = 2000
): Promise<void> {
  await updateBadge(status);
  
  setTimeout(async () => {
    await clearBadge();
  }, durationMs);
}

/**
 * Show success badge briefly
 */
export async function showSuccessBadge(): Promise<void> {
  try {
    await chrome.action.setBadgeText({ text: '✓' });
    await chrome.action.setBadgeBackgroundColor({ color: '#4ADE80' });
    
    setTimeout(async () => {
      await clearBadge();
    }, 2000);
  } catch (error) {
    console.error('[badge] Failed to show success:', error);
  }
}

/**
 * Show error badge briefly
 */
export async function showErrorBadge(): Promise<void> {
  try {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#FF4444' });
    
    setTimeout(async () => {
      await clearBadge();
    }, 3000);
  } catch (error) {
    console.error('[badge] Failed to show error:', error);
  }
}

/**
 * Initialize badge to idle state
 */
export async function initBadge(): Promise<void> {
  await clearBadge();
}
