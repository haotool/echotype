/**
 * EchoType - Offscreen Document Bridge
 * @module background/offscreen-bridge
 *
 * Manages the offscreen document for clipboard operations.
 * MV3 Service Workers don't have DOM access, so we use
 * Offscreen API for clipboard write operations.
 */

import { MSG } from '@shared/protocol';
import type { OffscreenClipboardResultPayload } from '@shared/protocol';
import { PATHS } from '@shared/constants';
import { CONFIG } from '@shared/config';
import { logger } from '@shared/logger';

// ============================================================================
// Configuration
// ============================================================================

const OFFSCREEN_DOCUMENT_PATH = PATHS.OFFSCREEN_DOCUMENT;
const OFFSCREEN_REASON = 'CLIPBOARD' as chrome.offscreen.Reason;
const OFFSCREEN_JUSTIFICATION = 'Write dictation result to clipboard';

// ============================================================================
// State
// ============================================================================

let creatingOffscreen: Promise<void> | null = null;

// ============================================================================
// Offscreen Document Management
// ============================================================================

/**
 * Check if offscreen document exists.
 *
 * @returns True if document exists
 */
async function hasOffscreenDocument(): Promise<boolean> {
  // Chrome 116+ has getContexts API
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
    });
    return contexts.length > 0;
  }

  // Fallback for older Chrome versions
  try {
    // Try to send a ping message to check if document exists
    await chrome.runtime.sendMessage({ type: 'PING' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure offscreen document is created.
 * Handles concurrent creation requests.
 */
async function ensureOffscreenDocument(): Promise<void> {
  // Already creating
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  // Check if already exists
  if (await hasOffscreenDocument()) {
    return;
  }

  // Create new document
  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [OFFSCREEN_REASON],
    justification: OFFSCREEN_JUSTIFICATION,
  });

  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

// ============================================================================
// Clipboard Operations
// ============================================================================

/**
 * Write text to clipboard via offscreen document.
 *
 * @param text - Text to write to clipboard
 * @returns Success status
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  if (!text) {
    logger.warn(' Clipboard write skipped: empty text');
    return false;
  }

  try {
    // Ensure offscreen document exists
    await ensureOffscreenDocument();
    logger.log(' Offscreen document ready, sending clipboard request');

    // Send message to offscreen document with timeout
    const response = await Promise.race([
      chrome.runtime.sendMessage({
        type: MSG.OFFSCREEN_CLIPBOARD_WRITE,
        text,
        target: 'offscreen',
      }),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Clipboard operation timeout')), CONFIG.OFFSCREEN.CLIPBOARD_TIMEOUT_MS)
      ),
    ]);

    const result = response as OffscreenClipboardResultPayload | undefined;
    
    if (result?.success) {
      logger.log(' Clipboard write successful');
      return true;
    } else {
      logger.warn(' Clipboard write failed:', result?.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(' Clipboard write error:', errorMessage);
    
    // If offscreen document failed, try to recreate it
    if (errorMessage.includes('Receiving end does not exist')) {
      logger.log(' Attempting to recreate offscreen document...');
      try {
        await chrome.offscreen.closeDocument().catch(() => {});
        creatingOffscreen = null;
        await ensureOffscreenDocument();
        
        // Retry once
        const retryResponse = await chrome.runtime.sendMessage({
          type: MSG.OFFSCREEN_CLIPBOARD_WRITE,
          text,
          target: 'offscreen',
        });
        
        const retryResult = retryResponse as OffscreenClipboardResultPayload | undefined;
        return retryResult?.success ?? false;
      } catch (retryError) {
        logger.error(' Clipboard retry failed:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Close the offscreen document if open.
 * Call this when the extension is idle to save resources.
 */
export async function closeOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) {
    try {
      await chrome.offscreen.closeDocument();
    } catch {
      // Ignore close errors
    }
  }
}
