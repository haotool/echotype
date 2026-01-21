/**
 * EchoType - Centralized Configuration
 * @module shared/config
 *
 * Single source of truth for all configuration values and magic numbers.
 * Grouping related values makes them easier to find and tune.
 */

// ============================================================================
// Configuration Object
// ============================================================================

/**
 * Central configuration for all extension components.
 * Values are grouped by functional area.
 */
export const CONFIG = {
  /**
   * Tab management settings.
   * Controls retry behavior and timeouts for tab operations.
   */
  TAB: {
    /** Maximum retry attempts for tab operations */
    MAX_RETRIES: 5,
    /** Delay between retries in ms */
    RETRY_DELAY_MS: 300,
    /** Timeout for waiting for tab to complete loading (ms) */
    COMPLETE_TIMEOUT_MS: 10000,
    /** Threshold for considering a tab stale and needing refresh (5 minutes) */
    REFRESH_THRESHOLD_MS: 5 * 60 * 1000,
    /** Delay after new tab creation for DOM to be ready (ms) */
    NEW_TAB_READY_DELAY_MS: 500,
    /** Small delay after content script injection (ms) */
    POST_INJECTION_DELAY_MS: 300,
    /** Timeout for waiting for tab to load before start (ms) */
    START_WAIT_TIMEOUT_MS: 8000,
  },

  /**
   * Text capture settings.
   * Controls the polling and stability detection for capturing dictation results.
   */
  CAPTURE: {
    /** Polling interval for checking composer text (ms) */
    INTERVAL_MS: 80,
    /** Duration text must remain stable before capture (ms) */
    STABLE_MS: 520,
    /** Maximum time to wait for text capture (ms) */
    TIMEOUT_MS: 9000,
    /** Shorter timeout when change is not required (ms) */
    SHORT_TIMEOUT_MS: 3200,
    /** Timeout for waiting for composer change signal (ms) */
    CHANGE_SIGNAL_TIMEOUT_MS: 4500,
    /** Polling interval for status idle check (ms) */
    STATUS_IDLE_INTERVAL_MS: 80,
    /** Polling interval for composer change check (ms) */
    CHANGE_CHECK_INTERVAL_MS: 60,
  },

  /**
   * Processing and status tracking settings.
   */
  PROCESSING: {
    /** Maximum time to wait for processing to complete (ms) */
    COMPLETION_TIMEOUT_MS: 14000,
    /** Timeout for status check operations (ms) */
    STATUS_CHECK_TIMEOUT_MS: 2000,
    /** Timeout for waiting for expected status change (ms) */
    EXPECTED_STATUS_TIMEOUT_MS: 2000,
  },

  /**
   * Offscreen document settings.
   */
  OFFSCREEN: {
    /** Timeout for clipboard operations (ms) */
    CLIPBOARD_TIMEOUT_MS: 5000,
  },

  /**
   * Service worker keepalive settings.
   */
  KEEPALIVE: {
    /** Alarm period in minutes (just under 5 minutes to stay active) */
    PERIOD_MINUTES: 4.9,
  },

  /**
   * Heartbeat tracking settings.
   */
  HEARTBEAT: {
    /** Heartbeat interval (ms) */
    INTERVAL_MS: 20 * 1000,
    /** Maximum age for healthy heartbeat (ms) */
    HEALTHY_THRESHOLD_MS: 30 * 1000,
  },

  /**
   * Messaging and communication settings.
   */
  MESSAGING: {
    /** Default timeout for message operations (ms) */
    DEFAULT_TIMEOUT_MS: 5000,
    /** Extended timeout for long operations (ms) */
    LONG_TIMEOUT_MS: 10000,
    /** Default retry attempts */
    DEFAULT_RETRIES: 3,
    /** Default retry delay (ms) */
    DEFAULT_RETRY_DELAY_MS: 500,
  },

  /**
   * UI and display settings.
   */
  UI: {
    /** Duration for toast notifications (ms) */
    TOAST_DURATION_MS: 2000,
    /** Duration for success badge display (ms) */
    SUCCESS_BADGE_DURATION_MS: 2000,
    /** Duration for error badge display (ms) */
    ERROR_BADGE_DURATION_MS: 3000,
    /** Status observer throttle interval (ms) */
    STATUS_OBSERVER_THROTTLE_MS: 150,
  },

  /**
   * Audio feedback settings.
   */
  AUDIO: {
    /** Start sound - A4 note */
    START: { frequency: 440, duration: 150, type: 'sine' as OscillatorType },
    /** Success sound - A5 note */
    SUCCESS: { frequency: 880, duration: 200, type: 'sine' as OscillatorType },
    /** Error sound - A3 note */
    ERROR: { frequency: 220, duration: 300, type: 'square' as OscillatorType },
    /** Click sound */
    CLICK: { frequency: 1000, duration: 50, type: 'sine' as OscillatorType },
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type Config = typeof CONFIG;
