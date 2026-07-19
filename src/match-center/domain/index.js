/**
 * Domain Layer Unified Exports
 */

export {
  MatchId,
  Participant,
  MapScore,
  CurrentScore,
} from './match/ValueObjects.js';

export {
  createEventEnvelope,
  DomainEvents,
} from './match/DomainEvents.js';

export {
  DomainCommand,
  CreateMatchCommand,
  AssignTeamsCommand,
  StartCheckInCommand,
  StartWarmupCommand,
  StartSideSelectionCommand,
  StartMapSelectionCommand,
  StartLiveCommand,
  PauseMatchCommand,
  ResumeMatchCommand,
  RecordRoundCommand,
  CompleteMapCommand,
  CompleteMatchCommand,
  CancelMatchCommand,
  RescheduleMatchCommand,
  AssignServerCommand,
  SwapSidesCommand,
  DeclareForfeitCommand,
  ApplyPenaltyCommand,
  RemovePenaltyCommand,
  ReopenMatchCommand,
  RestoreSnapshotCommand,
  ArchiveMatchCommand,
  OverrideScoreCommand,
  ReconnectProviderCommand,
  ReplayEventsCommand,
} from './match/DomainCommands.js';

export { MatchRepository } from './match/MatchRepository.js';
export { MatchState, MatchStateMachine } from './match/MatchState.js';
export { MatchAggregateRoot } from './match/MatchAggregateRoot.js';
export { OverrideResolver, LifecycleService } from './match/DomainServices.js';
