/**
 * Application Layer Unified Exports
 */

export {
  CommandDispatcher,
  platformCommandDispatcher,
} from './CommandDispatcher.js';

export {
  Query,
  GetMatchSummaryQuery,
  GetTimelineQuery,
  GetScoreboardQuery,
  GetPlayerStatisticsQuery,
  QueryDispatcher,
  platformQueryDispatcher,
} from './Queries.js';

export { ProjectionBuilder } from './ProjectionBuilder.js';

export {
  ProjectionRegistry,
  ProjectionManager,
  platformProjectionRegistry,
  platformProjectionManager,
} from './ProjectionManager.js';

export { MatchApplicationService } from './MatchApplicationService.js';
