/**
 * Platform Core Logging Helper
 */
export class Logger {
  static levels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  static currentLevel = Logger.levels.INFO;

  static setLogLevel(levelName) {
    const cleanLevel = levelName ? levelName.toUpperCase() : 'INFO';
    if (cleanLevel in Logger.levels) {
      Logger.currentLevel = Logger.levels[cleanLevel];
    }
  }

  static formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const correlationId = context.correlationId ? ` [CorrelationId: ${context.correlationId}]` : '';
    const extraContext = Object.keys(context).length > 1 || (context.correlationId && Object.keys(context).length > 1)
      ? ` | context: ${JSON.stringify(context)}`
      : '';
    return `[${timestamp}] [${level}]${correlationId}: ${message}${extraContext}`;
  }

  static debug(message, context = {}) {
    if (Logger.currentLevel <= Logger.levels.DEBUG) {
      console.debug(Logger.formatMessage('DEBUG', message, context));
    }
  }

  static info(message, context = {}) {
    if (Logger.currentLevel <= Logger.levels.INFO) {
      console.info(Logger.formatMessage('INFO', message, context));
    }
  }

  static warn(message, context = {}) {
    if (Logger.currentLevel <= Logger.levels.WARN) {
      console.warn(Logger.formatMessage('WARN', message, context));
    }
  }

  static error(message, context = {}) {
    if (Logger.currentLevel <= Logger.levels.ERROR) {
      console.error(Logger.formatMessage('ERROR', message, context));
    }
  }
}
