/**
 * EchoType - Unified Logging System
 * @module shared/logger
 *
 * Centralized logging with DEBUG flag control.
 * In production builds, non-error logs are suppressed for performance.
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Debug flag - controls whether non-error logs are output.
 * Determined at build time via Vite's define plugin.
 */
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Log prefix for easy filtering in browser console.
 */
const PREFIX = '[EchoType]';

// ============================================================================
// Logger Interface
// ============================================================================

/**
 * Logger type for creating scoped loggers.
 */
export interface Logger {
  /** Standard log - only in development */
  log: (...args: unknown[]) => void;
  /** Warning log - only in development */
  warn: (...args: unknown[]) => void;
  /** Error log - always outputs */
  error: (...args: unknown[]) => void;
  /** Debug log - only in development */
  debug: (...args: unknown[]) => void;
  /** Info log - only in development */
  info: (...args: unknown[]) => void;
}

// ============================================================================
// Main Logger
// ============================================================================

/**
 * Main logger instance.
 * Use this for general logging throughout the extension.
 *
 * @example
 * import { logger } from '@shared/logger';
 *
 * logger.log('Service worker started');
 * logger.error('Failed to connect:', error);
 */
export const logger: Logger = {
  /**
   * Standard log output.
   * Only outputs in development builds.
   */
  log: (...args: unknown[]): void => {
    if (DEBUG) {
      console.log(PREFIX, ...args);
    }
  },

  /**
   * Warning log output.
   * Only outputs in development builds.
   */
  warn: (...args: unknown[]): void => {
    if (DEBUG) {
      console.warn(PREFIX, ...args);
    }
  },

  /**
   * Error log output.
   * Always outputs regardless of build type.
   * Errors should always be visible for debugging production issues.
   */
  error: (...args: unknown[]): void => {
    console.error(PREFIX, ...args);
  },

  /**
   * Debug log output.
   * Only outputs in development builds.
   * Use for verbose debugging information.
   */
  debug: (...args: unknown[]): void => {
    if (DEBUG) {
      console.debug(PREFIX, ...args);
    }
  },

  /**
   * Info log output.
   * Only outputs in development builds.
   */
  info: (...args: unknown[]): void => {
    if (DEBUG) {
      console.info(PREFIX, ...args);
    }
  },
};

// ============================================================================
// Scoped Logger Factory
// ============================================================================

/**
 * Create a scoped logger with a custom prefix.
 * Useful for module-specific logging.
 *
 * @param scope - The scope name (e.g., 'Controller', 'TabManager')
 * @returns A logger instance with the scope prefix
 *
 * @example
 * const log = createLogger('Controller');
 * log.log('Starting dictation'); // [EchoType:Controller] Starting dictation
 */
export function createLogger(scope: string): Logger {
  const scopedPrefix = `${PREFIX}:${scope}]`.replace(']', '');

  return {
    log: (...args: unknown[]): void => {
      if (DEBUG) {
        console.log(`${scopedPrefix}]`, ...args);
      }
    },
    warn: (...args: unknown[]): void => {
      if (DEBUG) {
        console.warn(`${scopedPrefix}]`, ...args);
      }
    },
    error: (...args: unknown[]): void => {
      console.error(`${scopedPrefix}]`, ...args);
    },
    debug: (...args: unknown[]): void => {
      if (DEBUG) {
        console.debug(`${scopedPrefix}]`, ...args);
      }
    },
    info: (...args: unknown[]): void => {
      if (DEBUG) {
        console.info(`${scopedPrefix}]`, ...args);
      }
    },
  };
}

// ============================================================================
// Debug Mode Check
// ============================================================================

/**
 * Check if debug mode is enabled.
 * Useful for conditional debug-only code blocks.
 *
 * @returns true if in development mode
 *
 * @example
 * if (isDebugMode()) {
 *   // Expose debug API
 *   window.__DEBUG__ = { ... };
 * }
 */
export function isDebugMode(): boolean {
  return DEBUG;
}
