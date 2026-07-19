/**
 * Match Lifecycle State Machine and Transition Matrix
 */
import { InvalidTransitionError } from '../../shared/kernel/Errors.js';

export const MatchState = {
  SCHEDULED: 'Scheduled',
  CHECK_IN: 'Check-In',
  PREPARATION: 'Preparation',
  SIDE_SELECTION: 'SideSelection',
  MAP_SELECTION: 'MapSelection',
  LIVE: 'Live',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

// Transition matrix mapping source state to set of allowed target states
const ALLOWED_TRANSITIONS = {
  [MatchState.SCHEDULED]: [MatchState.CHECK_IN, MatchState.CANCELLED],
  [MatchState.CHECK_IN]: [MatchState.PREPARATION, MatchState.CANCELLED],
  [MatchState.PREPARATION]: [MatchState.SIDE_SELECTION, MatchState.CANCELLED],
  [MatchState.SIDE_SELECTION]: [MatchState.MAP_SELECTION, MatchState.CANCELLED],
  [MatchState.MAP_SELECTION]: [MatchState.LIVE, MatchState.CANCELLED],
  [MatchState.LIVE]: [MatchState.PAUSED, MatchState.COMPLETED, MatchState.DISPUTED, MatchState.CANCELLED],
  [MatchState.PAUSED]: [MatchState.LIVE, MatchState.COMPLETED, MatchState.DISPUTED, MatchState.CANCELLED],
  [MatchState.COMPLETED]: [MatchState.ARCHIVED, MatchState.DISPUTED],
  [MatchState.DISPUTED]: [MatchState.LIVE, MatchState.COMPLETED, MatchState.CANCELLED],
  [MatchState.CANCELLED]: [], // Terminal state
  [MatchState.ARCHIVED]: [],  // Terminal state
};

export class MatchStateMachine {
  /**
   * Asserts whether a transition from activeState to targetState is valid.
   * @param {string} activeState
   * @param {string} targetState
   * @param {Object} context Context data (e.g. { winnerId: '...' }) to validate state invariants
   */
  static validateTransition(activeState, targetState, context = {}) {
    if (!Object.values(MatchState).includes(activeState)) {
      throw new InvalidTransitionError(`Source state [${activeState}] is unregistered.`);
    }
    if (!Object.values(MatchState).includes(targetState)) {
      throw new InvalidTransitionError(`Target state [${targetState}] is unregistered.`);
    }

    // Terminal/Immutability locks
    if (activeState === MatchState.ARCHIVED) {
      throw new InvalidTransitionError('Match is archived and permanently immutable.');
    }

    const allowed = ALLOWED_TRANSITIONS[activeState] || [];
    if (!allowed.includes(targetState)) {
      throw new InvalidTransitionError(`Forbidden lifecycle transition from [${activeState}] ──> [${targetState}].`);
    }

    // Guard invariants validation
    if (targetState === MatchState.COMPLETED && !context.winnerId) {
      throw new InvalidTransitionError('Cannot transition to Completed without designating a winner.');
    }
  }
}
