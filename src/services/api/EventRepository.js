/**
 * EventRepository Interface
 * SOLID Data Access Layer for batched telemetry flushes.
 */
export class EventRepository {
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
   * Batched fire-and-forget logging of diagnostics performance metrics.
   * @param {string} tournamentId
   * @param {string} sessionUuid
   * @param {Array<any>} diagnostics
   * @returns {Promise<any>}
   */
  async logDiagnostics(tournamentId, sessionUuid, diagnostics) {
    throw new Error("Method 'logDiagnostics' must be implemented.");
  }
}
