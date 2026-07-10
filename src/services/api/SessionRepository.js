/**
 * SessionRepository Interface
 * SOLID Data Access Layer for Draft Session catalog operations.
 */
export class SessionRepository {
  /**
   * Saves or updates a session metadata catalog record.
   * @param {string} tournamentId
   * @param {object} sessionData
   * @returns {Promise<any>}
   */
  async saveSession(tournamentId, sessionData) {
    throw new Error("Method 'saveSession' must be implemented.");
  }

  /**
   * Retrieves session catalog record metadata by Session UUID.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @returns {Promise<any>}
   */
  async getSession(tournamentId, sessionUuid) {
    throw new Error("Method 'getSession' must be implemented.");
  }

  /**
   * Renews session lock lease in Cache memory.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {string} lockOwner
   * @returns {Promise<any>}
   */
  async renewLock(tournamentId, sessionUuid, lockOwner) {
    throw new Error("Method 'renewLock' must be implemented.");
  }

  /**
   * Queries existing session catalogs to detect matches.
   * @param {string} tournamentId
   * @param {object} params
   * @returns {Promise<any>}
   */
  async checkDuplicateDrafts(tournamentId, params) {
    throw new Error("Method 'checkDuplicateDrafts' must be implemented.");
  }

  /**
   * Retrieves all session catalog metadata records for this tournament.
   * @param {string} tournamentId
   * @returns {Promise<any>}
   */
  async getAllDrafts(tournamentId) {
    throw new Error("Method 'getAllDrafts' must be implemented.");
  }
}
