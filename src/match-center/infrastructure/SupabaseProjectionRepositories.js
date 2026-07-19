/**
 * Concrete Projection Repository Implementations
 */
import {
  SummaryProjectionRepository,
  ScoreboardProjectionRepository,
  TimelineProjectionRepository
} from '../application/ProjectionRepository.js';
import { platformProjectionRegistry } from '../application/ProjectionManager.js';

export class InMemorySummaryProjectionRepository extends SummaryProjectionRepository {
  async save(matchId, summaryDto) {
    await platformProjectionRegistry.updateSummary(matchId, summaryDto);
  }

  async findById(matchId) {
    return platformProjectionRegistry.getSummary(matchId);
  }
}

export class InMemoryScoreboardProjectionRepository extends ScoreboardProjectionRepository {
  async save(matchId, scoreboardDto) {
    await platformProjectionRegistry.updateScoreboard(matchId, scoreboardDto);
  }

  async findById(matchId) {
    return platformProjectionRegistry.getScoreboard(matchId);
  }
}

export class InMemoryTimelineProjectionRepository extends TimelineProjectionRepository {
  async append(matchId, timelineEventDto) {
    await platformProjectionRegistry.appendTimeline(matchId, timelineEventDto);
  }

  async findByMatchId(matchId) {
    return platformProjectionRegistry.getTimeline(matchId);
  }
}

// Export single shared platform instances
export const platformSummaryRepo = new InMemorySummaryProjectionRepository();
export const platformScoreboardRepo = new InMemoryScoreboardProjectionRepository();
export const platformTimelineRepo = new InMemoryTimelineProjectionRepository();
