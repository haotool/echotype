/**
 * EchoType Options Page Controller
 * Modern settings interface with developer mode
 * 
 * @version 2.0.0
 * @updated 2026-01-08
 */

import type { EchoTypeSettings, HistoryItem } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { MSG, createMessage } from '@shared/protocol';
import { applyI18n, getMessage, initI18n, setLocaleOverride } from '@shared/i18n';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'echotype_settings';
const STORAGE_KEY_THEME = 'echotype_theme';
const STORAGE_KEY_DEV_MODE = 'echotype_dev_mode';
const STORAGE_KEY_LANGUAGE = 'echotype_language';

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  // Theme
  body: document.body,
  btnTheme: document.getElementById('btn-theme') as HTMLButtonElement,
  appVersion: document.getElementById('appVersion') as HTMLElement,
  footerVersion: document.getElementById('footerVersion') as HTMLElement,
  
  // Settings
  autoCopyToClipboard: document.getElementById('autoCopyToClipboard') as HTMLInputElement,
  autoPasteToActiveTab: document.getElementById('autoPasteToActiveTab') as HTMLInputElement,
  returnFocusAfterStart: document.getElementById('returnFocusAfterStart') as HTMLInputElement,
  audioFeedbackEnabled: document.getElementById('audioFeedbackEnabled') as HTMLInputElement,
  
  // Language
  languageSelect: document.getElementById('languageSelect') as HTMLSelectElement,
  
  // Shortcuts
  shortcutsContainer: document.getElementById('shortcutsContainer') as HTMLElement,
  customizeShortcuts: document.getElementById('customizeShortcuts') as HTMLButtonElement,
  
  // History
  historyList: document.getElementById('historyList') as HTMLElement,
  clearHistory: document.getElementById('clearHistory') as HTMLButtonElement,
  
  // Developer Mode
  devMode: document.getElementById('devMode') as HTMLInputElement,
  devSection: document.getElementById('devSection') as HTMLElement,
  devBanner: document.getElementById('dev-banner') as HTMLElement,
  debugExtId: document.getElementById('debug-ext-id') as HTMLElement,
  debugChatgptTab: document.getElementById('debug-chatgpt-tab') as HTMLElement,
  debugChatgptUrl: document.getElementById('debug-chatgpt-url') as HTMLElement,
  debugContentScript: document.getElementById('debug-content-script') as HTMLElement,
  debugHealth: document.getElementById('debug-health') as HTMLElement,
  debugSwHealth: document.getElementById('debug-sw-health') as HTMLElement,
  debugUptime: document.getElementById('debug-uptime') as HTMLElement,
  debugHeartbeat: document.getElementById('debug-heartbeat') as HTMLElement,
  debugError: document.getElementById('debug-error') as HTMLElement,
  btnInspectDom: document.getElementById('btn-inspect-dom') as HTMLButtonElement,
  btnHandshake: document.getElementById('btn-handshake') as HTMLButtonElement,
  btnHealthCheck: document.getElementById('btn-health-check') as HTMLButtonElement,
  btnGetDiagnostic: document.getElementById('btn-get-diagnostic') as HTMLButtonElement,
  btnClearStorage: document.getElementById('btn-clear-storage') as HTMLButtonElement,
  btnReloadExt: document.getElementById('btn-reload-ext') as HTMLButtonElement,
  diagnosticOutput: document.getElementById('diagnostic-output') as HTMLElement,
  
  // Toast
  statusToast: document.getElementById('statusToast') as HTMLElement,
  toastMessage: document.getElementById('toastMessage') as HTMLElement,
};

// ============================================================================
// State
// ============================================================================

let isDarkTheme = false;
let isDevMode = false;

// ============================================================================
// Theme Management
// ============================================================================

async function loadTheme(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_THEME);
    isDarkTheme = result[STORAGE_KEY_THEME] === 'dark';
  } catch {
    isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme();
}

function applyDirection(lang: string): void {
  const normalized = lang.toLowerCase();
  if (normalized.startsWith('ar') || normalized.startsWith('he') || normalized.startsWith('fa')) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', lang);
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }
}

function applyTheme(): void {
  elements.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon(): void {
  const icon = isDarkTheme
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  elements.btnTheme.innerHTML = icon;
}

async function toggleTheme(): Promise<void> {
  isDarkTheme = !isDarkTheme;
  applyTheme();
  await chrome.storage.local.set({ [STORAGE_KEY_THEME]: isDarkTheme ? 'dark' : 'light' });
}

function loadVersion(): void {
  const version = chrome.runtime.getManifest().version;
  if (elements.appVersion) {
    elements.appVersion.textContent = `v${version}`;
  }
  if (elements.footerVersion) {
    elements.footerVersion.textContent = `v${version}`;
  }
}

// ============================================================================
// Language Management
// ============================================================================

async function loadLanguage(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_LANGUAGE);
    const savedLang = result[STORAGE_KEY_LANGUAGE] as string | undefined;
    
    // Default to browser's UI language if no saved preference
    const currentLang: string = savedLang || chrome.i18n.getUILanguage().replace('-', '_');
    
    // Set the select value if the language is available
    if (elements.languageSelect) {
      const options = Array.from(elements.languageSelect.options);
      const hasOption = options.some(opt => opt.value === currentLang);
      
      if (hasOption) {
        elements.languageSelect.value = currentLang;
      } else {
        // Try to match just the language code (e.g., 'en' from 'en-US')
        const langCode = currentLang.split('_')[0];
        const matchingOption = options.find(opt => opt.value.startsWith(langCode));
        if (matchingOption) {
          elements.languageSelect.value = matchingOption.value;
        }
      }
    }
  } catch (error) {
    console.error('[EchoType] Failed to load language preference:', error);
  }
}

async function handleLanguageChange(): Promise<void> {
  const selectedLang = elements.languageSelect.value;
  
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_LANGUAGE]: selectedLang });
    await setLocaleOverride(selectedLang);
    applyDirection(selectedLang);
    applyI18n();
    showToast(getMessage('saved'));
  } catch (error) {
    console.error('[EchoType] Failed to save language preference:', error);
    showToast('Failed to save language preference');
  }
}

// ============================================================================
// Settings Management
// ============================================================================

async function loadSettings(): Promise<EchoTypeSettings> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<EchoTypeSettings> | undefined;
    return { ...DEFAULT_SETTINGS, ...(stored || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: EchoTypeSettings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  showToast(getMessage('saved'));
}

async function loadUI(): Promise<void> {
  const settings = await loadSettings();
  
  elements.autoCopyToClipboard.checked = settings.autoCopyToClipboard;
  elements.autoPasteToActiveTab.checked = settings.autoPasteToActiveTab;
  elements.returnFocusAfterStart.checked = settings.returnFocusAfterStart;
  elements.audioFeedbackEnabled.checked = settings.audioFeedbackEnabled;
  
  await loadShortcuts();
  await loadHistory();
}

async function handleSettingChange(): Promise<void> {
  const settings: EchoTypeSettings = {
    autoCopyToClipboard: elements.autoCopyToClipboard.checked,
    autoPasteToActiveTab: elements.autoPasteToActiveTab.checked,
    returnFocusAfterStart: elements.returnFocusAfterStart.checked,
    audioFeedbackEnabled: elements.audioFeedbackEnabled.checked,
    historySize: DEFAULT_SETTINGS.historySize,
  };
  await saveSettings(settings);
}

// ============================================================================
// Shortcuts
// ============================================================================

async function loadShortcuts(): Promise<void> {
  if (!chrome.commands?.getAll) return;
  
  try {
    const commands = await chrome.commands.getAll();
    
    for (const cmd of commands) {
      if (!cmd.name) continue;
      
      const el = document.getElementById(`shortcut-${cmd.name}`) as HTMLElement;
      if (el) {
        if (cmd.shortcut) {
          el.textContent = formatShortcut(cmd.shortcut);
          el.classList.remove('not-set');
        } else {
          el.textContent = 'Not set';
          el.classList.add('not-set');
        }
      }
    }
  } catch (error) {
    console.error('[EchoType] Failed to load shortcuts:', error);
  }
}

function formatShortcut(shortcut: string): string {
  // Convert Chrome's format to display format
  return shortcut
    .replace('Ctrl', '⌃')
    .replace('Command', '⌘')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace(/\+/g, '');
}

// ============================================================================
// History
// ============================================================================

async function loadHistory(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.HISTORY_GET });
    const items: HistoryItem[] = response?.items || [];
    
    renderHistory(items);
    elements.clearHistory.disabled = items.length === 0;
  } catch (error) {
    console.error('[EchoType] Failed to load history:', error);
    elements.historyList.innerHTML = `
      <div class="history-empty">
        <p>Failed to load history</p>
      </div>
    `;
  }
}

function renderHistory(items: HistoryItem[]): void {
  if (items.length === 0) {
    elements.historyList.innerHTML = `
      <div class="history-empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M12 7v5l4 2"/>
        </svg>
        <p>${getMessage('historyEmpty')}</p>
      </div>
    `;
    return;
  }
  
  elements.historyList.innerHTML = items.map((item, index) => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-content">
        <div class="history-text">${escapeHtml(item.text)}</div>
        <div class="history-time">${formatTime(item.timestamp)}</div>
      </div>
      <div class="history-actions">
        <button class="btn-copy-small" data-index="${index}">${getMessage('btnCopy')}</button>
      </div>
    </div>
  `).join('');
  
  // Add copy event listeners
  elements.historyList.querySelectorAll('.btn-copy-small').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const index = parseInt(target.dataset.index || '0', 10);
      const item = items[index];
      
      if (item) {
        await copyToClipboard(item.text);
        target.textContent = '✓';
        setTimeout(() => {
          target.textContent = 'Copy';
        }, 1500);
      }
    });
  });
}

async function clearHistoryData(): Promise<void> {
  if (!confirm(getMessage('confirmClearHistory'))) return;
  
  try {
    await chrome.runtime.sendMessage({ type: MSG.HISTORY_CLEAR });
    await loadHistory();
    showToast(getMessage('historyCleared'));
  } catch (error) {
    console.error('[EchoType] Failed to clear history:', error);
  }
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60 * 1000) {
    return getMessage('justNow');
  }
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / 60000);
    return getMessage('minutesAgo', String(mins));
  }
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Developer Mode
// ============================================================================

async function loadDevMode(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_DEV_MODE);
    isDevMode = result[STORAGE_KEY_DEV_MODE] === true;
    elements.devMode.checked = isDevMode;
    
    if (isDevMode) {
      elements.devBanner.classList.add('visible');
      elements.devSection.style.display = 'block';
      await updateDebugInfo();
    } else {
      elements.devBanner.classList.remove('visible');
      elements.devSection.style.display = 'none';
    }
  } catch {
    isDevMode = false;
    elements.devBanner.classList.remove('visible');
    elements.devSection.style.display = 'none';
  }
}

async function toggleDevMode(): Promise<void> {
  isDevMode = elements.devMode.checked;
  await chrome.storage.local.set({ [STORAGE_KEY_DEV_MODE]: isDevMode });
  
  if (isDevMode) {
    elements.devBanner.classList.add('visible');
    elements.devSection.style.display = 'block';
    await updateDebugInfo();
    showToast('Developer mode enabled');
  } else {
    elements.devBanner.classList.remove('visible');
    elements.devSection.style.display = 'none';
    showToast('Developer mode disabled');
  }
}

async function updateDebugInfo(): Promise<void> {
  // Extension ID
  elements.debugExtId.textContent = chrome.runtime.id;
  
  // Check for ChatGPT tab
  try {
    const tabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });
    if (tabs.length > 0) {
      elements.debugChatgptTab.textContent = `Found (${tabs.length} tab${tabs.length > 1 ? 's' : ''})`;
      elements.debugChatgptTab.classList.remove('error');
      elements.debugChatgptTab.classList.add('success');
      elements.debugChatgptUrl.textContent = tabs[0].url || 'Unknown';
    } else {
      elements.debugChatgptTab.textContent = 'Not found';
      elements.debugChatgptTab.classList.add('error');
      elements.debugChatgptTab.classList.remove('success');
      elements.debugChatgptUrl.textContent = '—';
    }
  } catch {
    elements.debugChatgptTab.textContent = 'Error';
    elements.debugChatgptTab.classList.add('error');
    elements.debugChatgptUrl.textContent = '—';
  }
  
  // Health check
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.GET_STATUS });
    if (response?.status) {
      elements.debugHealth.textContent = response.status;
      elements.debugHealth.classList.remove('error');
      elements.debugHealth.classList.add('success');
    } else {
      elements.debugHealth.textContent = 'Unknown';
      elements.debugHealth.classList.add('error');
    }
  } catch (error) {
    elements.debugHealth.textContent = 'Failed';
    elements.debugHealth.classList.add('error');
    elements.debugError.textContent = String(error);
  }

  // Service worker health
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HEALTH' });
    if (response?.healthy === true) {
      elements.debugSwHealth.textContent = 'Healthy';
      elements.debugSwHealth.classList.remove('error');
      elements.debugSwHealth.classList.add('success');
    } else {
      elements.debugSwHealth.textContent = 'Unhealthy';
      elements.debugSwHealth.classList.add('error');
    }

    elements.debugUptime.textContent = response?.uptime || 'Unknown';

    if (response?.heartbeat?.timestamp) {
      const ageMs = Date.now() - response.heartbeat.timestamp;
      const ageSeconds = Math.max(0, Math.floor(ageMs / 1000));
      elements.debugHeartbeat.textContent = `${ageSeconds}s ago (#${response.heartbeat.heartbeatCount ?? 0})`;
    } else {
      elements.debugHeartbeat.textContent = 'Unknown';
    }
  } catch (error) {
    elements.debugSwHealth.textContent = 'Failed';
    elements.debugSwHealth.classList.add('error');
    elements.debugUptime.textContent = 'Unknown';
    elements.debugHeartbeat.textContent = 'Unknown';
    elements.debugError.textContent = String(error);
  }
}

async function runHealthCheck(): Promise<void> {
  showToast('Running health check...');
  await updateDebugInfo();
  showToast('Health check complete');
}

async function inspectDom(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage(
      createMessage.devForward({ type: MSG.INSPECT_DOM })
    );
    if (response?.ok) {
      showToast('Check ChatGPT console for DOM inspection');
      elements.debugError.textContent = 'None';
    } else {
      const error = response?.error ?? 'unknown';
      showToast(`Inspect DOM failed: ${error}`);
      elements.debugError.textContent = String(error);
    }
  } catch (error) {
    showToast('Failed to inspect DOM');
    console.error('[EchoType] Inspect DOM error:', error);
    elements.debugError.textContent = String(error);
  }
}

async function runHandshake(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage(
      createMessage.devForward({ type: MSG.DEV_HANDSHAKE })
    );
    if (response?.ok && response?.response?.ok) {
      const readyState = response.response.readyState || 'unknown';
      elements.debugContentScript.textContent = `OK (${readyState})`;
      elements.debugContentScript.classList.remove('error');
      elements.debugContentScript.classList.add('success');
      elements.debugError.textContent = 'None';
      showToast('Content script is active');
    } else {
      const error = response?.error ?? 'no-response';
      elements.debugContentScript.textContent = `Failed (${error})`;
      elements.debugContentScript.classList.add('error');
      elements.debugError.textContent = String(error);
      showToast(`Handshake failed: ${error}`);
    }
  } catch (error) {
    elements.debugContentScript.textContent = 'Failed';
    elements.debugContentScript.classList.add('error');
    elements.debugError.textContent = String(error);
    showToast('Handshake failed');
  }
}

async function clearStorage(): Promise<void> {
  if (!confirm('Clear all extension storage? This will reset all settings.')) return;
  
  try {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    showToast('Storage cleared. Reloading...');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showToast('Failed to clear storage');
    console.error('[EchoType] Clear storage error:', error);
  }
}

function reloadExtension(): void {
  chrome.runtime.reload();
}

async function getDiagnostic(): Promise<void> {
  showToast('Getting diagnostic info...');
  try {
    const response = await chrome.runtime.sendMessage(
      createMessage.devForward({ type: MSG.GET_DIAGNOSTIC })
    );
    
    if (response?.ok && response?.response?.diagnostic) {
      const diagnostic = response.response.diagnostic;
      elements.diagnosticOutput.style.display = 'block';
      elements.diagnosticOutput.textContent = JSON.stringify(diagnostic, null, 2);
      elements.debugError.textContent = 'None';
      showToast('Diagnostic info retrieved');
      
      // Update debug display with diagnostic info
      if (diagnostic.buttons) {
        const startStatus = diagnostic.buttons.start.found ? 'Found' : 'Not found';
        const stopStatus = diagnostic.buttons.stop.found ? 'Found' : 'Not found';
        const submitStatus = diagnostic.buttons.submit.found ? 'Found' : 'Not found';
        console.log('[EchoType] Button status:', { startStatus, stopStatus, submitStatus });
      }
    } else {
      const error = response?.error ?? 'unknown';
      elements.diagnosticOutput.style.display = 'block';
      elements.diagnosticOutput.textContent = `Error: ${error}\n\nResponse: ${JSON.stringify(response, null, 2)}`;
      elements.debugError.textContent = String(error);
      showToast(`Diagnostic failed: ${error}`);
    }
  } catch (error) {
    elements.diagnosticOutput.style.display = 'block';
    elements.diagnosticOutput.textContent = `Exception: ${String(error)}`;
    elements.debugError.textContent = String(error);
    showToast('Failed to get diagnostic');
    console.error('[EchoType] Diagnostic error:', error);
  }
}

// ============================================================================
// Toast
// ============================================================================

function showToast(message: string): void {
  elements.toastMessage.textContent = message;
  elements.statusToast.classList.add('show');
  setTimeout(() => {
    elements.statusToast.classList.remove('show');
  }, 2000);
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners(): void {
  // Theme
  elements.btnTheme.addEventListener('click', toggleTheme);
  
  // Settings
  elements.autoCopyToClipboard.addEventListener('change', handleSettingChange);
  elements.autoPasteToActiveTab.addEventListener('change', handleSettingChange);
  elements.returnFocusAfterStart.addEventListener('change', handleSettingChange);
  elements.audioFeedbackEnabled.addEventListener('change', handleSettingChange);
  
  // Language
  elements.languageSelect?.addEventListener('change', handleLanguageChange);
  
  // Shortcuts
  elements.customizeShortcuts.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
  
  // History
  elements.clearHistory.addEventListener('click', clearHistoryData);
  
  // Developer Mode
  elements.devMode.addEventListener('change', toggleDevMode);
  elements.btnInspectDom?.addEventListener('click', inspectDom);
  elements.btnHandshake?.addEventListener('click', runHandshake);
  elements.btnHealthCheck?.addEventListener('click', runHealthCheck);
  elements.btnGetDiagnostic?.addEventListener('click', getDiagnostic);
  elements.btnClearStorage?.addEventListener('click', clearStorage);
  elements.btnReloadExt?.addEventListener('click', reloadExtension);
  
  // Listen for history updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MSG.RESULT_READY || message.type === MSG.BROADCAST_RESULT) {
      loadHistory();
    }
  });
}

function setupStorageListener(): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY_THEME]?.newValue !== undefined) {
      isDarkTheme = changes[STORAGE_KEY_THEME].newValue === 'dark';
      applyTheme();
    }

    if (area === 'local' && changes[STORAGE_KEY_DEV_MODE]?.newValue !== undefined) {
      isDevMode = changes[STORAGE_KEY_DEV_MODE].newValue === true;
      elements.devMode.checked = isDevMode;

      if (isDevMode) {
        elements.devBanner.classList.add('visible');
        elements.devSection.style.display = 'block';
        void updateDebugInfo();
      } else {
        elements.devBanner.classList.remove('visible');
        elements.devSection.style.display = 'none';
      }
    }

    if (area === 'local' && changes[STORAGE_KEY_LANGUAGE]?.newValue) {
      const nextLocale = String(changes[STORAGE_KEY_LANGUAGE].newValue || '');
      const localeForUi = nextLocale || chrome.i18n.getUILanguage();
      setLocaleOverride(nextLocale).then(() => {
        applyDirection(localeForUi);
        applyI18n();
        loadUI();
      });
    }

    if (area === 'session' && changes['echotype_history']?.newValue) {
      loadHistory();
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  if (params.get('embed') === 'popup') {
    document.body.classList.add('embed');
  }
  await initI18n();
  // Set RTL direction for RTL languages
  const storedLang = await chrome.storage.local.get(STORAGE_KEY_LANGUAGE);
  const uiLang = (storedLang[STORAGE_KEY_LANGUAGE] as string | undefined) || chrome.i18n.getUILanguage();
  applyDirection(uiLang);
  
  // Apply i18n translations to all elements with data-i18n attributes
  applyI18n();
  
  loadVersion();
  await loadTheme();
  await loadLanguage();
  await loadUI();
  await loadDevMode();
  setupEventListeners();
  setupStorageListener();
}

init().catch(console.error);
