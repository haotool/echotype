/**
 * EchoType - Options Page
 * @module options
 *
 * Settings page for the extension.
 */

import type { EchoTypeSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = 'echotype_settings';

async function loadSettings(): Promise<EchoTypeSettings> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: EchoTypeSettings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

// ============================================================================
// UI Elements
// ============================================================================

const elements = {
  autoCopyToClipboard: document.getElementById('autoCopyToClipboard') as HTMLInputElement,
  autoPasteToActiveTab: document.getElementById('autoPasteToActiveTab') as HTMLInputElement,
  returnFocusAfterStart: document.getElementById('returnFocusAfterStart') as HTMLInputElement,
  saveStatus: document.getElementById('saveStatus') as HTMLElement,
};

// ============================================================================
// UI Functions
// ============================================================================

function showSaveStatus(): void {
  elements.saveStatus.classList.add('visible');
  setTimeout(() => {
    elements.saveStatus.classList.remove('visible');
  }, 1500);
}

async function loadUI(): Promise<void> {
  const settings = await loadSettings();

  elements.autoCopyToClipboard.checked = settings.autoCopyToClipboard;
  elements.autoPasteToActiveTab.checked = settings.autoPasteToActiveTab;
  elements.returnFocusAfterStart.checked = settings.returnFocusAfterStart;
}

async function handleChange(): Promise<void> {
  const settings: EchoTypeSettings = {
    autoCopyToClipboard: elements.autoCopyToClipboard.checked,
    autoPasteToActiveTab: elements.autoPasteToActiveTab.checked,
    returnFocusAfterStart: elements.returnFocusAfterStart.checked,
    historySize: DEFAULT_SETTINGS.historySize,
  };

  await saveSettings(settings);
  showSaveStatus();
}

// ============================================================================
// Event Listeners
// ============================================================================

elements.autoCopyToClipboard.addEventListener('change', handleChange);
elements.autoPasteToActiveTab.addEventListener('change', handleChange);
elements.returnFocusAfterStart.addEventListener('change', handleChange);

// ============================================================================
// Initialize
// ============================================================================

loadUI();
