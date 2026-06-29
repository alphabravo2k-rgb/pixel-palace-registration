/**
 * Abstract interface for registration database adapters.
 * All database operations must extend this contract.
 */
export class RegistrationRepository {
  /**
   * Appends a new team registration to the database.
   * @param {string} tournamentId
   * @param {import('../../schemas/canonical').CanonicalSchema} payload
   * @returns {Promise<{ success: boolean, teamId: string }>}
   */
  async createRegistration(tournamentId, payload) {
    throw new Error("Method 'createRegistration' must be implemented.");
  }

  /**
   * Retrieves all verified team registrations for a tournament.
   * @param {string} tournamentId
   * @returns {Promise<{ teams: Array<any> }>}
   */
  async getRegistrations(tournamentId) {
    throw new Error("Method 'getRegistrations' must be implemented.");
  }

  /**
   * Validates if a priority/invite code is active and unused.
   * @param {string} tournamentId
   * @param {string} code
   * @returns {Promise<{ valid: boolean }>}
   */
  async validateInviteCode(tournamentId, code) {
    throw new Error("Method 'validateInviteCode' must be implemented.");
  }

  /**
   * Fetches slot allocation data.
   * @param {string} tournamentId
   * @returns {Promise<{ inviteConfirmed: number, openConfirmed: number, isFull: boolean }>}
   */
  async fetchSlots(tournamentId) {
    throw new Error("Method 'fetchSlots' must be implemented.");
  }

  /**
   * Checks a list of Steam IDs for banned players.
   * @param {string} tournamentId
   * @param {Array<string>} steamIds
   * @returns {Promise<{ hasBans: boolean }>}
   */
  async checkBans(tournamentId, steamIds) {
    throw new Error("Method 'checkBans' must be implemented.");
  }

  /**
   * Fetches bracket details for a tournament.
   * @param {string} tournamentId
   * @returns {Promise<any>}
   */
  async fetchBracket(tournamentId) {
    throw new Error("Method 'fetchBracket' must be implemented.");
  }
}
