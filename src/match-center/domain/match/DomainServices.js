/**
 * Domain Services & Policies
 */
import { ValidationFailureError } from '../../shared/kernel/Errors.js';
import { Logger } from '../../shared/kernel/Logger.js';

export class OverrideResolver {
  /**
   * Resolves raw provider scores against an active administrative override config.
   * Admin overrides always take precedence over provider scores.
   *
   * @param {Object} providerScore { teamAScore: X, teamBScore: Y }
   * @param {Object|null} activeOverride Current active override state DTO
   * @returns {Object} Final resolved score DTO
   */
  static resolveScore(providerScore, activeOverride = null) {
    if (!providerScore) {
      throw new ValidationFailureError('Provider score must be supplied.');
    }

    if (!activeOverride) {
      return providerScore;
    }

    // Check if the override has expired
    if (activeOverride.expiration) {
      const expirationDate = new Date(activeOverride.expiration);
      if (new Date() > expirationDate) {
        Logger.info(`Admin override expired. Falling back to provider score.`);
        return providerScore;
      }
    }

    Logger.info(`Score resolved via Admin Override (Author: ${activeOverride.author}, Priority: ${activeOverride.priority})`);
    return {
      teamAScore: activeOverride.teamAScore,
      teamBScore: activeOverride.teamBScore,
    };
  }
}

export class LifecycleService {
  /**
   * Evaluates dynamic side selection policy outcomes (e.g. coin flip, knife round).
   * @param {string} game e.g. 'CS2' or 'Valorant'
   * @param {string} selectionType e.g., 'KnifeRound' or 'CoinFlip'
   * @param {Object} outcomeDetails
   * @returns {string} Designated first side picker teamId
   */
  static determineSidePicker(game, selectionType, outcomeDetails = {}) {
    if (game === 'CS2' && selectionType === 'KnifeRound') {
      return outcomeDetails.knifeWinnerTeamId;
    }
    if (game === 'Valorant' && selectionType === 'CoinFlip') {
      return outcomeDetails.coinFlipWinnerTeamId;
    }
    // Fallback side picker assignment default to teamA
    return outcomeDetails.defaultPickerTeamId || outcomeDetails.teamAId;
  }
}
