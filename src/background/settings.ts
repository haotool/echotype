/**
 * EchoType - Settings Management
 * @module background/settings
 *
 * Manages user settings using chrome.storage.sync.
 */

import type { EchoTypeSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY = 'echotype_settings';

// ============================================================================
// Settings API
// ============================================================================

/**
 * Load settings from storage.
 *
 * @returns Current settings with defaults applied
 */
export async function loadSettings(): Promise<EchoTypeSettings> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<EchoTypeSettings> | undefined;

    return {
      ...DEFAULT_SETTINGS,
      ...stored,
    };
  } catch (error) {
    console.error('[EchoType] Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to storage.
 *
 * @param settings - Settings to save
 */
export async function saveSettings(settings: EchoTypeSettings): Promise<void> {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  } catch (error) {
    console.error('[EchoType] Failed to save settings:', error);
    throw error;
  }
}

/**
 * Update specific settings.
 *
 * @param updates - Partial settings to update
 * @returns Updated settings
 */
export async function updateSettings(
  updates: Partial<EchoTypeSettings>
): Promise<EchoTypeSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...updates };
  await saveSettings(updated);
  return updated;
}

/**
 * Reset settings to defaults.
 *
 * @returns Default settings
 */
export async function resetSettings(): Promise<EchoTypeSettings> {
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Listen for settings changes.
 *
 * @param callback - Callback when settings change
 * @returns Unsubscribe function
 */
export function onSettingsChange(
  callback: (settings: EchoTypeSettings) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'sync' && changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue as Partial<EchoTypeSettings> | undefined;
      const newSettings: EchoTypeSettings = {
        ...DEFAULT_SETTINGS,
        ...(newValue || {}),
      };
      callback(newSettings);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
