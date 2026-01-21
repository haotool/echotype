/**
 * EchoType - History Management
 * @module background/history
 *
 * Manages dictation history using chrome.storage.session.
 */

import type { HistoryItem } from '@shared/types';
import { generateId } from '@shared/utils';
import { STORAGE_KEYS } from '@shared/constants';
import { logger } from '@shared/logger';
import { loadSettings } from './settings';

// ============================================================================
// History API
// ============================================================================

/**
 * Load history from session storage.
 *
 * @returns History items (newest first)
 */
export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const result = await chrome.storage.session.get(STORAGE_KEYS.HISTORY);
    return (result[STORAGE_KEYS.HISTORY] as HistoryItem[]) || [];
  } catch (error) {
    logger.error(' Failed to load history:', error);
    return [];
  }
}

/**
 * Save history to session storage.
 *
 * @param history - History items to save
 */
async function saveHistory(history: HistoryItem[]): Promise<void> {
  try {
    await chrome.storage.session.set({ [STORAGE_KEYS.HISTORY]: history });
  } catch (error) {
    logger.error(' Failed to save history:', error);
  }
}

/**
 * Add a new item to history.
 *
 * @param text - The dictation text
 * @returns The created history item
 */
export async function addToHistory(text: string): Promise<HistoryItem> {
  const settings = await loadSettings();
  const history = await loadHistory();

  const item: HistoryItem = {
    id: generateId(),
    timestamp: Date.now(),
    text,
    createdAt: new Date().toISOString(),
  };

  // Add to front (newest first)
  history.unshift(item);

  // Trim to max size
  if (history.length > settings.historySize) {
    history.length = settings.historySize;
  }

  await saveHistory(history);
  return item;
}

/**
 * Get a specific history item by ID.
 *
 * @param id - Item ID
 * @returns The item or null
 */
export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  const history = await loadHistory();
  return history.find((item) => item.id === id) || null;
}

/**
 * Get the most recent history item.
 *
 * @returns Most recent item or null
 */
export async function getLastHistoryItem(): Promise<HistoryItem | null> {
  const history = await loadHistory();
  return history[0] || null;
}

/**
 * Clear all history.
 */
export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}

/**
 * Remove a specific item from history.
 *
 * @param id - Item ID to remove
 */
export async function removeFromHistory(id: string): Promise<void> {
  const history = await loadHistory();
  const filtered = history.filter((item) => item.id !== id);
  await saveHistory(filtered);
}
