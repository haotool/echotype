/**
 * EchoType - Service Worker Heartbeat Tracker
 * @module background/heartbeat
 *
 * Implements a heartbeat mechanism to track Service Worker health and activity.
 * This complements the keep-alive alarm by providing visibility into SW state.
 *
 * Best Practice Reference:
 * @see https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers
 *
 * @updated 2026-01-08
 */

const HEARTBEAT_KEY = 'echotype-heartbeat';
const HEARTBEAT_INTERVAL_MS = 20 * 1000; // 20 seconds

interface HeartbeatData {
  timestamp: number;
  startedAt: number;
  heartbeatCount: number;
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatCount = 0;
let startedAt = Date.now();

/**
 * Run a single heartbeat - records current timestamp to storage.
 */
async function runHeartbeat(): Promise<void> {
  heartbeatCount++;
  const data: HeartbeatData = {
    timestamp: Date.now(),
    startedAt,
    heartbeatCount,
  };
  await chrome.storage.local.set({ [HEARTBEAT_KEY]: data });
}

/**
 * Start the heartbeat tracker.
 * Should be called once at Service Worker startup.
 */
export async function startHeartbeat(): Promise<void> {
  if (heartbeatInterval) {
    console.warn('[EchoType:Heartbeat] Already running');
    return;
  }

  startedAt = Date.now();
  heartbeatCount = 0;

  // Run immediately
  await runHeartbeat();
  console.log('[EchoType:Heartbeat] Started tracking');

  // Then every 20 seconds
  heartbeatInterval = setInterval(runHeartbeat, HEARTBEAT_INTERVAL_MS);
}

/**
 * Stop the heartbeat tracker.
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[EchoType:Heartbeat] Stopped tracking');
  }
}

/**
 * Get the last recorded heartbeat data.
 *
 * @returns Heartbeat data or undefined if never recorded
 */
export async function getLastHeartbeat(): Promise<HeartbeatData | undefined> {
  const result = await chrome.storage.local.get(HEARTBEAT_KEY);
  return result[HEARTBEAT_KEY];
}

/**
 * Check if the Service Worker is considered healthy.
 * Healthy = heartbeat recorded within the last 30 seconds.
 *
 * @returns True if healthy
 */
export async function isServiceWorkerHealthy(): Promise<boolean> {
  const data = await getLastHeartbeat();
  if (!data) return false;

  const elapsed = Date.now() - data.timestamp;
  return elapsed < 30 * 1000; // Within 30 seconds
}

/**
 * Get Service Worker uptime in milliseconds.
 *
 * @returns Uptime in ms, or 0 if not started
 */
export async function getUptime(): Promise<number> {
  const data = await getLastHeartbeat();
  if (!data) return 0;
  return Date.now() - data.startedAt;
}

/**
 * Get formatted uptime string (e.g., "5m 30s").
 */
export async function getFormattedUptime(): Promise<string> {
  const uptime = await getUptime();
  const seconds = Math.floor(uptime / 1000) % 60;
  const minutes = Math.floor(uptime / 60000) % 60;
  const hours = Math.floor(uptime / 3600000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
