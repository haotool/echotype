/**
 * EchoType - ChatGPT Tab Manager
 * @module background/tab-manager
 *
 * Manages the ChatGPT tab for dictation operations.
 * Handles tab creation, focus, and lifecycle.
 *
 * @version 2.0.0 - Enhanced robustness for tab management
 */

import type { ChatGPTTabInfo } from '@shared/types';
import { CHATGPT_URLS } from '@shared/constants';
import { CONFIG } from '@shared/config';
import { logger } from '@shared/logger';

// ============================================================================
// State
// ============================================================================

interface TabManagerState {
  /** The ChatGPT tab info */
  chatgptTab: ChatGPTTabInfo | null;
  /** The tab that was active before switching to ChatGPT */
  previousTabId: number | null;
  /** The window that was focused before switching */
  previousWindowId: number | null;
  /** Origin tab to return to after deferred capture */
  captureOriginTabId: number | null;
  /** Origin window to return to after deferred capture */
  captureOriginWindowId: number | null;
}

const state: TabManagerState = {
  chatgptTab: null,
  previousTabId: null,
  previousWindowId: null,
  captureOriginTabId: null,
  captureOriginWindowId: null,
};

// ============================================================================
// Tab Discovery
// ============================================================================

/**
 * Find an existing ChatGPT tab.
 *
 * @returns ChatGPT tab info or null
 */
export async function findChatGPTTab(): Promise<ChatGPTTabInfo | null> {
  try {
    const tabs = await chrome.tabs.query({ url: CHATGPT_URLS.PATTERN });
    const tab = tabs[0];

    if (tab && tab.id !== undefined && tab.windowId !== undefined) {
      return {
        tabId: tab.id,
        windowId: tab.windowId,
        url: tab.url || CHATGPT_URLS.TEMPORARY_CHAT,
      };
    }

    return null;
  } catch (error) {
    logger.error('Error finding ChatGPT tab:', error);
    return null;
  }
}

/**
 * Create a new ChatGPT tab.
 *
 * @param active - Whether to make the tab active
 * @returns New tab info
 */
export async function createChatGPTTab(
  active = true
): Promise<ChatGPTTabInfo | null> {
  try {
    const tab = await chrome.tabs.create({
      url: CHATGPT_URLS.TEMPORARY_CHAT,
      active,
    });

    if (tab.id === undefined || tab.windowId === undefined) {
      return null;
    }

    return {
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url || CHATGPT_URLS.TEMPORARY_CHAT,
    };
  } catch (error) {
    logger.error('Error creating ChatGPT tab:', error);
    return null;
  }
}

// ============================================================================
// Tab Management
// ============================================================================

/**
 * Ensure a ChatGPT tab exists and is ready.
 * Creates one if it doesn't exist.
 * Includes validation and recovery logic.
 *
 * @param makeActive - Whether to make the tab active
 * @returns ChatGPT tab info
 */
export async function ensureChatGPTTab(
  makeActive = true
): Promise<ChatGPTTabInfo | null> {
  // First, check if we have a cached tab that's still valid
  if (state.chatgptTab) {
    const valid = await isTabValid(state.chatgptTab.tabId);
    if (!valid) {
      logger.log('Cached ChatGPT tab is no longer valid, clearing');
      state.chatgptTab = null;
    }
  }

  // Try to find existing tab
  let tabInfo = await findChatGPTTab();

  // Create if not found
  if (!tabInfo) {
    logger.log('No ChatGPT tab found, creating new one');
    tabInfo = await createChatGPTTab(makeActive);
    
    if (tabInfo) {
      // Wait for the new tab to fully load
      logger.log('Waiting for new tab to load...');
      const loaded = await waitForTabComplete(tabInfo.tabId);
      if (!loaded) {
        logger.warn('Tab did not complete loading in time');
      }
      
      // Add a small delay for DOM to be ready
      await delay(500);
    }
  } else if (makeActive) {
    // Activate existing tab
    await activateChatGPTTab(tabInfo);
    
    // Ensure tab is fully loaded
    const loaded = await waitForTabComplete(tabInfo.tabId, 3000);
    if (!loaded) {
      logger.log('Existing tab may still be loading');
    }
  }

  // Update state
  state.chatgptTab = tabInfo;

  return tabInfo;
}

/**
 * Activate the ChatGPT tab (bring to front).
 *
 * @param tabInfo - Tab info to activate
 */
export async function activateChatGPTTab(
  tabInfo: ChatGPTTabInfo,
  options: { trackPrevious?: boolean } = {}
): Promise<void> {
  try {
    const { trackPrevious = true } = options;
    // Store current active tab for later restoration
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (trackPrevious && currentTab?.id && currentTab.id !== tabInfo.tabId) {
      state.previousTabId = currentTab.id;
      state.previousWindowId = currentTab.windowId;
    }

    // Activate the ChatGPT tab
    await chrome.tabs.update(tabInfo.tabId, { active: true });

    // Focus the window if different
    if (tabInfo.windowId !== state.previousWindowId) {
      await chrome.windows.update(tabInfo.windowId, { focused: true });
    }
  } catch (error) {
    logger.error('Error activating ChatGPT tab:', error);
  }
}

/**
 * Return focus to the previously active tab.
 */
export async function returnToPreviousTab(): Promise<void> {
  if (state.previousTabId === null) return;

  try {
    await chrome.tabs.update(state.previousTabId, { active: true });

    if (state.previousWindowId !== null) {
      await chrome.windows.update(state.previousWindowId, { focused: true });
    }
  } catch (error) {
    // Tab may have been closed
    logger.warn('Could not return to previous tab:', error);
  } finally {
    state.previousTabId = null;
    state.previousWindowId = null;
  }
}

/**
 * Remember the currently active tab as the capture origin.
 * Used to return after deferred capture completes.
 * @param options.force - Overwrite existing origin when true.
 */
export async function rememberCaptureOrigin(
  options: { force?: boolean } = {}
): Promise<void> {
  const { force = true } = options;
  if (!force && state.captureOriginTabId !== null) {
    return;
  }

  try {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (currentTab?.id) {
      state.captureOriginTabId = currentTab.id;
      state.captureOriginWindowId = currentTab.windowId ?? null;
    }
  } catch (error) {
    logger.warn('Failed to remember capture origin:', error);
  }
}

/**
 * Return focus to the remembered capture origin tab.
 *
 * @param clear - Whether to clear the stored origin after returning
 */
export async function returnToCaptureOrigin(clear = true): Promise<void> {
  if (state.captureOriginTabId === null) return;

  try {
    await chrome.tabs.update(state.captureOriginTabId, { active: true });

    if (state.captureOriginWindowId !== null) {
      await chrome.windows.update(state.captureOriginWindowId, { focused: true });
    }
  } catch (error) {
    logger.warn('Could not return to capture origin:', error);
  } finally {
    if (clear) {
      state.captureOriginTabId = null;
      state.captureOriginWindowId = null;
    }
  }
}

/**
 * Get the remembered capture origin.
 */
export function getCaptureOrigin(): { tabId: number; windowId: number | null } | null {
  if (state.captureOriginTabId === null) return null;
  return {
    tabId: state.captureOriginTabId,
    windowId: state.captureOriginWindowId,
  };
}

/**
 * Clear the remembered capture origin.
 */
export function clearCaptureOrigin(): void {
  state.captureOriginTabId = null;
  state.captureOriginWindowId = null;
}

/**
 * Get current active tab info.
 *
 * @returns Current tab id or null
 */
export async function getCurrentTab(): Promise<number | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the stored ChatGPT tab info.
 */
export function getChatGPTTabInfo(): ChatGPTTabInfo | null {
  return state.chatgptTab;
}

/**
 * Wait for a tab to finish loading.
 *
 * @param tabId - Tab ID to wait for
 * @param timeoutMs - Timeout in milliseconds
 * @returns True if tab completed, false on timeout
 */
export async function waitForTabComplete(
  tabId: number,
  timeoutMs: number = CONFIG.TAB.COMPLETE_TIMEOUT_MS
): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      return true;
    }
  } catch (error) {
    logger.warn('Failed to read tab status:', error);
    return false;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(false);
    }, timeoutMs);

    const listener = (updatedTabId: number, changeInfo: { status?: string }) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status !== 'complete') return;

      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(true);
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Wait for a short delay (humanized timing).
 * @param ms - Delay in milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify that a tab is still valid and accessible.
 * @param tabId - Tab ID to verify
 * @returns True if tab exists and is accessible
 */
export async function isTabValid(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return Boolean(tab && !tab.discarded && tab.url?.startsWith('https://chatgpt.com'));
  } catch {
    return false;
  }
}

/**
 * Refresh a tab if it's stale or has an error.
 * @param tabId - Tab ID to refresh
 */
export async function refreshTabIfNeeded(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    const needsChatGPT =
      !url.startsWith('https://chatgpt.com') || !url.includes('temporary-chat=true');

    if (needsChatGPT) {
      await chrome.tabs.update(tabId, { url: CHATGPT_URLS.TEMPORARY_CHAT });
      return await waitForTabComplete(tabId);
    }

    return true;
  } catch (error) {
    logger.error(' Failed to refresh tab:', error);
    return false;
  }
}

/**
 * Send a message to the ChatGPT tab with retry logic.
 *
 * @param message - Message to send
 * @param retries - Number of retries (default: CONFIG.TAB.MAX_RETRIES)
 * @returns Response from content script
 */
export async function sendToChatGPTTab<T>(
  message: unknown,
  retries = CONFIG.TAB.MAX_RETRIES
): Promise<T | null> {
  if (!state.chatgptTab) {
    logger.error(' No ChatGPT tab available');
    return null;
  }

  const tabId = state.chatgptTab.tabId;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Verify tab is still valid
      const valid = await isTabValid(tabId);
      if (!valid) {
        console.warn(`[EchoType] Tab ${tabId} is no longer valid, clearing state`);
        state.chatgptTab = null;
        return null;
      }

      const response = await chrome.tabs.sendMessage(tabId, message);
      return response as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a connection error that might be recoverable
      if (errorMessage.includes('Receiving end does not exist') && attempt < retries) {
        console.warn(`[EchoType] Connection failed, retrying (${attempt + 1}/${retries})...`);
        await delay(CONFIG.TAB.RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
        continue;
      }

      logger.error('Error sending message to ChatGPT tab:', error);
      return null;
    }
  }

  return null;
}

// ============================================================================
// Tab Event Listeners
// ============================================================================

/**
 * Handle tab removal to clean up state.
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (state.chatgptTab?.tabId === tabId) {
    state.chatgptTab = null;
  }
  if (state.previousTabId === tabId) {
    state.previousTabId = null;
  }
  if (state.captureOriginTabId === tabId) {
    state.captureOriginTabId = null;
    state.captureOriginWindowId = null;
  }
});
