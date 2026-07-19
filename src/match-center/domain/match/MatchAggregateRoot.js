/**
 * Match Aggregate Root
 */
import { MatchId, Participant, CurrentScore, MapScore } from './ValueObjects.js';
import { MatchState, MatchStateMachine } from './MatchState.js';
import { createEventEnvelope, DomainEvents } from './DomainEvents.js';
import { MatchAlreadyCompletedError, InvalidTransitionError } from '../../shared/kernel/Errors.js';

export class MatchAggregateRoot {
  constructor(matchId) {
    this.id = new MatchId(matchId);
    this.version = 0;
    this.state = MatchState.SCHEDULED;
    this.teamA = null;
    this.teamB = null;
    this.game = null;
    this.format = null;
    this.score = new CurrentScore(0, 0, new MapScore(0, 0));
    this.activeMap = null;
    this.winnerId = null;
    this.serverAddress = null;
    this.scheduledAt = null;
    this.penaltyPoints = new Map(); // teamId -> points
    this.uncommittedEvents = [];
  }

  /**
   * Helper to track and queue domain events
   */
  raiseEvent(eventType, payload = {}) {
    const envelope = createEventEnvelope({
      eventType,
      aggregateId: this.id.toString(),
      aggregateVersion: this.version + 1,
      payload,
    });
    this.uncommittedEvents.push(envelope);
    this.version++;
  }

  clearUncommittedEvents() {
    this.uncommittedEvents = [];
  }

  // --- Aggregate Command Handlers ---

  create(game, format) {
    if (this.version > 0) {
      throw new InvalidTransitionError('Match aggregate is already initialized.');
    }
    this.game = game;
    this.format = format;
    this.state = MatchState.SCHEDULED;
    this.raiseEvent(DomainEvents.MATCH_CREATED, { game, format });
  }

  assignTeams(teamA, teamB) {
    this.assertNotArchived();
    if (this.state !== MatchState.SCHEDULED && this.state !== MatchState.CHECK_IN) {
      throw new InvalidTransitionError('Team rosters can only be assigned in Scheduled or Check-In states.');
    }
    this.teamA = new Participant(teamA);
    this.teamB = new Participant(teamB);
    this.raiseEvent('Match.TeamsAssigned', {
      teamA: { teamId: this.teamA.teamId, name: this.teamA.name, tag: this.teamA.tag },
      teamB: { teamId: this.teamB.teamId, name: this.teamB.name, tag: this.teamB.tag },
    });
  }

  startCheckIn() {
    this.transitionTo(MatchState.CHECK_IN);
  }

  startWarmup() {
    this.transitionTo(MatchState.PREPARATION);
  }

  startSideSelection() {
    this.transitionTo(MatchState.SIDE_SELECTION);
  }

  startMapSelection() {
    this.transitionTo(MatchState.MAP_SELECTION);
  }

  startLive() {
    this.transitionTo(MatchState.LIVE);
    this.raiseEvent(DomainEvents.MATCH_STARTED, { activeMap: this.activeMap });
  }

  pause(pauseType) {
    this.transitionTo(MatchState.PAUSED);
    this.raiseEvent(DomainEvents.PAUSE_REQUESTED, { pauseType });
  }

  resume() {
    this.transitionTo(MatchState.LIVE);
    this.raiseEvent(DomainEvents.PAUSE_ENDED, {});
  }

  recordRound(roundWinner) {
    this.assertNotArchived();
    if (this.state !== MatchState.LIVE) {
      throw new InvalidTransitionError('Scores can only be recorded during Live matches.');
    }

    let mapScore = this.score.currentMapScore;
    if (roundWinner === 'teamA') {
      mapScore = mapScore.incrementTeamA();
    } else {
      mapScore = mapScore.incrementTeamB();
    }

    this.score = this.score.updateMapScore(mapScore);
    this.raiseEvent(DomainEvents.ROUND_COMPLETED, {
      roundWinner,
      newMapScore: { teamAScore: this.score.currentMapScore.teamAScore, teamBScore: this.score.currentMapScore.teamBScore },
    });
  }

  completeMap() {
    this.assertNotArchived();
    if (this.state !== MatchState.LIVE) {
      throw new InvalidTransitionError('Cannot complete a map if match is not active.');
    }

    const { teamAScore, teamBScore } = this.score.currentMapScore;
    let newScore = this.score;

    if (teamAScore > teamBScore) {
      newScore = this.score.incrementSeriesA();
      this.raiseEvent('Match.MapCompleted', { mapWinner: 'teamA', finalScore: { teamAScore, teamBScore } });
    } else if (teamBScore > teamAScore) {
      newScore = this.score.incrementSeriesB();
      this.raiseEvent('Match.MapCompleted', { mapWinner: 'teamB', finalScore: { teamAScore, teamBScore } });
    } else {
      throw new InvalidTransitionError('Cannot complete map with tie score.');
    }

    this.score = newScore;
  }

  completeMatch(winnerId) {
    if (winnerId !== this.teamA?.teamId && winnerId !== this.teamB?.teamId) {
      throw new InvalidTransitionError(`WinnerId [${winnerId}] must match an assigned participant team.`);
    }

    this.winnerId = winnerId;
    this.transitionTo(MatchState.COMPLETED, { winnerId });
    this.raiseEvent(DomainEvents.MATCH_COMPLETED, { winnerId });
  }

  cancel(reason) {
    this.transitionTo(MatchState.CANCELLED);
    this.raiseEvent('Match.Cancelled', { reason });
  }

  reschedule(scheduledAt) {
    this.assertNotArchived();
    this.scheduledAt = scheduledAt;
    this.raiseEvent('Match.Rescheduled', { scheduledAt });
  }

  assignServer(serverAddress) {
    this.assertNotArchived();
    this.serverAddress = serverAddress;
    this.raiseEvent('Match.ServerAssigned', { serverAddress });
  }

  swapSides() {
    this.assertNotArchived();
    const temp = this.teamA;
    this.teamA = this.teamB;
    this.teamB = temp;
    this.raiseEvent('Match.SidesSwapped', {});
  }

  declareForfeit(forfeitWinnerId) {
    this.completeMatch(forfeitWinnerId);
    this.raiseEvent('Match.Forfeited', { forfeitWinnerId });
  }

  applyPenalty(penaltyTeamId, penaltyPoints) {
    this.assertNotArchived();
    if (penaltyTeamId !== this.teamA?.teamId && penaltyTeamId !== this.teamB?.teamId) {
      throw new InvalidTransitionError(`Penalty teamId [${penaltyTeamId}] is not part of this match.`);
    }
    const currentPenalty = this.penaltyPoints.get(penaltyTeamId) || 0;
    this.penaltyPoints.set(penaltyTeamId, currentPenalty + penaltyPoints);
    this.raiseEvent('Match.PenaltyApplied', { penaltyTeamId, penaltyPoints });
  }

  removePenalty(penaltyTeamId) {
    this.assertNotArchived();
    if (this.penaltyPoints.has(penaltyTeamId)) {
      this.penaltyPoints.delete(penaltyTeamId);
      this.raiseEvent('Match.PenaltyRemoved', { penaltyTeamId });
    }
  }

  reopen() {
    this.transitionTo(MatchState.DISPUTED);
    this.raiseEvent('Match.Reopened', {});
  }

  restoreSnapshot(snapshot) {
    this.assertNotArchived();
    this.version = snapshot.version;
    this.state = snapshot.state;
    this.teamA = snapshot.teamA ? new Participant(snapshot.teamA) : null;
    this.teamB = snapshot.teamB ? new Participant(snapshot.teamB) : null;
    this.game = snapshot.game;
    this.format = snapshot.format;
    this.score = new CurrentScore(
      snapshot.score?.seriesWinsA || 0,
      snapshot.score?.seriesWinsB || 0,
      new MapScore(snapshot.score?.currentMapScore?.teamAScore || 0, snapshot.score?.currentMapScore?.teamBScore || 0)
    );
    this.activeMap = snapshot.activeMap;
    this.winnerId = snapshot.winnerId;
    this.serverAddress = snapshot.serverAddress;
    this.scheduledAt = snapshot.scheduledAt;
    this.raiseEvent('Match.SnapshotRestored', { restoredVersion: snapshot.version });
  }

  archive() {
    this.transitionTo(MatchState.ARCHIVED);
    this.raiseEvent(DomainEvents.MATCH_ARCHIVED, {});
  }

  overrideScore(teamAScore, teamBScore, reason) {
    this.assertNotArchived();
    const mapScore = new MapScore(teamAScore, teamBScore);
    this.score = this.score.updateMapScore(mapScore);
    this.raiseEvent(DomainEvents.ROUND_COMPLETED, {
      roundWinner: 'AdminOverride',
      newMapScore: { teamAScore, teamBScore },
      reason,
    });
  }

  // --- Helper Methods ---

  transitionTo(targetState, guardContext = {}) {
    this.assertNotArchived();
    const transitionContext = { winnerId: this.winnerId, ...guardContext };
    MatchStateMachine.validateTransition(this.state, targetState, transitionContext);
    this.state = targetState;
  }

  assertNotArchived() {
    if (this.state === MatchState.ARCHIVED) {
      throw new MatchAlreadyCompletedError('Match is archived and permanently immutable.');
    }
  }
}
