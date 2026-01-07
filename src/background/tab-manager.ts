/**
 * EchoType - ChatGPT Tab Manager
 * @module background/tab-manager
 *
 * Manages the ChatGPT tab for dictation operations.
 * Handles tab creation, focus, and lifecycle.
 */

import type { ChatGPTTabInfo } from '@shared/types';

// ============================================================================
// Configuration
// ============================================================================

const CHATGPT_URL = 'https://chatgpt.com/?temporary-chat=true';
const CHATGPT_PATTERN = 'https://chatgpt.com/*';

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
 *
 * @param makeActive - Whether to make the tab active
 * @returns ChatGPT tab info
 */
export async function ensureChatGPTTab(
  makeActive = true
): Promise<ChatGPTTabInfo | null> {
  // Try to find existing tab
  let tabInfo = await findChatGPTTab();

  // Create if not found
  if (!tabInfo) {
    tabInfo = await createChatGPTTab(makeActive);
  } else if (makeActive) {
    // Activate existing tab
    await activateChatGPTTab(tabInfo);
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
 * Send a message to the ChatGPT tab.
 *
 * @param message - Message to send
 * @returns Response from content script
 */
export async function sendToChatGPTTab<T>(message: unknown): Promise<T | null> {
  if (!state.chatgptTab) {
    console.error('[EchoType] No ChatGPT tab available');
    return null;
  }

  try {
    const response = await chrome.tabs.sendMessage(
      state.chatgptTab.tabId,
      message
    );
    return response as T;
  } catch (error) {
    console.error('[EchoType] Error sending message to ChatGPT tab:', error);
    return null;
  }
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
