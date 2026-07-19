/**
 * Domain Command Definitions
 */
import { ValidationFailureError } from '../../shared/kernel/Errors.js';

export class DomainCommand {
  constructor(type, payload = {}) {
    if (!type || typeof type !== 'string') {
      throw new ValidationFailureError('Command type must be a non-empty string.');
    }
    this.type = type;
    this.payload = Object.freeze({ ...payload });
    this.correlationId = payload.correlationId || null;
    this.expectedVersion = typeof payload.expectedVersion === 'number' ? payload.expectedVersion : null;
    Object.freeze(this);
  }
}

export class CreateMatchCommand extends DomainCommand {
  constructor(payload) {
    super('CreateMatchCommand', payload);
    const { matchId, game, format } = this.payload;
    if (!matchId) throw new ValidationFailureError('CreateMatchCommand requires a matchId.');
    if (!game) throw new ValidationFailureError('CreateMatchCommand requires a game.');
    if (!format) throw new ValidationFailureError('CreateMatchCommand requires a format.');
  }
}

export class AssignTeamsCommand extends DomainCommand {
  constructor(payload) {
    super('AssignTeamsCommand', payload);
    const { teamA, teamB } = this.payload;
    if (!teamA || !teamB) throw new ValidationFailureError('AssignTeamsCommand requires both teamA and teamB.');
  }
}

export class StartCheckInCommand extends DomainCommand {
  constructor(payload) {
    super('StartCheckInCommand', payload);
  }
}

export class StartWarmupCommand extends DomainCommand {
  constructor(payload) {
    super('StartWarmupCommand', payload);
  }
}

export class StartSideSelectionCommand extends DomainCommand {
  constructor(payload) {
    super('StartSideSelectionCommand', payload);
  }
}

export class StartMapSelectionCommand extends DomainCommand {
  constructor(payload) {
    super('StartMapSelectionCommand', payload);
  }
}

export class StartLiveCommand extends DomainCommand {
  constructor(payload) {
    super('StartLiveCommand', payload);
  }
}

export class PauseMatchCommand extends DomainCommand {
  constructor(payload) {
    super('PauseMatchCommand', payload);
    const { pauseType } = this.payload; // tactical or technical
    if (!pauseType) throw new ValidationFailureError('PauseMatchCommand requires a pauseType.');
  }
}

export class ResumeMatchCommand extends DomainCommand {
  constructor(payload) {
    super('ResumeMatchCommand', payload);
  }
}

export class RecordRoundCommand extends DomainCommand {
  constructor(payload) {
    super('RecordRoundCommand', payload);
    const { roundWinner } = this.payload; // 'teamA' or 'teamB'
    if (!roundWinner || (roundWinner !== 'teamA' && roundWinner !== 'teamB')) {
      throw new ValidationFailureError("RecordRoundCommand requires roundWinner to be 'teamA' or 'teamB'.");
    }
  }
}

export class CompleteMapCommand extends DomainCommand {
  constructor(payload) {
    super('CompleteMapCommand', payload);
  }
}

export class CompleteMatchCommand extends DomainCommand {
  constructor(payload) {
    super('CompleteMatchCommand', payload);
    const { winnerId } = this.payload;
    if (!winnerId) throw new ValidationFailureError('CompleteMatchCommand requires a winnerId.');
  }
}

export class CancelMatchCommand extends DomainCommand {
  constructor(payload) {
    super('CancelMatchCommand', payload);
    const { reason } = this.payload;
    if (!reason) throw new ValidationFailureError('CancelMatchCommand requires a reason.');
  }
}

export class RescheduleMatchCommand extends DomainCommand {
  constructor(payload) {
    super('RescheduleMatchCommand', payload);
    const { scheduledAt } = this.payload;
    if (!scheduledAt) throw new ValidationFailureError('RescheduleMatchCommand requires a scheduledAt timestamp.');
  }
}

export class AssignServerCommand extends DomainCommand {
  constructor(payload) {
    super('AssignServerCommand', payload);
    const { serverAddress } = this.payload;
    if (!serverAddress) throw new ValidationFailureError('AssignServerCommand requires a serverAddress.');
  }
}

export class SwapSidesCommand extends DomainCommand {
  constructor(payload) {
    super('SwapSidesCommand', payload);
  }
}

export class DeclareForfeitCommand extends DomainCommand {
  constructor(payload) {
    super('DeclareForfeitCommand', payload);
    const { forfeitWinnerId } = this.payload;
    if (!forfeitWinnerId) throw new ValidationFailureError('DeclareForfeitCommand requires forfeitWinnerId.');
  }
}

export class ApplyPenaltyCommand extends DomainCommand {
  constructor(payload) {
    super('ApplyPenaltyCommand', payload);
    const { penaltyTeamId, penaltyPoints } = this.payload;
    if (!penaltyTeamId) throw new ValidationFailureError('ApplyPenaltyCommand requires penaltyTeamId.');
    if (typeof penaltyPoints !== 'number' || penaltyPoints <= 0) {
      throw new ValidationFailureError('ApplyPenaltyCommand requires a positive penaltyPoints number.');
    }
  }
}

export class RemovePenaltyCommand extends DomainCommand {
  constructor(payload) {
    super('RemovePenaltyCommand', payload);
    const { penaltyTeamId } = this.payload;
    if (!penaltyTeamId) throw new ValidationFailureError('RemovePenaltyCommand requires penaltyTeamId.');
  }
}

export class ReopenMatchCommand extends DomainCommand {
  constructor(payload) {
    super('ReopenMatchCommand', payload);
  }
}

export class RestoreSnapshotCommand extends DomainCommand {
  constructor(payload) {
    super('RestoreSnapshotCommand', payload);
    const { targetVersion } = this.payload;
    if (typeof targetVersion !== 'number') {
      throw new ValidationFailureError('RestoreSnapshotCommand requires targetVersion.');
    }
  }
}

export class ArchiveMatchCommand extends DomainCommand {
  constructor(payload) {
    super('ArchiveMatchCommand', payload);
  }
}

export class OverrideScoreCommand extends DomainCommand {
  constructor(payload) {
    super('OverrideScoreCommand', payload);
    const { teamAScore, teamBScore, reason } = this.payload;
    if (typeof teamAScore !== 'number' || typeof teamBScore !== 'number') {
      throw new ValidationFailureError('OverrideScoreCommand requires teamAScore and teamBScore numbers.');
    }
    if (!reason) throw new ValidationFailureError('OverrideScoreCommand requires a reason.');
  }
}

export class ReconnectProviderCommand extends DomainCommand {
  constructor(payload) {
    super('ReconnectProviderCommand', payload);
  }
}

export class ReplayEventsCommand extends DomainCommand {
  constructor(payload) {
    super('ReplayEventsCommand', payload);
  }
}
