/**
 * Application Event Handlers and Projection Builders
 */
import { platformEventBus } from '../shared/kernel/EventBus.js';
import { DomainEvents } from '../domain/match/DomainEvents.js';
import { Logger } from '../shared/kernel/Logger.js';

export class ProjectionBuilder {
  constructor(summaryRepo, scoreboardRepo, timelineRepo) {
    this.summaryRepo = summaryRepo;
    this.scoreboardRepo = scoreboardRepo;
    this.timelineRepo = timelineRepo;
    this.unsubscribes = [];
  }

  /**
   * Registers event bus subscriptions.
   */
  registerSubscriptions() {
    Logger.info('Initializing ProjectionBuilder EventBus subscriptions.');

    this.unsubscribes.push(
      platformEventBus.subscribe(DomainEvents.MATCH_CREATED, (event) => this.handleMatchCreated(event))
    );
    this.unsubscribes.push(
      platformEventBus.subscribe('Match.TeamsAssigned', (event) => this.handleTeamsAssigned(event))
    );
    this.unsubscribes.push(
      platformEventBus.subscribe(DomainEvents.MATCH_STARTED, (event) => this.handleMatchStarted(event))
    );
    this.unsubscribes.push(
      platformEventBus.subscribe(DomainEvents.ROUND_COMPLETED, (event) => this.handleRoundCompleted(event))
    );
    this.unsubscribes.push(
      platformEventBus.subscribe(DomainEvents.MATCH_COMPLETED, (event) => this.handleMatchCompleted(event))
    );
  }

  unregister() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }

  async handleMatchCreated(event) {
    const { aggregateId, payload } = event;
    Logger.debug(`ProjectionBuilder: building summary for created match [${aggregateId}]`);
    await this.summaryRepo.save(aggregateId, {
      matchId: aggregateId,
      status: 'Scheduled',
      game: payload.game,
      format: payload.format,
      teamA: null,
      teamB: null,
      score: { teamAScore: 0, teamBScore: 0 },
      winnerId: null,
      lastEventSeq: event.aggregateVersion,
      correlationId: event.correlationId,
      updatedAt: event.occurredAt,
    });
  }

  async handleTeamsAssigned(event) {
    const { aggregateId, payload } = event;
    Logger.debug(`ProjectionBuilder: assigning teams for match [${aggregateId}]`);
    const current = await this.summaryRepo.findById(aggregateId);
    await this.summaryRepo.save(aggregateId, {
      ...current,
      teamA: payload.teamA,
      teamB: payload.teamB,
      lastEventSeq: event.aggregateVersion,
      correlationId: event.correlationId,
      updatedAt: event.occurredAt,
    });
  }

  async handleMatchStarted(event) {
    const { aggregateId } = event;
    Logger.debug(`ProjectionBuilder: updating state for started match [${aggregateId}]`);
    const current = await this.summaryRepo.findById(aggregateId);
    await this.summaryRepo.save(aggregateId, {
      ...current,
      status: 'Live',
      lastEventSeq: event.aggregateVersion,
      correlationId: event.correlationId,
      updatedAt: event.occurredAt,
    });
  }

  async handleRoundCompleted(event) {
    const { aggregateId, payload } = event;
    Logger.debug(`ProjectionBuilder: processing round completed event for match [${aggregateId}]`);
    
    // Update Scoreboard
    await this.scoreboardRepo.save(aggregateId, {
      score: payload.newMapScore,
      lastEventSeq: event.aggregateVersion,
      correlationId: event.correlationId,
      updatedAt: event.occurredAt,
    });

    // Append Timeline Event
    await this.timelineRepo.append(aggregateId, {
      eventId: event.eventId,
      eventType: 'RoundCompleted',
      occurredAt: event.occurredAt,
      correlationId: event.correlationId,
      details: payload,
    });
  }

  async handleMatchCompleted(event) {
    const { aggregateId, payload } = event;
    Logger.debug(`ProjectionBuilder: completing match [${aggregateId}]`);
    const current = await this.summaryRepo.findById(aggregateId);
    await this.summaryRepo.save(aggregateId, {
      ...current,
      status: 'Completed',
      winnerId: payload.winnerId,
      lastEventSeq: event.aggregateVersion,
      correlationId: event.correlationId,
      updatedAt: event.occurredAt,
    });
  }
}
