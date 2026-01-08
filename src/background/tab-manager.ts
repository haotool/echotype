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

// ============================================================================
// Configuration
// ============================================================================

const CHATGPT_URL = 'https://chatgpt.com/?temporary-chat=true';
const CHATGPT_PATTERN = 'https://chatgpt.com/*';

/** Maximum retries for tab operations */
const MAX_RETRIES = 5;
/** Delay between retries in ms */
const RETRY_DELAY = 300;
/** Timeout for tab complete in ms */
const TAB_COMPLETE_TIMEOUT = 10000;

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
}

const state: TabManagerState = {
  chatgptTab: null,
  previousTabId: null,
  previousWindowId: null,
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
    const tabs = await chrome.tabs.query({ url: CHATGPT_PATTERN });
    const tab = tabs[0];

    if (tab && tab.id !== undefined && tab.windowId !== undefined) {
      return {
        tabId: tab.id,
        windowId: tab.windowId,
        url: tab.url || CHATGPT_URL,
      };
    }

    return null;
  } catch (error) {
    console.error('[EchoType] Error finding ChatGPT tab:', error);
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
      url: CHATGPT_URL,
      active,
    });

    if (tab.id === undefined || tab.windowId === undefined) {
      return null;
    }

    return {
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url || CHATGPT_URL,
    };
  } catch (error) {
    console.error('[EchoType] Error creating ChatGPT tab:', error);
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
      console.log('[EchoType] Cached ChatGPT tab is no longer valid, clearing');
      state.chatgptTab = null;
    }
  }

  // Try to find existing tab
  let tabInfo = await findChatGPTTab();

  // Create if not found
  if (!tabInfo) {
    console.log('[EchoType] No ChatGPT tab found, creating new one');
    tabInfo = await createChatGPTTab(makeActive);
    
    if (tabInfo) {
      // Wait for the new tab to fully load
      console.log('[EchoType] Waiting for new tab to load...');
      const loaded = await waitForTabComplete(tabInfo.tabId);
      if (!loaded) {
        console.warn('[EchoType] Tab did not complete loading in time');
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
      console.log('[EchoType] Existing tab may still be loading');
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
export async function activateChatGPTTab(tabInfo: ChatGPTTabInfo): Promise<void> {
  try {
    // Store current active tab for later restoration
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (currentTab?.id && currentTab.id !== tabInfo.tabId) {
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
    console.error('[EchoType] Error activating ChatGPT tab:', error);
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
    console.warn('[EchoType] Could not return to previous tab:', error);
  } finally {
    state.previousTabId = null;
    state.previousWindowId = null;
  }
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
  timeoutMs = TAB_COMPLETE_TIMEOUT
): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      return true;
    }
  } catch (error) {
    console.warn('[EchoType] Failed to read tab status:', error);
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
    
    // Check if tab needs refresh (error page, stale, etc.)
    if (tab.url && !tab.url.startsWith('https://chatgpt.com')) {
      await chrome.tabs.update(tabId, { url: CHATGPT_URL });
      return await waitForTabComplete(tabId);
    }
    
    return true;
  } catch (error) {
    console.error('[EchoType] Failed to refresh tab:', error);
    return false;
  }
}

/**
 * Send a message to the ChatGPT tab with retry logic.
 *
 * @param message - Message to send
 * @param retries - Number of retries (default: MAX_RETRIES)
 * @returns Response from content script
 */
export async function sendToChatGPTTab<T>(
  message: unknown,
  retries = MAX_RETRIES
): Promise<T | null> {
  if (!state.chatgptTab) {
    console.error('[EchoType] No ChatGPT tab available');
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
        await delay(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        continue;
      }

      console.error('[EchoType] Error sending message to ChatGPT tab:', error);
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
});
