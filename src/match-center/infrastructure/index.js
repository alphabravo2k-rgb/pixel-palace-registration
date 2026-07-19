/**
 * Infrastructure Layer Unified Exports
 */

export {
  EventStore,
  platformEventStore,
} from './EventStore.js';

export {
  SupabaseMatchRepository,
  platformMatchRepository,
} from './SupabaseMatchRepository.js';

export {
  ProviderGateway,
  platformProviderGateway,
} from './ProviderGateway.js';

export { RconStub } from './RconStub.js';

export {
  InMemorySummaryProjectionRepository,
  InMemoryScoreboardProjectionRepository,
  InMemoryTimelineProjectionRepository,
  platformSummaryRepo,
  platformScoreboardRepo,
  platformTimelineRepo,
} from './SupabaseProjectionRepositories.js';

export {
  InMemoryUnitOfWork,
  platformUnitOfWork,
} from './UnitOfWork.js';

export { LotGamingAdapter } from './LotGamingAdapter.js';
