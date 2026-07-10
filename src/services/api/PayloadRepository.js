/**
 * PayloadRepository Interface
 * SOLID Data Access Layer for Draft Form Data JSON payloads.
 */
export class PayloadRepository {
  /**
   * Overwrites the active JSON payload for a session (Current active state).
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {number} revision
   * @param {string} compressedJson
   * @returns {Promise<any>}
   */
  async saveCurrentPayload(tournamentId, sessionUuid, revision, compressedJson) {
    throw new Error("Method 'saveCurrentPayload' must be implemented.");
  }

  /**
   * Retrieves the JSON payload of a session by Session UUID.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @returns {Promise<any>}
   */
  async getPayload(tournamentId, sessionUuid) {
    throw new Error("Method 'getPayload' must be implemented.");
  }

  /**
   * Appends a checkpoint revision history record for rollback recovery.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {number} revision
   * @param {string} compressedJson
   * @returns {Promise<any>}
   */
  async appendHistory(tournamentId, sessionUuid, revision, compressedJson) {
    throw new Error("Method 'appendHistory' must be implemented.");
  }
}
