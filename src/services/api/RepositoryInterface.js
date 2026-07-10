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

  /**
   * Tracks a single team registration by Submission ID or Registration ID.
   * @param {string} tournamentId
   * @param {string} searchId
   * @returns {Promise<any>}
   */
  async trackRegistration(tournamentId, searchId) {
    throw new Error("Method 'trackRegistration' must be implemented.");
  }

  /**
   * Saves a registration session draft and event telemetry logs.
   * @param {string} tournamentId
   * @param {object} payload
   * @returns {Promise<any>}
   */
  async saveDraft(tournamentId, payload) {
    throw new Error("Method 'saveDraft' must be implemented.");
  }

  /**
   * Retrieves a saved registration session draft by UUID.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @returns {Promise<any>}
   */
  async getDraft(tournamentId, sessionUuid) {
    throw new Error("Method 'getDraft' must be implemented.");
  }

  /**
   * Heartbeat to renew lease lock on a session draft.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {string} lockOwner
   * @returns {Promise<any>}
   */
  async renewLock(tournamentId, sessionUuid, lockOwner) {
    throw new Error("Method 'renewLock' must be implemented.");
  }

  /**
   * Searches for active duplicate registration drafts.
   * @param {string} tournamentId
   * @param {object} params
   * @returns {Promise<any>}
   */
  async checkDuplicateDrafts(tournamentId, params) {
    throw new Error("Method 'checkDuplicateDrafts' must be implemented.");
  }

  /**
   * Pulls all draft sessions for the admin dashboard.
   * @param {string} tournamentId
   * @returns {Promise<any>}
   */
  async getAllDrafts(tournamentId) {
    throw new Error("Method 'getAllDrafts' must be implemented.");
  }

  /**
   * Batched fire-and-forget logging of taxonomy events.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {Array<any>} events
   * @returns {Promise<any>}
   */
  async logEvents(tournamentId, sessionUuid, events) {
    throw new Error("Method 'logEvents' must be implemented.");
  }

  /**
   * Batched fire-and-forget logging of diagnostics telemetry.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {Array<any>} diagnostics
   * @returns {Promise<any>}
   */
  async logDiagnostics(tournamentId, sessionUuid, diagnostics) {
    throw new Error("Method 'logDiagnostics' must be implemented.");
  }

  /**
   * Retrieves dynamically calculated funnel metrics and latencies.
   * @param {string} tournamentId
   * @returns {Promise<any>}
   */
  async getMetrics(tournamentId) {
    throw new Error("Method 'getMetrics' must be implemented.");
  }
}
