/**
 * Platform Core Health Monitoring Framework
 */
import { Logger } from './Logger.js';

export const HealthState = {
  INITIALIZING: 'Initializing',
  CONNECTED: 'Connected',
  HEALTHY: 'Healthy',
  WARNING: 'Warning',
  DEGRADED: 'Degraded',
  RECOVERING: 'Recovering',
  MAINTENANCE: 'Maintenance',
  OFFLINE: 'Offline',
  UNKNOWN: 'Disabled/Unknown',
};

export class ComponentHealthStatus {
  constructor(name) {
    this.name = name;
    this.state = HealthState.INITIALIZING;
    this.lastChecked = new Date();
    this.details = {};
  }
}

export class HealthTracker {
  constructor() {
    this.components = new Map();
  }

  /**
   * Registers or updates a component's health state.
   * @param {string} name component name
   * @param {string} state one of HealthState
   * @param {Object} details diagnostic properties
   */
  updateHealth(name, state, details = {}) {
    const validStates = Object.values(HealthState);
    if (!validStates.includes(state)) {
      Logger.warn(`Attempted to set invalid health state [${state}] for component [${name}]`);
      return;
    }

    const previousStatus = this.components.get(name);
    const previousState = previousStatus ? previousStatus.state : null;

    const status = new ComponentHealthStatus(name);
    status.state = state;
    status.details = details;
    this.components.set(name, status);

    if (previousState !== state) {
      Logger.info(`Component health transition: [${name}] ${previousState || 'None'} ──> ${state}`, {
        details,
      });
    }
  }

  /**
   * Retrieves overall platform health indicator by selecting the most critical active state.
   * @returns {string}
   */
  getOverallHealth() {
    if (this.components.size === 0) {
      return HealthState.UNKNOWN;
    }

    const states = Array.from(this.components.values()).map(c => c.state);

    if (states.includes(HealthState.OFFLINE)) return HealthState.OFFLINE;
    if (states.includes(HealthState.DEGRADED)) return HealthState.DEGRADED;
    if (states.includes(HealthState.WARNING)) return HealthState.WARNING;
    if (states.includes(HealthState.RECOVERING)) return HealthState.RECOVERING;
    if (states.includes(HealthState.MAINTENANCE)) return HealthState.MAINTENANCE;
    if (states.includes(HealthState.INITIALIZING)) return HealthState.INITIALIZING;
    if (states.includes(HealthState.CONNECTED)) return HealthState.CONNECTED;
    if (states.includes(HealthState.HEALTHY)) return HealthState.HEALTHY;

    return HealthState.UNKNOWN;
  }

  getStatusReport() {
    return {
      status: this.getOverallHealth(),
      timestamp: new Date().toISOString(),
      components: Object.fromEntries(this.components),
    };
  }
}

// Export single shared platform instance
export const platformHealthTracker = new HealthTracker();
