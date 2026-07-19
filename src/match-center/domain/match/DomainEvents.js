/**
 * Canonical Event Envelope Factory and Events Catalogue
 */
import { ValidationFailureError } from '../../shared/kernel/Errors.js';

/**
 * Creates a versioned, schema-conforming Domain Event Envelope.
 */
export function createEventEnvelope({
  eventType,
  aggregateId,
  aggregateVersion,
  payload = {},
  correlationId = null,
  causationId = null,
  actor = 'System',
  source = 'MatchCenterDomain',
  eventVersion = '1.0.0',
  schemaVersion = '1.0.0',
}) {
  if (!eventType || typeof eventType !== 'string') {
    throw new ValidationFailureError('Event envelope requires an eventType string.');
  }
  if (!aggregateId || typeof aggregateId !== 'string') {
    throw new ValidationFailureError('Event envelope requires an aggregateId string.');
  }
  if (typeof aggregateVersion !== 'number' || aggregateVersion < 0) {
    throw new ValidationFailureError('Event envelope requires a non-negative aggregateVersion number.');
  }

  // Fallback to generate a simple client-side UUID if window.crypto is unavailable
  const generateUuid = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const envelope = {
    eventId: generateUuid(),
    eventType,
    eventVersion,
    occurredAt: new Date().toISOString(),
    aggregateId,
    aggregateVersion,
    schemaVersion,
    correlationId: correlationId || generateUuid(),
    causationId: causationId || null,
    actor,
    source,
    payload: Object.freeze({ ...payload }),
  };

  return Object.freeze(envelope);
}

// Canonical Event Namespaces
export const DomainEvents = {
  MATCH_CREATED: 'Match.Created',
  MATCH_STARTED: 'Match.Started',
  MAP_STARTED: 'Match.MapStarted',
  ROUND_COMPLETED: 'Match.RoundCompleted',
  PAUSE_REQUESTED: 'Match.PauseRequested',
  PAUSE_ENDED: 'Match.PauseEnded',
  PROVIDER_DISCONNECTED: 'Match.ProviderDisconnected',
  PROVIDER_RECOVERED: 'Match.ProviderRecovered',
  MATCH_COMPLETED: 'Match.Completed',
  MATCH_ARCHIVED: 'Match.Archived',
};
