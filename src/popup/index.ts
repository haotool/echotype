/**
 * EchoType Popup Controller
 * Modern UI with theme support and developer mode
 * 
 * Architecture: Single Source of Truth
 * - Background Service Worker is the authority for dictation status
 * - Popup only renders UI based on Background state
 * - No local status caching to prevent race conditions
 * 
 * @version 3.0.0
 * @updated 2026-01-10
 */

import type { HistoryItem, DictationStatus } from '../shared/types';
import { MSG, createMessage } from '../shared/protocol';
import { applyI18n, getMessage, initI18n, setLocaleOverride } from '../shared/i18n';
import { detectOS, formatShortcut, getSuggestedShortcut } from '../shared/shortcuts';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_THEME = 'echotype_theme';
const STORAGE_KEY_DEV_MODE = 'echotype_dev_mode';
const STORAGE_KEY_HISTORY = 'echotype_history';
const STORAGE_KEY_LANGUAGE = 'echotype_language';

// ============================================================================
// Shortcut Display
// ============================================================================

type ShortcutDisplay = { toggle: string; cancel: string; paste: string };

const COMMAND_IDS = {
  toggle: 'toggle-dictation',
  cancel: 'cancel-dictation',
  paste: 'paste-last-result',
} as const;

function resolveShortcut(
  commands: chrome.commands.Command[],
  commandName: string,
  os: ReturnType<typeof detectOS>,
  notSetLabel: string
): string {
  const command = commands.find((cmd) => cmd.name === commandName);
  const shortcut = command?.shortcut?.trim();
  if (shortcut) {
    return formatShortcut(shortcut, os);
  }

  const suggested = getSuggestedShortcut(commandName, os);
  return suggested ? formatShortcut(suggested, os) : notSetLabel;
}

function updateShortcutDisplay(shortcuts: ShortcutDisplay): void {
  const toggleEl = document.getElementById('shortcut-toggle');
  const cancelEl = document.getElementById('shortcut-cancel');
  const pasteEl = document.getElementById('shortcut-paste');

  if (toggleEl) toggleEl.textContent = shortcuts.toggle;
  if (cancelEl) cancelEl.textContent = shortcuts.cancel;
  if (pasteEl) pasteEl.textContent = shortcuts.paste;
}

async function loadShortcutDisplay(): Promise<void> {
  const os = detectOS();
  const notSetLabel = getMessage('notSet');
  const fallback = {
    toggle: getSuggestedShortcut(COMMAND_IDS.toggle, os),
    cancel: getSuggestedShortcut(COMMAND_IDS.cancel, os),
    paste: getSuggestedShortcut(COMMAND_IDS.paste, os),
  };

  if (!chrome.commands?.getAll) {
    updateShortcutDisplay({
      toggle: fallback.toggle ? formatShortcut(fallback.toggle, os) : notSetLabel,
      cancel: fallback.cancel ? formatShortcut(fallback.cancel, os) : notSetLabel,
      paste: fallback.paste ? formatShortcut(fallback.paste, os) : notSetLabel,
    });
    return;
  }

  try {
    const commands = await chrome.commands.getAll();
    const shortcuts: ShortcutDisplay = {
      toggle: resolveShortcut(commands, COMMAND_IDS.toggle, os, notSetLabel),
      cancel: resolveShortcut(commands, COMMAND_IDS.cancel, os, notSetLabel),
      paste: resolveShortcut(commands, COMMAND_IDS.paste, os, notSetLabel),
    };
    updateShortcutDisplay(shortcuts);
  } catch (error) {
    console.error('[EchoType] Failed to load shortcuts:', error);
    updateShortcutDisplay({
      toggle: fallback.toggle ? formatShortcut(fallback.toggle, os) : notSetLabel,
      cancel: fallback.cancel ? formatShortcut(fallback.cancel, os) : notSetLabel,
      paste: fallback.paste ? formatShortcut(fallback.paste, os) : notSetLabel,
    });
  }
}

/**
 * Get localized status labels.
 * Must be called after i18n is initialized.
 */
function getStatusLabel(status: DictationStatus): string {
  const labels: Record<DictationStatus, string> = {
    idle: getMessage('statusReady'),
    listening: getMessage('statusListening'),
    recording: getMessage('statusRecording'),
    processing: getMessage('statusProcessing'),
    error: getMessage('statusError'),
    unknown: getMessage('statusUnknown'),
  };
  return labels[status] || status;
}

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  // Theme
  body: document.body,
  btnTheme: document.getElementById('btn-theme') as HTMLButtonElement,
  popupVersion: document.getElementById('popupVersion') as HTMLElement,
  
  // Status
  statusBadge: document.getElementById('status-badge') as HTMLElement,
  statusText: document.getElementById('status-text') as HTMLElement,
  statusTimer: document.getElementById('status-timer') as HTMLElement,
  audioVisualizer: document.getElementById('audio-visualizer') as HTMLElement,
  
  // Error
  errorCard: document.getElementById('error-card') as HTMLElement,
  errorTitle: document.getElementById('error-title') as HTMLElement,
  errorMessage: document.getElementById('error-message') as HTMLElement,
  
  // Actions (new toggle/cancel design)
  btnToggle: document.getElementById('btn-toggle') as HTMLButtonElement,
  btnCancel: document.getElementById('btn-cancel') as HTMLButtonElement,
  btnCopy: document.getElementById('btn-copy') as HTMLButtonElement,
  
  // Result
  resultText: document.getElementById('result-text') as HTMLElement,
  resultTime: document.getElementById('result-time') as HTMLElement,
  
  // Navigation
  btnSettings: document.getElementById('btn-settings') as HTMLButtonElement,
  linkOptions: document.getElementById('link-options') as HTMLAnchorElement,
  linkHistory: document.getElementById('link-history') as HTMLAnchorElement,
  settingsView: document.getElementById('settings-view') as HTMLElement,
  settingsFrame: document.getElementById('settings-frame') as HTMLIFrameElement,
  
  // Toast
  toast: document.getElementById('toast') as HTMLElement,
  
  // Developer Mode
  devBanner: document.getElementById('dev-banner') as HTMLElement,
};

// ============================================================================
// State (UI-only, non-critical)
// ============================================================================

let lastResult: HistoryItem | null = null;
let isDarkTheme = false;
let isDevMode = false;
let recordingStartedAt: number | null = null;
let timerIntervalId: number | null = null;

// Audio visualization state (CSS-only, no mic access to avoid conflicts with ChatGPT)
let isVisualizerActive = false;

function formatDuration(seconds: number): string {
  return `SEC ${String(seconds).padStart(2, '0')}`;
}

function updateRecordingTimer(): void {
  if (recordingStartedAt === null) return;
  const elapsedSeconds = Math.floor((Date.now() - recordingStartedAt) / 1000);
  elements.statusTimer.textContent = formatDuration(elapsedSeconds);
}

function startRecordingTimer(): void {
  if (recordingStartedAt !== null) return;
  recordingStartedAt = Date.now();
  elements.statusTimer.style.display = 'inline-flex';
  updateRecordingTimer();
  timerIntervalId = window.setInterval(updateRecordingTimer, 1000);
}

function stopRecordingTimer(): void {
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  recordingStartedAt = null;
  elements.statusTimer.textContent = '';
  elements.statusTimer.style.display = 'none';
}

// ============================================================================
// Audio Visualization (CSS-based)
// ============================================================================

/**
 * Start CSS-based audio visualization.
 * Uses pure CSS animations to avoid conflicts with ChatGPT's microphone usage.
 * The actual audio is captured by ChatGPT, not by the extension popup.
 */
function startVisualization(): void {
  if (isVisualizerActive) return;
  
  isVisualizerActive = true;
  elements.audioVisualizer.classList.add('active');
  
  console.log('[EchoType] Visualizer started (CSS animation mode)');
}

/**
 * Stop audio visualization.
 */
function stopVisualization(): void {
  if (!isVisualizerActive) return;
  
  isVisualizerActive = false;
  elements.audioVisualizer.classList.remove('active');
  
  console.log('[EchoType] Visualizer stopped');
}

// ============================================================================
// Settings View
// ============================================================================

function openSettingsView(): void {
  const currentSrc = elements.settingsFrame.getAttribute('src');
  if (!currentSrc || currentSrc === 'about:blank' || !currentSrc.includes('embed=popup')) {
    elements.settingsFrame.src = chrome.runtime.getURL('src/options/index.html?embed=popup');
  }
  elements.settingsView.hidden = false;
  elements.body.classList.add('settings-open');
}

function closeSettingsView(): void {
  elements.body.classList.remove('settings-open');
  elements.settingsView.hidden = true;
}

function toggleSettingsView(): void {
  if (elements.body.classList.contains('settings-open')) {
    closeSettingsView();
  } else {
    openSettingsView();
  }
}

// ============================================================================
// Theme Management
// ============================================================================

async function loadTheme(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_THEME);
    isDarkTheme = result[STORAGE_KEY_THEME] === 'dark';
    applyTheme();
  } catch {
    // Default to system preference
    isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme();
  }
}

function applyTheme(): void {
  elements.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  updateThemeIcon();
}

function loadVersion(): void {
  if (!elements.popupVersion) return;
  const version = chrome.runtime.getManifest().version;
  elements.popupVersion.textContent = `v${version}`;
}

function updateThemeIcon(): void {
  const icon = isDarkTheme
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  elements.btnTheme.innerHTML = icon;
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

async function toggleTheme(): Promise<void> {
  isDarkTheme = !isDarkTheme;
  applyTheme();
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_THEME]: isDarkTheme ? 'dark' : 'light' });
  } catch (error) {
    console.error('[EchoType] Failed to save theme:', error);
  }
}

// ============================================================================
// Developer Mode
// ============================================================================

async function loadDevMode(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_DEV_MODE);
    isDevMode = result[STORAGE_KEY_DEV_MODE] === true;
    if (isDevMode) {
      elements.devBanner.classList.add('visible');
    }
  } catch {
    isDevMode = false;
  }
}

// ============================================================================
// Status Management (Single Source of Truth: Background)
// ============================================================================

/**
 * Fetch current status from Background Service Worker.
 * This is the ONLY source of truth for dictation status.
 * 
 * @returns Current dictation status from Background
 */
async function getStatusFromBackground(): Promise<DictationStatus> {
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.CMD_GET_STATUS });
    return response?.status || 'idle';
  } catch (error) {
    console.warn('[EchoType] Failed to get status from background:', error);
    return 'idle';
  }
}

/**
 * Check if currently recording based on Background state.
 * Always queries Background - no local caching.
 */
async function isRecording(): Promise<boolean> {
  const status = await getStatusFromBackground();
  return status === 'recording' || status === 'listening';
}

function updateStatusUI(status: DictationStatus): void {
  // Update badge
  elements.statusBadge.className = 'status-badge ' + getStatusClass(status);
  elements.statusText.textContent = getStatusLabel(status);
  
  // Determine if recording
  const isRecordingState = status === 'recording' || status === 'listening';
  const isProcessing = status === 'processing';

  // Update audio visualizer (CSS-based, no mic access)
  if (isRecordingState) {
    startRecordingTimer();
    startVisualization();
  } else {
    stopRecordingTimer();
    stopVisualization();
  }
  
  // Update toggle button based on state
  if (isRecordingState) {
    // Recording state: Show "Submit" (green)
    elements.btnToggle.classList.remove('btn-record-ready');
    elements.btnToggle.classList.add('btn-submit-ready');
    elements.btnToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span class="btn-text" data-i18n="btnSubmit">${getMessage('btnSubmit')}</span>
    `;
    elements.btnToggle.disabled = false;
    
    // Show cancel button
    elements.btnCancel.style.display = 'inline-flex';
    elements.btnCancel.disabled = false;
  } else {
    // Idle state: Show "Record" (red)
    elements.btnToggle.classList.remove('btn-submit-ready');
    elements.btnToggle.classList.add('btn-record-ready');
    elements.btnToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
      <span class="btn-text" data-i18n="btnRecord">${getMessage('btnRecord')}</span>
    `;
    elements.btnToggle.disabled = isProcessing;
    
    // Hide cancel button
    elements.btnCancel.style.display = 'none';
  }
  
  // Hide error card on successful status
  if (status !== 'error') {
    hideError();
  }
}

function getStatusClass(status: DictationStatus): string {
  switch (status) {
    case 'recording':
    case 'listening':
      return 'recording';
    case 'processing':
      return 'idle'; // Use idle style while processing
    case 'error':
      return 'idle';
    default:
      return 'idle';
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Error code to i18n key mapping
 */
const ERROR_I18N_MAP: Record<string, { title: string; desc: string }> = {
  TAB_NOT_FOUND: { title: 'errorTabNotFound', desc: 'errorTabNotFoundDesc' },
  INJECTION_FAILED: { title: 'errorConnectionFailed', desc: 'errorConnectionFailedDesc' },
  NOT_LOGGED_IN: { title: 'errorNotLoggedIn', desc: 'errorNotLoggedInDesc' },
  ALREADY_ACTIVE: { title: 'errorAlreadyActive', desc: 'errorAlreadyActiveDesc' },
  MICROPHONE_DENIED: { title: 'errorMicrophoneDenied', desc: 'errorMicrophoneDeniedDesc' },
  VOICE_INPUT_UNAVAILABLE: { title: 'errorNoVoice', desc: 'errorNoVoiceDesc' },
  SELECTOR_NOT_FOUND: { title: 'errorNoChatGPT', desc: 'errorNoChatGPTDesc' },
};

/**
 * Get localized error messages based on error code
 */
function getErrorMessages(error: { code?: string; message?: string }): { title: string; desc: string } {
  const code = error.code || '';
  const mapping = ERROR_I18N_MAP[code];
  
  if (mapping) {
    return {
      title: getMessage(mapping.title) || mapping.title,
      desc: getMessage(mapping.desc) || error.message || mapping.desc,
    };
  }
  
  // Fallback to generic error
  return {
    title: getMessage('errorStartFailed') || 'Error',
    desc: error.message || getMessage('errorNoChatGPTDesc') || 'An error occurred',
  };
}

function showError(title: string, message: string): void {
  elements.errorTitle.textContent = title;
  elements.errorMessage.textContent = message;
  elements.errorCard.style.display = 'block';
}

function showErrorFromCode(error: { code?: string; message?: string }): void {
  const { title, desc } = getErrorMessages(error);
  showError(title, desc);
}

function hideError(): void {
  elements.errorCard.style.display = 'none';
}

// ============================================================================
// Result Management
// ============================================================================

function updateResultUI(item: HistoryItem | null): void {
  lastResult = item;

  if (item) {
    elements.resultText.innerHTML = escapeHtml(item.text);
    elements.resultTime.textContent = formatTime(item.timestamp);
    elements.btnCopy.disabled = false;
  } else {
    elements.resultText.innerHTML = `<span class="result-empty">${getMessage('noResult')}</span>`;
    elements.resultTime.textContent = '';
    elements.btnCopy.disabled = true;
  }
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const locale = chrome.i18n.getUILanguage();
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Toast Notifications
// ============================================================================

function showToast(message: string): void {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2000);
}

// ============================================================================
// API Communication
// ============================================================================

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage(
      createMessage.offscreenClipboardWrite(text)
    ) as { success: boolean } | undefined;
    return response?.success || false;
  } catch (error) {
    console.error('[EchoType] Failed to copy:', error);
    return false;
  }
}

// ============================================================================
// Initial State Loading
// ============================================================================

async function loadInitialState(): Promise<void> {
  try {
    // Get current status from Background (Single Source of Truth)
    const status = await getStatusFromBackground();
    updateStatusUI(status);

    // Get last history item
    const historyResponse = await chrome.runtime.sendMessage({
      type: MSG.HISTORY_GET,
    }) as { items: HistoryItem[] } | undefined;
    if (historyResponse?.items?.length) {
      updateResultUI(historyResponse.items[0]);
    } else {
      updateResultUI(null);
    }
  } catch (error) {
    console.error('[EchoType] Failed to load initial state:', error);
    showError(getMessage('errorNoChatGPT'), getMessage('errorNoChatGPTDesc'));
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupEventListeners(): void {
  // Theme toggle
  elements.btnTheme.addEventListener('click', toggleTheme);
  
  // Toggle button: Start if idle, Submit if recording
  elements.btnToggle.addEventListener('click', async () => {
    // CRITICAL: Always query Background for current state (Single Source of Truth)
    const currentlyRecording = await isRecording();
    
    if (currentlyRecording) {
      // Submit dictation
      try {
        updateStatusUI('processing');
        const response = await chrome.runtime.sendMessage(
          createMessage.cmdSubmit()
        ) as { type: string; addedText?: string; error?: { message: string } } | undefined;
        
        if (response?.type === MSG.RESULT_READY) {
          // Refresh status from Background after submit
          const newStatus = await getStatusFromBackground();
          updateStatusUI(newStatus);
          if (response.addedText) {
            showToast(getMessage('submitSuccess'));
          }
        } else if (response?.error) {
          const newStatus = await getStatusFromBackground();
          updateStatusUI(newStatus);
          showErrorFromCode(response.error);
        }
      } catch (error) {
        console.error('[EchoType] Submit failed:', error);
        const newStatus = await getStatusFromBackground();
        updateStatusUI(newStatus);
        showToast(getMessage('errorSubmitFailed'));
      }
    } else {
      // Start dictation
      try {
        hideError();
        const response = await chrome.runtime.sendMessage(
          createMessage.cmdStart()
        ) as { ok: boolean; error?: { message: string } } | undefined;
        
        if (response?.ok) {
          // Refresh status from Background after start
          const newStatus = await getStatusFromBackground();
          updateStatusUI(newStatus);
        } else if (response?.error) {
          showErrorFromCode(response.error);
        }
      } catch (error) {
        console.error('[EchoType] Start failed:', error);
        showErrorFromCode({ code: 'INJECTION_FAILED', message: String(error) });
      }
    }
  });
  
  // Cancel button: Stop recording and clear
  elements.btnCancel.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage(createMessage.cmdPause());
      // Refresh status from Background after cancel
      const newStatus = await getStatusFromBackground();
      updateStatusUI(newStatus);
      showToast(getMessage('cancelSuccess'));
    } catch (error) {
      console.error('[EchoType] Cancel failed:', error);
      const newStatus = await getStatusFromBackground();
      updateStatusUI(newStatus);
      showToast(getMessage('errorCancelFailed'));
    }
  });
  
  // Copy to clipboard with micro-interaction
  elements.btnCopy.addEventListener('click', async () => {
    if (!lastResult || elements.btnCopy.disabled) return;
    
    // Start copying animation
    elements.btnCopy.classList.add('copying');
    elements.btnCopy.disabled = true;
    
    const success = await copyToClipboard(lastResult.text);
    
    // Remove copying class
    elements.btnCopy.classList.remove('copying');
    
    if (success) {
      // Success animation
      const originalHTML = elements.btnCopy.innerHTML;
      elements.btnCopy.classList.add('copied');
      elements.btnCopy.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${getMessage('copied')}</span>
      `;
      showToast(getMessage('copied'));
      
      // Reset after animation
      setTimeout(() => {
        elements.btnCopy.classList.remove('copied');
        elements.btnCopy.innerHTML = originalHTML;
        elements.btnCopy.disabled = false;
      }, 1500);
    } else {
      // Failure animation
      elements.btnCopy.classList.add('copy-failed');
      showToast(getMessage('copyFailed'));
      
      // Reset after animation
      setTimeout(() => {
        elements.btnCopy.classList.remove('copy-failed');
        elements.btnCopy.disabled = false;
      }, 500);
    }
  });
  
  // Navigation
  elements.btnSettings.addEventListener('click', toggleSettingsView);
  
  elements.linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSettingsView();
  });
  
  elements.linkHistory.addEventListener('click', (e) => {
    e.preventDefault();
    openSettingsView();
  });
}

// ============================================================================
// Message Listener (for real-time updates from Background)
// ============================================================================

function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    // Handle status changes from Background
    if (message.type === MSG.STATUS_CHANGED) {
      updateStatusUI(message.status);
    }
    
    // Handle result broadcasts
    if (message.type === MSG.BROADCAST_RESULT || message.type === MSG.RESULT_READY) {
      if (message.historyItem) {
        updateResultUI(message.historyItem);
        showToast(getMessage('submitSuccess'));
      } else if (message.addedText) {
        updateResultUI({
          id: `${Date.now()}`,
          text: message.addedText,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        });
        showToast(getMessage('submitSuccess'));
      }
      getStatusFromBackground().then(updateStatusUI).catch(() => {});
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
      if (isDevMode) {
        elements.devBanner.classList.add('visible');
      } else {
        elements.devBanner.classList.remove('visible');
      }
    }

    if (area === 'session' && changes[STORAGE_KEY_HISTORY]?.newValue) {
      const items = changes[STORAGE_KEY_HISTORY].newValue as HistoryItem[];
      updateResultUI(items?.[0] ?? null);
    }

    if (area === 'local' && changes[STORAGE_KEY_LANGUAGE]?.newValue) {
      const nextLocale = String(changes[STORAGE_KEY_LANGUAGE].newValue || '');
      const localeForUi = nextLocale || chrome.i18n.getUILanguage();
      setLocaleOverride(nextLocale).then(() => {
        applyDirection(localeForUi);
        applyI18n();
        getStatusFromBackground().then(updateStatusUI).catch(() => {});
        updateResultUI(lastResult);
        loadShortcutDisplay().catch(() => {});
      });
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  await initI18n();
  // Set RTL direction for RTL languages
  const storedLang = await chrome.storage.local.get(STORAGE_KEY_LANGUAGE);
  const uiLang = (storedLang[STORAGE_KEY_LANGUAGE] as string | undefined) || chrome.i18n.getUILanguage();
  applyDirection(uiLang);
  
  // Apply i18n translations to all elements with data-i18n attributes
  applyI18n();
  loadVersion();
  
  await loadShortcutDisplay();
  
  await Promise.all([
    loadTheme(),
    loadDevMode(),
  ]);
  
  setupEventListeners();
  setupMessageListener();
  setupStorageListener();
  await loadInitialState();
}

// Start the application
init().catch(console.error);
