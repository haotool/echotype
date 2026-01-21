/**
 * EchoType - Service Worker Keep-alive
 * @module background/keepalive
 *
 * Prevents Chrome from terminating the service worker during idle periods.
 * Uses Chrome Alarms API to periodically wake up the service worker.
 *
 * @see https://developer.chrome.com/docs/extensions/mv3/service_workers/service-worker-lifecycle/
 */

import { ALARM_NAMES } from '@shared/constants';
import { CONFIG } from '@shared/config';
import { logger } from '@shared/logger';

// ============================================================================
// Keep-alive Functions
// ============================================================================

/**
 * Initialize the keep-alive mechanism.
 * Should be called when the service worker starts.
 */
export async function initKeepAlive(): Promise<void> {
  // Clear any existing alarm
  await chrome.alarms.clear(ALARM_NAMES.KEEPALIVE);

  // Create a new periodic alarm
  chrome.alarms.create(ALARM_NAMES.KEEPALIVE, {
    periodInMinutes: CONFIG.KEEPALIVE.PERIOD_MINUTES,
  });

  // Register alarm listener
  chrome.alarms.onAlarm.addListener(handleAlarm);

  logger.log('Keep-alive initialized');
}

/**
 * Stop the keep-alive mechanism.
 * Should be called during cleanup if needed.
 */
export async function stopKeepAlive(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAMES.KEEPALIVE);
  chrome.alarms.onAlarm.removeListener(handleAlarm);

  logger.log('Keep-alive stopped');
}

/**
 * Handle the keep-alive alarm.
 * Simply logs activity - the alarm itself keeps the SW alive.
 */
function handleAlarm(alarm: chrome.alarms.Alarm): void {
  if (alarm.name !== ALARM_NAMES.KEEPALIVE) return;

  logger.debug('Keep-alive ping at', new Date().toISOString());

  // The alarm itself keeps the service worker alive
  // No additional action needed
}

// ============================================================================
// Auto-initialization
// ============================================================================

// Initialize keep-alive when module loads
initKeepAlive().catch((error) => {
  logger.error('Failed to initialize keep-alive:', error);
});
