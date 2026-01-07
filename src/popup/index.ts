/**
 * EchoType Popup Controller
 * Modern UI with theme support and developer mode
 * 
 * @version 2.0.0
 * @updated 2026-01-08
 */

import type { HistoryItem, DictationStatus } from '../shared/types';
import { MSG, createMessage } from '../shared/protocol';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_THEME = 'echotype_theme';
const STORAGE_KEY_DEV_MODE = 'echotype_dev_mode';

const STATUS_LABELS: Record<DictationStatus, string> = {
  idle: 'Ready',
  listening: 'Listening...',
  recording: 'Recording',
  processing: 'Processing...',
  error: 'Error',
  unknown: 'Checking...',
};

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  // Theme
  body: document.body,
  btnTheme: document.getElementById('btn-theme') as HTMLButtonElement,
  
  // Status
  statusBadge: document.getElementById('status-badge') as HTMLElement,
  statusText: document.getElementById('status-text') as HTMLElement,
  waveform: document.getElementById('waveform') as HTMLElement,
  
  // Error
  errorCard: document.getElementById('error-card') as HTMLElement,
  errorTitle: document.getElementById('error-title') as HTMLElement,
  errorMessage: document.getElementById('error-message') as HTMLElement,
  
  // Actions
  btnStart: document.getElementById('btn-start') as HTMLButtonElement,
  btnStop: document.getElementById('btn-stop') as HTMLButtonElement,
  btnSubmit: document.getElementById('btn-submit') as HTMLButtonElement,
  btnCopy: document.getElementById('btn-copy') as HTMLButtonElement,
  
  // Result
  resultText: document.getElementById('result-text') as HTMLElement,
  resultTime: document.getElementById('result-time') as HTMLElement,
  
  // Navigation
  btnSettings: document.getElementById('btn-settings') as HTMLButtonElement,
  linkOptions: document.getElementById('link-options') as HTMLAnchorElement,
  linkHistory: document.getElementById('link-history') as HTMLAnchorElement,
  
  // Toast
  toast: document.getElementById('toast') as HTMLElement,
  
  // Developer Mode
  devBanner: document.getElementById('dev-banner') as HTMLElement,
};

// ============================================================================
// State
// ============================================================================

let lastResult: HistoryItem | null = null;
let isDarkTheme = false;
let isDevMode = false;

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

function updateThemeIcon(): void {
  const icon = isDarkTheme
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  elements.btnTheme.innerHTML = icon;
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
// Status Management
// ============================================================================

function updateStatusUI(status: DictationStatus): void {
  // Update badge
  elements.statusBadge.className = 'status-badge ' + getStatusClass(status);
  elements.statusText.textContent = STATUS_LABELS[status];
  
  // Update waveform
  const isActive = status === 'recording' || status === 'listening';
  elements.waveform.classList.toggle('active', isActive);
  
  // Update button states
  const isRecording = status === 'recording' || status === 'listening';
  elements.btnStart.disabled = isRecording || status === 'processing';
  elements.btnStop.disabled = !isRecording;
  elements.btnSubmit.disabled = !isRecording;
  
  // Update start button style for recording state
  if (isRecording) {
    elements.btnStart.classList.add('btn-recording');
  } else {
    elements.btnStart.classList.remove('btn-recording');
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

function showError(title: string, message: string): void {
  elements.errorTitle.textContent = title;
  elements.errorMessage.textContent = message;
  elements.errorCard.style.display = 'block';
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
    elements.resultText.innerHTML = '<span class="result-empty">No dictation yet</span>';
    elements.resultTime.textContent = '';
    elements.btnCopy.disabled = true;
  }
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
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

async function sendMessage<T>(message: unknown): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const response = await sendMessage<{ success: boolean }>(
      createMessage.offscreenClipboardWrite(text)
    );
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
    // Get current status
    const statusResponse = await sendMessage<{ status: DictationStatus }>({
      type: MSG.CMD_GET_STATUS,
    });
    if (statusResponse?.status) {
      updateStatusUI(statusResponse.status);
    }

    // Get last history item
    const historyResponse = await sendMessage<{ items: HistoryItem[] }>({
      type: MSG.HISTORY_GET,
    });
    if (historyResponse?.items?.length > 0) {
      updateResultUI(historyResponse.items[0]);
    }
  } catch (error) {
    console.error('[EchoType] Failed to load initial state:', error);
    showError('Connection Error', 'Unable to connect to ChatGPT. Please ensure ChatGPT is open in a tab.');
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupEventListeners(): void {
  // Theme toggle
  elements.btnTheme.addEventListener('click', toggleTheme);
  
  // Start dictation
  elements.btnStart.addEventListener('click', async () => {
    try {
      hideError();
      const response = await sendMessage<{ ok: boolean; error?: { message: string } }>(
        createMessage.cmdStart()
      );
      if (!response?.ok && response?.error) {
        showError('Start Failed', response.error.message);
      }
    } catch (error) {
      console.error('[EchoType] Start failed:', error);
      showError('Start Failed', 'Unable to start dictation. Is ChatGPT open?');
    }
  });
  
  // Stop/Pause dictation
  elements.btnStop.addEventListener('click', async () => {
    try {
      await sendMessage(createMessage.cmdPause());
    } catch (error) {
      console.error('[EchoType] Pause failed:', error);
      showToast('Pause failed');
    }
  });
  
  // Submit dictation
  elements.btnSubmit.addEventListener('click', async () => {
    try {
      updateStatusUI('processing');
      const response = await sendMessage<{ type: string; addedText?: string; error?: { message: string } }>(
        createMessage.cmdSubmit()
      );
      if (response?.type === MSG.RESULT_READY && response.addedText) {
        showToast('Captured successfully!');
      } else if (response?.error) {
        showError('Submit Failed', response.error.message);
      }
    } catch (error) {
      console.error('[EchoType] Submit failed:', error);
      showToast('Submit failed');
    }
  });
  
  // Copy to clipboard
  elements.btnCopy.addEventListener('click', async () => {
    if (lastResult) {
      const success = await copyToClipboard(lastResult.text);
      showToast(success ? 'Copied!' : 'Copy failed');
    }
  });
  
  // Navigation
  elements.btnSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  elements.linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  elements.linkHistory.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// ============================================================================
// Message Listener
// ============================================================================

function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MSG.STATUS_CHANGED) {
      updateStatusUI(message.status);
    }
    if (message.type === MSG.BROADCAST_RESULT || message.type === MSG.RESULT_READY) {
      if (message.historyItem) {
        updateResultUI(message.historyItem);
        showToast('Dictation captured!');
      } else if (message.addedText) {
        updateResultUI({
          id: `${Date.now()}`,
          text: message.addedText,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        });
        showToast('Dictation captured!');
      }
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  await Promise.all([
    loadTheme(),
    loadDevMode(),
  ]);
  
  setupEventListeners();
  setupMessageListener();
  await loadInitialState();
}

// Start the application
init().catch(console.error);

