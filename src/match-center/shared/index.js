/**
 * Shared Kernel Unified Exports
 */

export { Logger } from './kernel/Logger.js';
export {
  MatchPlatformError,
  ConcurrencyConflictError,
  ValidationFailureError,
  ProviderUnavailableError,
  ProjectionOutdatedError,
  UnauthorizedOverrideError,
  MatchAlreadyCompletedError,
  DuplicateEventError,
  InvalidTransitionError,
  SnapshotFailureError,
} from './kernel/Errors.js';
export { FeatureFlags } from './kernel/FeatureFlags.js';
export { EventBus, platformEventBus } from './kernel/EventBus.js';
export { Config } from './kernel/Config.js';
export { HealthState, HealthTracker, platformHealthTracker } from './kernel/Health.js';
