/**
 * CQRS Queries and Handlers
 */
import { ValidationFailureError } from '../shared/kernel/Errors.js';
import { Logger } from '../shared/kernel/Logger.js';

export class Query {
  constructor(type, payload = {}) {
    if (!type || typeof type !== 'string') {
      throw new ValidationFailureError('Query type must be a non-empty string.');
    }
    this.type = type;
    this.payload = Object.freeze({ ...payload });
    Object.freeze(this);
  }
}

export class GetMatchSummaryQuery extends Query {
  constructor(matchId) {
    super('GetMatchSummaryQuery', { matchId });
    if (!matchId) throw new ValidationFailureError('GetMatchSummaryQuery requires matchId.');
  }
}

export class GetTimelineQuery extends Query {
  constructor(matchId) {
    super('GetTimelineQuery', { matchId });
    if (!matchId) throw new ValidationFailureError('GetTimelineQuery requires matchId.');
  }
}

export class GetScoreboardQuery extends Query {
  constructor(matchId) {
    super('GetScoreboardQuery', { matchId });
    if (!matchId) throw new ValidationFailureError('GetScoreboardQuery requires matchId.');
  }
}

export class GetPlayerStatisticsQuery extends Query {
  constructor(matchId) {
    super('GetPlayerStatisticsQuery', { matchId });
    if (!matchId) throw new ValidationFailureError('GetPlayerStatisticsQuery requires matchId.');
  }
}

export class QueryDispatcher {
  constructor() {
    this.handlers = new Map();
  }

  register(queryType, handler) {
    this.handlers.set(queryType, handler);
  }

  async dispatch(query) {
    if (!query || !query.type) {
      throw new ValidationFailureError('Invalid query: type is required.');
    }
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new ValidationFailureError(`No handler registered for query: ${query.type}`);
    }
    Logger.debug(`Executing query: ${query.type}`);
    return await handler(query);
  }
}

// Export single shared platform instance
export const platformQueryDispatcher = new QueryDispatcher();
