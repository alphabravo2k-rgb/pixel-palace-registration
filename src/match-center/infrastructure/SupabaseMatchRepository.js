/**
 * Concrete Match Repository Database Adapter
 */
import { MatchRepository } from '../domain/match/MatchRepository.js';
import { MatchAggregateRoot } from '../domain/match/MatchAggregateRoot.js';
import { platformEventStore } from './EventStore.js';
import { Config } from '../shared/kernel/Config.js';
import { Logger } from '../shared/kernel/Logger.js';

export class SupabaseMatchRepository extends MatchRepository {
  constructor(eventStore = platformEventStore) {
    super();
    this.store = eventStore;
  }

  /**
   * Reconstitutes the MatchAggregateRoot by playing events on top of its latest valid snapshot.
   * @param {MatchId} matchId
   * @returns {Promise<MatchAggregateRoot>}
   */
  async findById(matchId) {
    const idString = matchId.toString();
    const aggregate = new MatchAggregateRoot(idString);

    Logger.debug(`Repository: Loading aggregate root for match [${idString}]`);

    // 1. Attempt to load snapshot
    const snapshot = await this.store.loadSnapshot(idString);
    let startVersion = 0;

    if (snapshot) {
      Logger.debug(`Repository: Restoring snapshot for [${idString}] at version ${snapshot.version}`);
      aggregate.restoreSnapshot(snapshot.state);
      startVersion = snapshot.version;
    }

    // 2. Load events from the snapshot version forward
    const events = await this.store.getEvents(idString);
    const catchUpEvents = events.filter(evt => evt.aggregateVersion > startVersion);

    Logger.debug(`Repository: Replaying ${catchUpEvents.length} catch-up events for [${idString}]`);

    for (const event of catchUpEvents) {
      this.applyEvent(aggregate, event);
    }

    return aggregate;
  }

  /**
   * Commits all uncommitted aggregate events to the EventStore and checks for snapshots.
   * @param {MatchAggregateRoot} aggregateRoot
   * @param {number} expectedVersion
   */
  async save(aggregateRoot, expectedVersion) {
    const idString = aggregateRoot.id.toString();
    const uncommitted = aggregateRoot.uncommittedEvents;

    if (uncommitted.length === 0) {
      return;
    }

    Logger.debug(`Repository: Saving committed events for [${idString}] (expected version: ${expectedVersion})`);

    // Commits to EventStore stream
    await this.store.append(idString, uncommitted, expectedVersion);

    // 3. Write Snapshot trigger checks (volume-based / completion-based)
    const snapshotConfig = Config.get('eventStore.snapshot') || {};
    const currentVersion = aggregateRoot.version;

    const shouldSnapshot =
      (snapshotConfig.onCompleted && aggregateRoot.state === 'Completed') ||
      (snapshotConfig.everyEvents && currentVersion % snapshotConfig.everyEvents === 0);

    if (shouldSnapshot) {
      const stateSnapshot = {
        version: currentVersion,
        state: aggregateRoot.state,
        game: aggregateRoot.game,
        format: aggregateRoot.format,
        teamA: aggregateRoot.teamA ? { teamId: aggregateRoot.teamA.teamId, tag: aggregateRoot.teamA.tag, name: aggregateRoot.teamA.name } : null,
        teamB: aggregateRoot.teamB ? { teamId: aggregateRoot.teamB.teamId, tag: aggregateRoot.teamB.tag, name: aggregateRoot.teamB.name } : null,
        score: {
          seriesWinsA: aggregateRoot.score.seriesWinsA,
          seriesWinsB: aggregateRoot.score.seriesWinsB,
          currentMapScore: {
            teamAScore: aggregateRoot.score.currentMapScore.teamAScore,
            teamBScore: aggregateRoot.score.currentMapScore.teamBScore,
          },
        },
        activeMap: aggregateRoot.activeMap,
        winnerId: aggregateRoot.winnerId,
        serverAddress: aggregateRoot.serverAddress,
        scheduledAt: aggregateRoot.scheduledAt,
      };

      await this.store.saveSnapshot(idString, stateSnapshot, currentVersion);
    }
  }

  /**
   * Applies an event envelope state transition onto the local aggregate properties.
   */
  applyEvent(aggregate, envelope) {
    const { eventType, payload, aggregateVersion } = envelope;
    aggregate.version = aggregateVersion;

    switch (eventType) {
      case 'Match.Created':
        aggregate.game = payload.game;
        aggregate.format = payload.format;
        aggregate.state = 'Scheduled';
        break;
      case 'Match.TeamsAssigned':
        aggregate.teamA = payload.teamA;
        aggregate.teamB = payload.teamB;
        break;
      case 'Match.Started':
        aggregate.state = 'Live';
        break;
      case 'Match.RoundCompleted':
        aggregate.score.currentMapScore.teamAScore = payload.newMapScore.teamAScore;
        aggregate.score.currentMapScore.teamBScore = payload.newMapScore.teamBScore;
        break;
      case 'Match.MapCompleted':
        if (payload.mapWinner === 'teamA') {
          aggregate.score.seriesWinsA++;
        } else {
          aggregate.score.seriesWinsB++;
        }
        aggregate.score.currentMapScore.teamAScore = 0;
        aggregate.score.currentMapScore.teamBScore = 0;
        break;
      case 'Match.Completed':
        aggregate.state = 'Completed';
        aggregate.winnerId = payload.winnerId;
        break;
      case 'Match.Archived':
        aggregate.state = 'Archived';
        break;
      case 'Match.PauseRequested':
        aggregate.state = 'Paused';
        break;
      case 'Match.PauseEnded':
        aggregate.state = 'Live';
        break;
    }
  }
}

// Export single shared platform instance
export const platformMatchRepository = new SupabaseMatchRepository();
