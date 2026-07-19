/**
 * Platform Core Canonical Error Definitions
 */

export class MatchPlatformError extends Error {
  constructor({
    code = 'UNEXPECTED_ERROR',
    category = 'Unexpected',
    severity = 'Error',
    retryable = false,
    correlationId = null,
    message = 'An unexpected error occurred.',
    details = {},
  }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.retryable = retryable;
    this.correlationId = correlationId;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      code: this.code,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      correlationId: this.correlationId,
      message: this.message,
      details: this.details,
    };
  }
}

export class ConcurrencyConflictError extends MatchPlatformError {
  constructor(message = 'The aggregate state has mutated; concurrency conflict occurred.', details = {}) {
    super({
      code: 'CONCURRENCY_CONFLICT',
      category: 'Business Rule',
      severity: 'Error',
      retryable: true,
      message,
      details,
    });
  }
}

export class ValidationFailureError extends MatchPlatformError {
  constructor(message = 'Schema validation failed.', details = {}) {
    super({
      code: 'VALIDATION_FAILURE',
      category: 'Validation',
      severity: 'Error',
      retryable: false,
      message,
      details,
    });
  }
}

export class ProviderUnavailableError extends MatchPlatformError {
  constructor(message = 'The external statistics provider is currently unavailable.', details = {}) {
    super({
      code: 'PROVIDER_UNAVAILABLE',
      category: 'Provider',
      severity: 'Warning',
      retryable: true,
      message,
      details,
    });
  }
}

export class ProjectionOutdatedError extends MatchPlatformError {
  constructor(message = 'The read-model projection lags too far behind the Event Store.', details = {}) {
    super({
      code: 'PROJECTION_OUTDATED',
      category: 'Infrastructure',
      severity: 'Warning',
      retryable: true,
      message,
      details,
    });
  }
}

export class UnauthorizedOverrideError extends MatchPlatformError {
  constructor(message = 'Action rejected: insufficient permissions to override score or state.', details = {}) {
    super({
      code: 'UNAUTHORIZED_OVERRIDE',
      category: 'Security',
      severity: 'Critical',
      retryable: false,
      message,
      details,
    });
  }
}

export class MatchAlreadyCompletedError extends MatchPlatformError {
  constructor(message = 'The match has already completed or archived and is immutable.', details = {}) {
    super({
      code: 'MATCH_ALREADY_COMPLETED',
      category: 'Business Rule',
      severity: 'Error',
      retryable: false,
      message,
      details,
    });
  }
}

export class DuplicateEventError extends MatchPlatformError {
  constructor(message = 'A duplicate event webhook hash has been detected.', details = {}) {
    super({
      code: 'DUPLICATE_EVENT',
      category: 'Infrastructure',
      severity: 'Info',
      retryable: false,
      message,
      details,
    });
  }
}

export class InvalidTransitionError extends MatchPlatformError {
  constructor(message = 'Requested match state transition is forbidden.', details = {}) {
    super({
      code: 'INVALID_TRANSITION',
      category: 'Business Rule',
      severity: 'Error',
      retryable: false,
      message,
      details,
    });
  }
}

export class SnapshotFailureError extends MatchPlatformError {
  constructor(message = 'Failed to write aggregate snapshot to storage.', details = {}) {
    super({
      code: 'SNAPSHOT_FAILURE',
      category: 'Infrastructure',
      severity: 'Error',
      retryable: true,
      message,
      details,
    });
  }
}
