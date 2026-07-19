/**
 * Platform Core Configuration System
 */
import { Logger } from './Logger.js';

export class Config {
  static defaults = {
    matchCenter: {
      enabled: true,
      beta: true,
      activationWindowHours: 12,
      allowManualOverride: true,
      defaultPollingIntervalMs: 5000,
    },
    eventStore: {
      snapshot: {
        strategy: 'hybrid', // hybrid, volume, time, manual
        everyEvents: 100,
        everyMinutes: 30,
        onCompleted: true,
      },
      retentionDays: 90,
    },
    observability: {
      logLevel: 'INFO',
      enableSpans: true,
    },
  };

  static current = { ...Config.defaults };

  /**
   * Merges custom runtime configuration overrides.
   * @param {Object} customConfig
   */
  static load(customConfig = {}) {
    Config.current = Config.deepMerge(Config.defaults, customConfig);
    Logger.setLogLevel(Config.current.observability?.logLevel || 'INFO');
    Logger.info('Platform configuration loaded', { config: Config.current });
  }

  /**
   * Simple deep merge helper
   */
  static deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = Config.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  static get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = Config.current;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    return current;
  }
}
