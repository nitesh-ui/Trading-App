/**
 * Debug Logger Utility
 * Provides conditional logging that can be disabled in production
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * logger.log('Message');
 * logger.error('Error');
 * logger.warn('Warning');
 */

// Check if we're in development mode
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

// Enable/disable logging globally
const LOGGING_ENABLED = false; // Set to false to disable all logs

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

// Emoji mapping for different log types
const LOG_EMOJIS = {
  [LogLevel.ERROR]: '❌',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.DEBUG]: '🔍',
  websocket: '🔌',
  api: '📡',
  data: '📊',
  success: '✅',
  loading: '🔄',
  cleanup: '🧹',
  trade: '💰',
  portfolio: '📈',
  notification: '🔔',
};

class Logger {
  private enabled: boolean;
  private isDev: boolean;

  constructor() {
    this.enabled = LOGGING_ENABLED;
    this.isDev = isDevelopment;
  }

  /**
   * Check if logging is enabled
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    if (!this.isDev && level === LogLevel.DEBUG) return false; // No debug logs in production
    return true;
  }

  /**
   * Format log message with timestamp and emoji
   */
  private formatMessage(emoji: string, ...args: any[]): any[] {
    const timestamp = new Date().toLocaleTimeString();
    return [`[${timestamp}] ${emoji}`, ...args];
  }

  /**
   * General log (INFO level)
   */
  log(...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(...this.formatMessage(LOG_EMOJIS[LogLevel.INFO], ...args));
    }
  }

  /**
   * Error log
   */
  error(...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(...this.formatMessage(LOG_EMOJIS[LogLevel.ERROR], ...args));
    }
  }

  /**
   * Warning log
   */
  warn(...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(...this.formatMessage(LOG_EMOJIS[LogLevel.WARN], ...args));
    }
  }

  /**
   * Debug log (only in development)
   */
  debug(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage(LOG_EMOJIS[LogLevel.DEBUG], ...args));
    }
  }

  /**
   * WebSocket log
   */
  websocket(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage(LOG_EMOJIS.websocket, '[WebSocket]', ...args));
    }
  }

  /**
   * API log
   */
  api(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage(LOG_EMOJIS.api, '[API]', ...args));
    }
  }

  /**
   * Data processing log
   */
  data(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage(LOG_EMOJIS.data, '[Data]', ...args));
    }
  }

  /**
   * Success log
   */
  success(...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(...this.formatMessage(LOG_EMOJIS.success, ...args));
    }
  }

  /**
   * Loading/processing log
   */
  loading(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage(LOG_EMOJIS.loading, ...args));
    }
  }

  /**
   * Cleanup log
   */
  cleanup(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage(LOG_EMOJIS.cleanup, '[Cleanup]', ...args));
    }
  }

  /**
   * Trade log
   */
  trade(...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(...this.formatMessage(LOG_EMOJIS.trade, '[Trade]', ...args));
    }
  }

  /**
   * Portfolio log
   */
  portfolio(...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(...this.formatMessage(LOG_EMOJIS.portfolio, '[Portfolio]', ...args));
    }
  }

  /**
   * Notification log
   */
  notification(...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(...this.formatMessage(LOG_EMOJIS.notification, '[Notification]', ...args));
    }
  }

  /**
   * Group logs together
   */
  group(label: string, fn: () => void): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }

  /**
   * Time a function execution
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  /**
   * End timing
   */
  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing/debugging
export default logger;
