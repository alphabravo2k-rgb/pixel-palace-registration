/**
 * Platform Core In-Memory Domain Event Bus
 */
import { Logger } from './Logger.js';

export class EventBus {
  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Register a subscriber callback for a specific event type.
   * @param {string} eventType e.g., 'Match.Created' or '*' for all events
   * @param {Function} handler Callback receives (eventEnvelope)
   * @returns {Function} Unsubscribe trigger
   */
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(handler);

    Logger.debug(`EventBus subscriber registered for type: ${eventType}`);

    return () => {
      const handlers = this.subscribers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
      Logger.debug(`EventBus subscriber unregistered for type: ${eventType}`);
    };
  }

  /**
   * Publishes an event envelope, validating the schema contract and dispatching to subscribers.
   * @param {Object} envelope The canonical event envelope DTO
   */
  publish(envelope) {
    this.validateEnvelope(envelope);
    const eventType = envelope.eventType;

    Logger.info(`Publishing event: ${eventType}`, {
      eventId: envelope.eventId,
      aggregateId: envelope.aggregateId,
      correlationId: envelope.correlationId,
    });

    const handlers = this.subscribers.get(eventType) || new Set();
    const globalHandlers = this.subscribers.get('*') || new Set();

    const allHandlers = new Set([...handlers, ...globalHandlers]);

    for (const handler of allHandlers) {
      try {
        // Execute asynchronously to decouple handler execution from publisher stack
        setTimeout(() => {
          try {
            handler(envelope);
          } catch (handlerErr) {
            Logger.error(`Error in event handler for type ${eventType}: ${handlerErr.message}`, {
              error: handlerErr,
              envelope,
            });
          }
        }, 0);
      } catch (dispatchErr) {
        Logger.error(`Event dispatch failed: ${dispatchErr.message}`, { error: dispatchErr });
      }
    }
  }

  /**
   * Asserts envelope satisfies the canonical schema version.
   * @param {Object} envelope
   */
  validateEnvelope(envelope) {
    const required = [
      'eventId',
      'eventType',
      'eventVersion',
      'occurredAt',
      'aggregateId',
      'aggregateVersion',
      'schemaVersion',
      'correlationId',
      'payload',
    ];

    for (const key of required) {
      if (!(key in envelope)) {
        throw new Error(`Invalid event envelope schema: missing property [${key}]`);
      }
    }
  }
}

// Export single shared platform instance
export const platformEventBus = new EventBus();
