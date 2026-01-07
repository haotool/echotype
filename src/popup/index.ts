/**
 * Popup UI Controller
 * @module src/popup/index
 *
 * Handles the extension popup UI interactions and state display.
 * Updated: 2026-01-08T00:20:00+08:00 [context7:chrome/extensions]
 */

import type { HistoryItem, DictationStatus } from '../shared/types';
import { MSG, createMessage } from '../shared/protocol';
import { getMessage, applyI18n, formatRelativeTime } from '../shared/i18n';

// DOM Elements
const statusBadge = document.getElementById('status') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const btnStop = document.getElementById('btn-stop') as HTMLButtonElement;
const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement;
const resultText = document.getElementById('result-text') as HTMLElement;
const resultTime = document.getElementById('result-time') as HTMLElement;
const linkOptions = document.getElementById('link-options') as HTMLElement;
const linkHistory = document.getElementById('link-history') as HTMLElement;
const toast = document.getElementById('toast') as HTMLElement;

/**
 * Current extension state
 */
let lastResult: HistoryItem | null = null;

/**
 * Update UI based on current status
 */
function updateStatusUI(status: DictationStatus): void {
  // Map status to CSS class
  const cssClass =
    status === 'listening' ? 'recording' : status === 'idle' ? 'idle' : 'idle';
  statusBadge.className = 'status-badge ' + cssClass;

  // Update status text with i18n
  const statusKeys: Record<DictationStatus, string> = {
    idle: 'statusReady',
    listening: 'statusRecording',
    recording: 'statusRecording',
    processing: 'statusProcessing',
    error: 'statusError',
    unknown: 'statusReady',
  };
  statusText.textContent = getMessage(statusKeys[status]);

  // Update button states
  const isRecording = status === 'listening';
  btnStart.disabled = isRecording || status === 'processing';
  btnStop.disabled = !isRecording;
  btnSubmit.disabled = !isRecording;
}

/**
 * Update last result display
 */
function updateResultUI(item: HistoryItem | null): void {
  lastResult = item;

  if (item) {
    resultText.innerHTML = escapeHtml(item.text);
    resultTime.textContent = formatRelativeTime(item.timestamp);
    btnCopy.disabled = false;
  } else {
    resultText.innerHTML = `<span class="result-empty">${getMessage('noResult')}</span>`;
    resultTime.textContent = '';
    btnCopy.disabled = true;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

/**
 * Send message to background service worker
 */
async function sendMessage<T>(message: unknown): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Load initial state from background
 */
async function loadInitialState(): Promise<void> {
  try {
    // Get current status
    const statusResponse = await sendMessage<{ status: DictationStatus }>(
      createMessage.cmdGetStatus()
    );
    if (statusResponse?.status) {
      updateStatusUI(statusResponse.status);
    }

    // Get last history item
    const historyResponse = await sendMessage<{ items: HistoryItem[] }>(
      createMessage.historyGet()
    );
    if (historyResponse?.items?.length > 0) {
      updateResultUI(historyResponse.items[0]);
    }
  } catch (error) {
    console.error('Failed to load initial state:', error);
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

// Event Listeners
btnStart.addEventListener('click', async () => {
  try {
    await sendMessage(createMessage.cmdStart());
    updateStatusUI('listening');
  } catch (error) {
    console.error('Start failed:', error);
  }
});

btnStop.addEventListener('click', async () => {
  try {
    await sendMessage(createMessage.cmdPause());
    updateStatusUI('idle');
  } catch (error) {
    console.error('Pause failed:', error);
  }
});

btnSubmit.addEventListener('click', async () => {
  try {
    updateStatusUI('processing');
    await sendMessage(createMessage.cmdSubmit());
    // Result will come via message listener
  } catch (error) {
    console.error('Submit failed:', error);
    updateStatusUI('error');
  }
});

btnCopy.addEventListener('click', async () => {
  if (lastResult) {
    const success = await copyToClipboard(lastResult.text);
    if (success) {
      showToast(getMessage('copied'));
    }
  }
});

linkOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

linkHistory.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Listen for status updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MSG.STATUS_CHANGED) {
    updateStatusUI(message.status);
  }
  if (message.type === MSG.BROADCAST_RESULT) {
    updateStatusUI('idle');
    updateResultUI(message.historyItem);
    showToast(getMessage('copied'));
  }
});

// Initialize
applyI18n();
loadInitialState();
