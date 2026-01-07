/**
 * Popup UI Controller
 * @module src/popup/index
 * 
 * Handles the extension popup UI interactions and state display.
 * Updated: 2026-01-07T22:29:00+08:00 [context7:chrome/extensions]
 */

import type { HistoryItem, DictationStatus } from '../shared/types';
import { MSG } from '../shared/protocol';

// Message type aliases for cleaner code
const CMD_START = MSG.CMD_START;
const CMD_PAUSE = MSG.CMD_PAUSE;
const CMD_SUBMIT = MSG.CMD_SUBMIT;
const MSG_GET_STATUS = MSG.GET_STATUS;
const MSG_GET_HISTORY = MSG.GET_HISTORY;

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
  // Update badge
  statusBadge.className = 'status-badge ' + status;
  
  // Update status text
  const statusLabels: Record<DictationStatus, string> = {
    idle: 'Ready',
    listening: 'Listening',
    recording: 'Recording',
    processing: 'Processing',
    error: 'Error',
    unknown: 'Unknown',
  };
  statusText.textContent = statusLabels[status];
  
  // Update button states
  const isRecording = status === 'recording' || status === 'listening';
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
    resultTime.textContent = formatTime(item.timestamp);
    btnCopy.disabled = false;
  } else {
    resultText.innerHTML = '<span class="result-empty">No dictation yet</span>';
    resultTime.textContent = '';
    btnCopy.disabled = true;
  }
}

/**
 * Format timestamp to readable time
 */
function formatTime(ts: number | string): string {
  const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
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
async function sendMessage<T>(message: { type: string; payload?: unknown }): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Load initial state from background
 */
async function loadInitialState(): Promise<void> {
  try {
    // Get current status
    const statusResponse = await sendMessage<{ status: DictationStatus }>({ 
      type: MSG_GET_STATUS 
    });
    if (statusResponse?.status) {
      updateStatusUI(statusResponse.status);
    }
    
    // Get last history item
    const historyResponse = await sendMessage<{ history: HistoryItem[] }>({ 
      type: MSG_GET_HISTORY 
    });
    if (historyResponse?.history?.length > 0) {
      updateResultUI(historyResponse.history[0]);
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
    await sendMessage({ type: CMD_START });
    updateStatusUI('recording');
  } catch (error) {
    console.error('Start failed:', error);
  }
});

btnStop.addEventListener('click', async () => {
  try {
    await sendMessage({ type: CMD_PAUSE });
    updateStatusUI('idle');
  } catch (error) {
    console.error('Pause failed:', error);
  }
});

btnSubmit.addEventListener('click', async () => {
  try {
    updateStatusUI('processing');
    await sendMessage({ type: CMD_SUBMIT });
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
      showToast('Copied!');
    }
  }
});

linkOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

linkHistory.addEventListener('click', () => {
  // TODO: Open history page or show history panel
  chrome.runtime.openOptionsPage();
});

// Listen for status updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STATUS_CHANGED') {
    updateStatusUI(message.payload.status);
  }
  if (message.type === 'RESULT_READY') {
    updateStatusUI('idle');
    updateResultUI({
      text: message.payload.addedText,
      timestamp: Date.now(),
      source: 'chatgpt',
    });
    showToast('Dictation captured!');
  }
});

// Initialize
loadInitialState();
