/**
 * Pure Game-Agnostic Value Objects
 */
import { ValidationFailureError } from '../../shared/kernel/Errors.js';

export class MatchId {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationFailureError('MatchId must be a valid non-empty string.');
    }
    const pattern = /^MC-[0-9]{4}-[0-9]{7}$/;
    if (!pattern.test(value)) {
      throw new ValidationFailureError(`Invalid MatchId format [${value}]. Must match MC-YYYY-NNNNNNN.`);
    }
    this.value = value;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof MatchId && this.value === other.value;
  }
}

export class Participant {
  constructor({ teamId, tag, name, players = [] }) {
    if (!teamId || typeof teamId !== 'string') {
      throw new ValidationFailureError('Participant must have a valid teamId.');
    }
    if (!name || typeof name !== 'string') {
      throw new ValidationFailureError('Participant must have a valid name.');
    }
    if (!tag || typeof tag !== 'string') {
      throw new ValidationFailureError('Participant must have a valid tag.');
    }

    this.teamId = teamId;
    this.tag = tag;
    this.name = name;
    this.players = Object.freeze([...players]);
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof Participant && this.teamId === other.teamId;
  }
}

export class MapScore {
  constructor(teamAScore = 0, teamBScore = 0) {
    if (typeof teamAScore !== 'number' || teamAScore < 0) {
      throw new ValidationFailureError('teamAScore must be a non-negative number.');
    }
    if (typeof teamBScore !== 'number' || teamBScore < 0) {
      throw new ValidationFailureError('teamBScore must be a non-negative number.');
    }

    this.teamAScore = teamAScore;
    this.teamBScore = teamBScore;
    Object.freeze(this);
  }

  incrementTeamA() {
    return new MapScore(this.teamAScore + 1, this.teamBScore);
  }

  incrementTeamB() {
    return new MapScore(this.teamAScore, this.teamBScore + 1);
  }

  equals(other) {
    return (
      other instanceof MapScore &&
      this.teamAScore === other.teamAScore &&
      this.teamBScore === other.teamBScore
    );
  }
}

export class CurrentScore {
  constructor(seriesWinsA = 0, seriesWinsB = 0, currentMapScore = new MapScore(0, 0)) {
    if (typeof seriesWinsA !== 'number' || seriesWinsA < 0) {
      throw new ValidationFailureError('seriesWinsA must be a non-negative number.');
    }
    if (typeof seriesWinsB !== 'number' || seriesWinsB < 0) {
      throw new ValidationFailureError('seriesWinsB must be a non-negative number.');
    }
    if (!(currentMapScore instanceof MapScore)) {
      throw new ValidationFailureError('currentMapScore must be an instance of MapScore.');
    }

    this.seriesWinsA = seriesWinsA;
    this.seriesWinsB = seriesWinsB;
    this.currentMapScore = currentMapScore;
    Object.freeze(this);
  }

  incrementSeriesA() {
    return new CurrentScore(this.seriesWinsA + 1, this.seriesWinsB, new MapScore(0, 0));
  }

  incrementSeriesB() {
    return new CurrentScore(this.seriesWinsA, this.seriesWinsB + 1, new MapScore(0, 0));
  }

  updateMapScore(mapScore) {
    return new CurrentScore(this.seriesWinsA, this.seriesWinsB, mapScore);
  }

  equals(other) {
    return (
      other instanceof CurrentScore &&
      this.seriesWinsA === other.seriesWinsA &&
      this.seriesWinsB === other.seriesWinsB &&
      this.currentMapScore.equals(other.currentMapScore)
    );
  }
}
