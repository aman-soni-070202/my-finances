// src/utils/logger.ts

/**
 * Log levels for application logging
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    NONE = 'NONE'
  }
  
  /**
   * Configuration interface for the logger
   */
  interface LoggerConfig {
    minLevel: LogLevel;
    enableConsole: boolean;
    enableRemoteLogging: boolean;
    timestampFormat: 'none' | 'iso' | 'locale';
  }
  
  /**
   * Default configuration for the logger
   */
  const DEFAULT_CONFIG: LoggerConfig = {
    minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableRemoteLogging: !__DEV__,
    timestampFormat: 'iso'
  };
  
  /**
   * Remote logging service interface
   */
  interface RemoteLoggingService {
    sendLog(level: LogLevel, message: string, data?: any): Promise<void>;
  }
  
  // Placeholder for a remote logging service (e.g., Firebase, Crashlytics)
  // This should be implemented separately
  let remoteLogger: RemoteLoggingService | null = null;
  
  /**
   * Current logger configuration
   */
  let config: LoggerConfig = { ...DEFAULT_CONFIG };
  
  /**
   * Gets the current timestamp formatted according to configuration
   */
  const getTimestamp = (): string => {
    switch (config.timestampFormat) {
      case 'none':
        return '';
      case 'iso':
        return new Date().toISOString();
      case 'locale':
        return new Date().toLocaleString();
      default:
        return new Date().toISOString();
    }
  };
  
  /**
   * Formats a log message with timestamp and additional data
   */
  const formatLogMessage = (level: LogLevel, message: string, data?: any): string => {
    const timestamp = config.timestampFormat !== 'none' ? `[${getTimestamp()}]` : '';
    const logData = data ? ` ${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp} [${level}] ${message}${logData}`;
  };
  
  /**
   * Determines if a log at the specified level should be processed
   */
  const shouldLog = (level: LogLevel): boolean => {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  };
  
  /**
   * Sends a log to the console if enabled
   */
  const consoleLog = (level: LogLevel, formattedMessage: string): void => {
    if (!config.enableConsole) return;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  };
  
  /**
   * Sends a log to the remote logging service if configured
   */
  const remoteLog = async (level: LogLevel, message: string, data?: any): Promise<void> => {
    if (!config.enableRemoteLogging || !remoteLogger) return;
    
    try {
      await remoteLogger.sendLog(level, message, data);
    } catch (error) {
      // Use console directly to avoid infinite loops
      console.error('Failed to send log to remote service:', error);
    }
  };
  
  /**
   * Core logging function
   */
  const log = async (level: LogLevel, message: string, ...data: any[]): Promise<void> => {
    if (!shouldLog(level)) return;
    
    const dataObj = data.length > 0 ? data.length === 1 ? data[0] : data : undefined;
    const formattedMessage = formatLogMessage(level, message, dataObj);
    
    // Send to console
    consoleLog(level, formattedMessage);
    
    // Send to remote logging service
    if (config.enableRemoteLogging) {
      await remoteLog(level, message, dataObj);
    }
  };
  
  /**
   * Logger utility for application-wide logging
   */
  export const Logger = {
    /**
     * Configure the logger
     */
    configure: (newConfig: Partial<LoggerConfig>): void => {
      config = { ...config, ...newConfig };
    },
    
    /**
     * Register a remote logging service
     */
    setRemoteLogger: (service: RemoteLoggingService): void => {
      remoteLogger = service;
    },
    
    /**
     * Log a debug message
     */
    debug: (message: string, ...data: any[]): void => {
      log(LogLevel.DEBUG, message, ...data);
    },
    
    /**
     * Log an info message
     */
    info: (message: string, ...data: any[]): void => {
      log(LogLevel.INFO, message, ...data);
    },
    
    /**
     * Log a warning message
     */
    warn: (message: string, ...data: any[]): void => {
      log(LogLevel.WARN, message, ...data);
    },
    
    /**
     * Log an error message
     */
    error: (message: string, ...data: any[]): void => {
      log(LogLevel.ERROR, message, ...data);
    },
    
    /**
     * Create a scoped logger that prefixes all messages with a scope name
     */
    createScopedLogger: (scope: string) => ({
      debug: (message: string, ...data: any[]): void => {
        log(LogLevel.DEBUG, `[${scope}] ${message}`, ...data);
      },
      info: (message: string, ...data: any[]): void => {
        log(LogLevel.INFO, `[${scope}] ${message}`, ...data);
      },
      warn: (message: string, ...data: any[]): void => {
        log(LogLevel.WARN, `[${scope}] ${message}`, ...data);
      },
      error: (message: string, ...data: any[]): void => {
        log(LogLevel.ERROR, `[${scope}] ${message}`, ...data);
      }
    })
  };
  
  // Usage example:
  // const componentLogger = Logger.createScopedLogger('ComponentName');
  // componentLogger.debug('Component initialized', { propA: 'value' });