/**
 * Logger utility for Color Blindness Simulator
 * 
 * Provides a centralized logging system that can be disabled in production.
 * Only error and warn messages are logged in production builds.
 */

const IS_DEV = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Create a logger instance with optional prefix
 * @param prefix - Optional prefix for all log messages
 * @returns Logger instance
 */
export function createLogger(prefix?: string): Logger {
  const formatMessage = (_level: LogLevel, args: unknown[]): unknown[] => {
    if (prefix) {
      return [`[${prefix}]`, ...args];
    }
    return args;
  };

  return {
    /**
     * Log debug messages (development only)
     */
    debug: (...args: unknown[]) => {
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.debug(...formatMessage('debug', args));
      }
    },

    /**
     * Log info messages (development only)
     */
    info: (...args: unknown[]) => {
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.log(...formatMessage('info', args));
      }
    },

    /**
     * Log warning messages (always logged)
     */
    warn: (...args: unknown[]) => {
      console.warn(...formatMessage('warn', args));
    },

    /**
     * Log error messages (always logged)
     */
    error: (...args: unknown[]) => {
      console.error(...formatMessage('error', args));
    }
  };
}

// Default logger instance
export const logger = createLogger('ColorBlindSim');

export default logger;

