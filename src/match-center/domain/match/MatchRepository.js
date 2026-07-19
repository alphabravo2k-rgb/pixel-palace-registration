/**
 * Domain Repository Interface Contract
 */

export class MatchRepository {
  /**
   * Loads a MatchAggregateRoot instance by its unique platform identity.
   * @param {MatchId} matchId
   * @returns {Promise<MatchAggregateRoot>}
   */
  async findById(matchId) {
    throw new Error('MatchRepository.findById not implemented.');
  }

  /**
   * Appends events to the event store and updates the aggregate state in a single transaction.
   * @param {MatchAggregateRoot} aggregateRoot
   * @param {number} expectedVersion
   * @returns {Promise<void>}
   */
  async save(aggregateRoot, expectedVersion) {
    throw new Error('MatchRepository.save not implemented.');
  }
}
