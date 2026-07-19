/**
 * Platform Core Feature Flag Registry
 */
import { Logger } from './Logger.js';

export class FeatureFlags {
  static defaultFlags = {
    matchCenterBeta: true,
    liveStats: false,
    timelines: false,
    playerStats: true,
    broadcasts: false,
    analytics: false,
    adminOverrides: true,
    feedbackWidget: true,
    mockProvider: true,
  };

  static flags = { ...FeatureFlags.defaultFlags };

  /**
   * Initializes or overrides the active feature flags.
   * @param {Object} flagOverrides
   */
  static initialize(flagOverrides = {}) {
    FeatureFlags.flags = {
      ...FeatureFlags.defaultFlags,
      ...flagOverrides,
    };
    Logger.info('Feature flags initialized', { flags: FeatureFlags.flags });
  }

  /**
   * Checks if a target feature flag is enabled.
   * @param {string} flagName
   * @returns {boolean}
   */
  static isEnabled(flagName) {
    if (flagName in FeatureFlags.flags) {
      return !!FeatureFlags.flags[flagName];
    }
    Logger.warn(`Feature flag request for unregistered key: ${flagName}`);
    return false;
  }

  /**
   * Dynamically toggles a flag at runtime (useful for admin overrides).
   * @param {string} flagName
   * @param {boolean} value
   */
  static toggle(flagName, value) {
    if (flagName in FeatureFlags.flags) {
      FeatureFlags.flags[flagName] = !!value;
      Logger.info(`Feature flag ${flagName} dynamically set to ${value}`);
    } else {
      Logger.warn(`Cannot toggle unregistered flag: ${flagName}`);
    }
  }
}
