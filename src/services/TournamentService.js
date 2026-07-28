/**
 * Application Service for Tournament Operations
 * Acts as the clean high-level boundary between React UI components and API Repositories.
 */

import { pixelPalaceRepository } from './api/adapters/PixelPalaceRepository';

export class TournamentService {
  constructor(repository = pixelPalaceRepository) {
    this.repository = repository;
  }

  /**
   * Fetches normalized tournament bracket and team graph
   * @param {Object|string} tournamentOptions Tournament config object or custom bracket URL
   */
  async fetchBracket(tournamentOptions) {
    return this.repository.getBracket(tournamentOptions);
  }

  /**
   * Fetches a specific match node by canonical match ID
   */
  async fetchMatch(matchId, tournamentOptions) {
    return this.repository.getMatch(matchId, tournamentOptions);
  }

  /**
   * Manually invalidates repository cache to force fresh sync
   */
  clearCache() {
    this.repository.clearCache();
  }
}

export const tournamentService = new TournamentService();
