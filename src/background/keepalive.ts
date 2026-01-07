/**
 * EchoType - Service Worker Keep-alive
 * @module background/keepalive
 *
 * Prevents Chrome from terminating the service worker during idle periods.
 * Uses Chrome Alarms API to periodically wake up the service worker.
 *
 * @see https://developer.chrome.com/docs/extensions/mv3/service_workers/service-worker-lifecycle/
 */

// ============================================================================
// Configuration
// ============================================================================

const ALARM_NAME = 'echotype-keepalive';
const ALARM_PERIOD_MINUTES = 4.9; // Just under 5 minutes to stay active

const DEBUG = process.env.NODE_ENV === 'development';

// ============================================================================
// Keep-alive Functions
// ============================================================================

/**
 * Initialize the keep-alive mechanism.
 * Should be called when the service worker starts.
 */
export async function initKeepAlive(): Promise<void> {
  // Clear any existing alarm
  await chrome.alarms.clear(ALARM_NAME);

  // Create a new periodic alarm
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: ALARM_PERIOD_MINUTES,
  });

  // Register alarm listener
  chrome.alarms.onAlarm.addListener(handleAlarm);

  if (DEBUG) {
    console.log('[EchoType] Keep-alive initialized');
  }
}

/**
 * Stop the keep-alive mechanism.
 * Should be called during cleanup if needed.
 */
export async function stopKeepAlive(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.onAlarm.removeListener(handleAlarm);

  if (DEBUG) {
    console.log('[EchoType] Keep-alive stopped');
  }
}

/**
 * Handle the keep-alive alarm.
 * Simply logs activity - the alarm itself keeps the SW alive.
 */
function handleAlarm(alarm: chrome.alarms.Alarm): void {
  if (alarm.name !== ALARM_NAME) return;

  if (DEBUG) {
    console.log('[EchoType] Keep-alive ping at', new Date().toISOString());
  }

  // The alarm itself keeps the service worker alive
  // No additional action needed
}

// ============================================================================
// Auto-initialization
// ============================================================================

// Initialize keep-alive when module loads
initKeepAlive().catch((error) => {
  console.error('[EchoType] Failed to initialize keep-alive:', error);
});
