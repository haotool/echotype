/**
 * EchoType - Reliable Messaging Module
 * @module background/messaging
 * 
 * Provides reliable message passing with retry logic and error handling.
 * Addresses Chrome Extension MV3 Service Worker lifecycle challenges.
 * 
 * @version 1.0.0
 * @updated 2026-01-10
 */

// ============================================================================
// Types
// ============================================================================

export interface MessageOptions {
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 500) */
  retryDelay?: number;
  /** Timeout for each attempt in ms (default: 5000) */
  timeout?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
}

export interface MessageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<MessageOptions> = {
  maxRetries: 3,
  retryDelay: 500,
  timeout: 5000,
  exponentialBackoff: true,
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a promise that rejects after a timeout.
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Message timeout')), ms);
  });
}

/**
 * Wait for a specified duration.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with optional exponential backoff.
 */
function calculateDelay(
  baseDelay: number,
  attempt: number,
  useExponential: boolean
): number {
  if (useExponential) {
    return baseDelay * Math.pow(2, attempt);
  }
  return baseDelay;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Send a message to a tab with retry logic.
 * 
 * @param tabId - Target tab ID
 * @param message - Message to send
 * @param options - Retry options
 * @returns Message result with success status and data
 */
export async function sendToTabReliable<T>(
  tabId: number,
  message: unknown,
  options: MessageOptions = {}
): Promise<MessageResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError = '';
  
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      const response = await Promise.race([
        chrome.tabs.sendMessage(tabId, message) as Promise<T>,
        createTimeout(opts.timeout),
      ]);
      
      return {
        success: true,
        data: response,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(
        `[EchoType:Messaging] Attempt ${attempt + 1}/${opts.maxRetries} failed:`,
        lastError
      );
      
      // Don't retry on certain errors
      if (lastError.includes('Extension context invalidated')) {
        break;
      }
      
      // Wait before retry (unless last attempt)
      if (attempt < opts.maxRetries - 1) {
        const waitTime = calculateDelay(
          opts.retryDelay,
          attempt,
          opts.exponentialBackoff
        );
        await delay(waitTime);
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: opts.maxRetries,
  };
}

/**
 * Send a message to the runtime (popup, options, etc.) with error handling.
 * This is a fire-and-forget operation - errors are logged but not thrown.
 * 
 * @param message - Message to send
 */
export async function broadcastToRuntime(message: unknown): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    // Expected errors:
    // - "Could not establish connection. Receiving end does not exist."
    //   (popup not open, options page closed)
    // - "Extension context invalidated"
    //   (extension reloaded/updated)
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!errorMsg.includes('Receiving end does not exist')) {
      console.warn('[EchoType:Messaging] Broadcast failed:', errorMsg);
    }
  }
}

/**
 * Send a message to all tabs matching a URL pattern.
 * 
 * @param urlPattern - URL pattern to match (e.g., 'https://chatgpt.com/*')
 * @param message - Message to send
 * @param options - Retry options
 * @returns Array of results for each tab
 */
export async function broadcastToTabs<T>(
  urlPattern: string,
  message: unknown,
  options: MessageOptions = {}
): Promise<Array<{ tabId: number; result: MessageResult<T> }>> {
  const tabs = await chrome.tabs.query({ url: urlPattern });
  const results: Array<{ tabId: number; result: MessageResult<T> }> = [];
  
  for (const tab of tabs) {
    if (tab.id) {
      const result = await sendToTabReliable<T>(tab.id, message, options);
      results.push({ tabId: tab.id, result });
    }
  }
  
  return results;
}

/**
 * Check if a tab is ready to receive messages.
 * 
 * @param tabId - Tab ID to check
 * @returns True if tab is ready
 */
export async function isTabReady(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.status === 'complete';
  } catch {
    return false;
  }
}

/**
 * Wait for a tab to be ready (status = 'complete').
 * 
 * @param tabId - Tab ID to wait for
 * @param timeoutMs - Maximum wait time in ms (default: 10000)
 * @returns True if tab became ready, false if timeout
 */
export async function waitForTabReady(
  tabId: number,
  timeoutMs = 10000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await isTabReady(tabId)) {
      return true;
    }
    await delay(100);
  }
  
  return false;
}

// ============================================================================
// Status Notification Helpers
// ============================================================================

/**
 * Notify all interested parties of a status change.
 * Sends to both runtime (popup) and content scripts.
 * 
 * @param status - New status
 * @param statusMessage - Full status message object
 */
export async function notifyStatusChange(
  statusMessage: unknown
): Promise<void> {
  // Notify popup/options (fire-and-forget)
  await broadcastToRuntime(statusMessage);
  
  // Could also notify content scripts if needed
  // await broadcastToTabs('https://chatgpt.com/*', statusMessage);
}

/**
 * Create a message sender with pre-configured options.
 * 
 * @param defaultOptions - Default options for all messages
 * @returns Configured sender functions
 */
export function createMessageSender(defaultOptions: MessageOptions = {}) {
  return {
    sendToTab: <T>(tabId: number, message: unknown, options?: MessageOptions) =>
      sendToTabReliable<T>(tabId, message, { ...defaultOptions, ...options }),
    
    broadcast: (message: unknown) => broadcastToRuntime(message),
    
    broadcastToTabs: <T>(
      urlPattern: string,
      message: unknown,
      options?: MessageOptions
    ) => broadcastToTabs<T>(urlPattern, message, { ...defaultOptions, ...options }),
  };
}
