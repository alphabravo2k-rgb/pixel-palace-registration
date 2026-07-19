/**
 * Projection Repository Interface Contracts
 */

export class SummaryProjectionRepository {
  async save(matchId, summaryDto) {
    throw new Error('SummaryProjectionRepository.save not implemented.');
  }
  async findById(matchId) {
    throw new Error('SummaryProjectionRepository.findById not implemented.');
  }
}

export class ScoreboardProjectionRepository {
  async save(matchId, scoreboardDto) {
    throw new Error('ScoreboardProjectionRepository.save not implemented.');
  }
  async findById(matchId) {
    throw new Error('ScoreboardProjectionRepository.findById not implemented.');
  }
}

export class TimelineProjectionRepository {
  async append(matchId, timelineEventDto) {
    throw new Error('TimelineProjectionRepository.append not implemented.');
  }
  async findByMatchId(matchId) {
    throw new Error('TimelineProjectionRepository.findByMatchId not implemented.');
  }
}
