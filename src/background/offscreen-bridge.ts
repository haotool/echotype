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

// ============================================================================
// Configuration
// ============================================================================

const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/index.html';
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
    console.warn('[EchoType] Clipboard write skipped: empty text');
    return false;
  }

  try {
    // Ensure offscreen document exists
    await ensureOffscreenDocument();
    console.log('[EchoType] Offscreen document ready, sending clipboard request');

    // Send message to offscreen document with timeout
    const response = await Promise.race([
      chrome.runtime.sendMessage({
        type: MSG.OFFSCREEN_CLIPBOARD_WRITE,
        text,
        target: 'offscreen',
      }),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Clipboard operation timeout')), 5000)
      ),
    ]);

    const result = response as OffscreenClipboardResultPayload | undefined;
    
    if (result?.success) {
      console.log('[EchoType] Clipboard write successful');
      return true;
    } else {
      console.warn('[EchoType] Clipboard write failed:', result?.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[EchoType] Clipboard write error:', errorMessage);
    
    // If offscreen document failed, try to recreate it
    if (errorMessage.includes('Receiving end does not exist')) {
      console.log('[EchoType] Attempting to recreate offscreen document...');
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
        console.error('[EchoType] Clipboard retry failed:', retryError);
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
