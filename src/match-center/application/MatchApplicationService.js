/**
 * Match Application Service (CQRS Command Handlers)
 */
import { Logger } from '../shared/kernel/Logger.js';
import { platformCommandDispatcher } from './CommandDispatcher.js';
import { MatchAggregateRoot } from '../domain/match/MatchAggregateRoot.js';
import { ConcurrencyConflictError, UnauthorizedOverrideError } from '../shared/kernel/Errors.js';
import { platformEventBus } from '../shared/kernel/EventBus.js';
import { platformSummaryRepo, platformScoreboardRepo } from '../infrastructure/SupabaseProjectionRepositories.js';

export class MatchApplicationService {
  constructor(matchRepository, unitOfWork) {
    this.repository = matchRepository;
    this.unitOfWork = unitOfWork;
  }

  /**
   * Registers application command handlers.
   */
  registerHandlers() {
    Logger.info('Registering command handlers on platformCommandDispatcher.');

    platformCommandDispatcher.register('CreateMatchCommand', (cmd) => this.handleCreateMatch(cmd));
    platformCommandDispatcher.register('AssignTeamsCommand', (cmd) => this.handleAssignTeams(cmd));
    platformCommandDispatcher.register('StartCheckInCommand', (cmd) => this.handleStartCheckIn(cmd));
    platformCommandDispatcher.register('StartWarmupCommand', (cmd) => this.handleStartWarmup(cmd));
    platformCommandDispatcher.register('StartSideSelectionCommand', (cmd) => this.handleStartSideSelection(cmd));
    platformCommandDispatcher.register('StartMapSelectionCommand', (cmd) => this.handleStartMapSelection(cmd));
    platformCommandDispatcher.register('StartLiveCommand', (cmd) => this.handleStartLive(cmd));
    platformCommandDispatcher.register('PauseMatchCommand', (cmd) => this.handlePauseMatch(cmd));
    platformCommandDispatcher.register('ResumeMatchCommand', (cmd) => this.handleResumeMatch(cmd));
    platformCommandDispatcher.register('RecordRoundCommand', (cmd) => this.handleRecordRound(cmd));
    platformCommandDispatcher.register('CompleteMapCommand', (cmd) => this.handleCompleteMap(cmd));
    platformCommandDispatcher.register('CompleteMatchCommand', (cmd) => this.handleCompleteMatch(cmd));
    platformCommandDispatcher.register('OverrideScoreCommand', (cmd) => this.handleOverrideScore(cmd));
    platformCommandDispatcher.register('ArchiveMatchCommand', (cmd) => this.handleArchiveMatch(cmd));
    platformCommandDispatcher.register('IngestProviderMatchCommand', (cmd) => this.handleIngestProviderMatch(cmd));
  }

  async handleCreateMatch(command) {
    const { matchId, game, format } = command.payload;
    const aggregate = new MatchAggregateRoot(matchId);
    aggregate.create(game, format);
    await this.save(aggregate, 0);
  }

  async handleAssignTeams(command) {
    const { matchId, teamA, teamB } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.assignTeams(teamA, teamB);
    await this.save(aggregate, command.expectedVersion);
  }

  async handleStartCheckIn(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.startCheckIn();
    await this.save(aggregate, command.expectedVersion);
  }

  async handleStartWarmup(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.startWarmup();
    await this.save(aggregate, command.expectedVersion);
  }

  async handleStartSideSelection(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.startSideSelection();
    await this.save(aggregate, command.expectedVersion);
  }

  async handleStartMapSelection(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.startMapSelection();
    await this.save(aggregate, command.expectedVersion);
  }

  async handleStartLive(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.startLive();
    await this.save(aggregate, command.expectedVersion);
  }

  async handlePauseMatch(command) {
    const { matchId, pauseType } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.pause(pauseType);
    await this.save(aggregate, command.expectedVersion);
  }

  async handleResumeMatch(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.resume();
    await this.save(aggregate, command.expectedVersion);
  }

  async handleRecordRound(command) {
    const { matchId, roundWinner } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.recordRound(roundWinner);
    await this.save(aggregate, command.expectedVersion);
  }

  async handleCompleteMap(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.completeMap();
    await this.save(aggregate, command.expectedVersion);
  }

  async handleCompleteMatch(command) {
    const { matchId, winnerId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.completeMatch(winnerId);
    await this.save(aggregate, command.expectedVersion);
  }

  async handleOverrideScore(command) {
    const { matchId, teamAScore, teamBScore, reason, actorRole } = command.payload;
    // Resource Guard and Role Check Invariant
    if (actorRole !== 'Admin' && actorRole !== 'SuperAdmin' && actorRole !== 'Referee') {
      throw new UnauthorizedOverrideError(`Insufficient permissions for role [${actorRole}] to apply manual score override.`);
    }

    const aggregate = await this.load(matchId);
    aggregate.overrideScore(teamAScore, teamBScore, reason);
    await this.save(aggregate, command.expectedVersion);
  }

  async handleArchiveMatch(command) {
    const { matchId } = command.payload;
    const aggregate = await this.load(matchId);
    aggregate.archive();
    await this.save(aggregate, command.expectedVersion);
  }

  // --- Helpers ---

  /**
   * Single atomic ingest from an external provider canonical DTO.
   * Creates, assigns, transitions lifecycle, applies scores — all in one aggregate + one save.
   * This avoids the fragile multi-hop version tracking of sequential commands.
   */
  async handleIngestProviderMatch(command) {
    const { matchId, canonical } = command.payload;
    const { game, format, status, teamA, teamB, scoreboard, winnerId } = canonical;

    // Build a fresh aggregate from scratch
    const aggregate = new MatchAggregateRoot(matchId);
    aggregate.create(game, format);
    aggregate.assignTeams(teamA, teamB);

    if (status === 'Live' || status === 'Completed') {
      aggregate.startCheckIn();
      aggregate.startWarmup();
      aggregate.startSideSelection();
      aggregate.startMapSelection();
      aggregate.startLive();
      aggregate.overrideScore(scoreboard.teamAScore, scoreboard.teamBScore, 'Provider sync import');

      if (status === 'Completed' && winnerId) {
        aggregate.completeMatch(winnerId);
      }
    } else {
      if (scoreboard.teamAScore > 0 || scoreboard.teamBScore > 0) {
        aggregate.overrideScore(scoreboard.teamAScore, scoreboard.teamBScore, 'Provider sync import');
      }
    }

    // Save aggregate events (triggers async event bus handlers via setTimeout)
    await this.save(aggregate, 0);

    // ⚡ Direct projection write — the event bus handlers run asynchronously (setTimeout 0)
    // so we cannot rely on them being done here. Build the full projection directly.
    await platformSummaryRepo.save(matchId, {
      matchId,
      status: status === 'Completed' ? 'Completed' : status === 'Live' ? 'Live' : 'Scheduled',
      game,
      format,
      teamA,
      teamB,
      score: { teamAScore: scoreboard.teamAScore, teamBScore: scoreboard.teamBScore },
      winnerId: canonical.winnerId,
      activeMap: canonical.activeMap,
      mapImageUrl: canonical.mapImageUrl,
      playerStats: canonical.playerStats,
      server: canonical.server,
      demoLinks: canonical.demoLinks,
      startedAt: canonical.startedAt,
      finishedAt: canonical.finishedAt,
      seriesScore: canonical.seriesScore,
      mapsStats: canonical.mapsStats || [],
      lastEventSeq: aggregate.version,
      updatedAt: new Date().toISOString(),
    });

    await platformScoreboardRepo.save(matchId, {
      score: { teamAScore: scoreboard.teamAScore, teamBScore: scoreboard.teamBScore },
      lastEventSeq: aggregate.version,
      updatedAt: new Date().toISOString(),
    });

    Logger.info(`IngestProviderMatch: Full projection written for ${matchId} (status: ${status})`);
  }

  async load(matchId) {
    return await this.repository.findById(matchId);
  }

  async save(aggregate, expectedVersion) {
    await this.unitOfWork.execute(async () => {
      if (expectedVersion !== null && aggregate.version - aggregate.uncommittedEvents.length !== expectedVersion) {
        throw new ConcurrencyConflictError(`Concurrency conflict detected. Expected version: ${expectedVersion}`);
      }

      // Persist changes using concrete infrastructure adapter (Phase 3+)
      await this.repository.save(aggregate, expectedVersion);

      // Publish all raised events to event bus
      const events = [...aggregate.uncommittedEvents];
      aggregate.clearUncommittedEvents();
      
      events.forEach(evt => platformEventBus.publish(evt));
    });
  }
}
