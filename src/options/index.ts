/**
 * EchoType - Options Page
 * @module options
 *
 * Settings page for the extension with history management.
 * Updated: 2026-01-07T22:35:00+08:00
 */

import type { EchoTypeSettings, HistoryItem } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { MSG } from '@shared/protocol';

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
  historyList: document.getElementById('historyList') as HTMLElement,
  clearHistory: document.getElementById('clearHistory') as HTMLButtonElement,
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
  
  // Load history
  await loadHistoryUI();
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
// History Functions
// ============================================================================

/**
 * Format timestamp to readable time
 */
function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Within last hour
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? '剛才' : `${mins} 分鐘前`;
  }
  
  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Older
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Truncate text
 */
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * Load and render history
 */
async function loadHistoryUI(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.GET_HISTORY });
    const items: HistoryItem[] = response?.history || [];
    
    renderHistory(items);
    elements.clearHistory.disabled = items.length === 0;
  } catch (error) {
    console.error('Failed to load history:', error);
    elements.historyList.innerHTML = '<div class="history-empty">載入失敗</div>';
  }
}

/**
 * Render history items
 */
function renderHistory(items: HistoryItem[]): void {
  if (items.length === 0) {
    elements.historyList.innerHTML = '<div class="history-empty">沒有聽寫記錄</div>';
    return;
  }

  elements.historyList.innerHTML = items.map((item, index) => `
    <div class="history-item" data-index="${index}">
      <div class="history-text">${escapeHtml(truncateText(item.text))}</div>
      <span class="history-time">${formatTime(item.timestamp)}</span>
      <button class="history-copy" data-text="${escapeHtml(item.text)}">複製</button>
    </div>
  `).join('');

  // Add copy event listeners
  elements.historyList.querySelectorAll('.history-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const text = target.dataset.text || '';
      const success = await copyToClipboard(text);
      if (success) {
        target.textContent = '✓';
        setTimeout(() => {
          target.textContent = '複製';
        }, 1500);
      }
    });
  });
}

/**
 * Clear all history
 */
async function handleClearHistory(): Promise<void> {
  if (!confirm('確定要清除所有歷史記錄嗎？')) return;
  
  try {
    await chrome.runtime.sendMessage({ type: MSG.HISTORY_CLEAR });
    await loadHistoryUI();
    showSaveStatus();
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

elements.autoCopyToClipboard.addEventListener('change', handleChange);
elements.autoPasteToActiveTab.addEventListener('change', handleChange);
elements.returnFocusAfterStart.addEventListener('change', handleChange);
elements.clearHistory.addEventListener('click', handleClearHistory);

// Listen for history updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'RESULT_READY' || message.type === MSG.BROADCAST_RESULT) {
    loadHistoryUI();
  }
});

// ============================================================================
// Initialize
// ============================================================================

loadUI();
