/**
 * MetricsRepository Interface
 * SOLID Data Access Layer for dynamic KPI metrics.
 */
export class MetricsRepository {
  /**
   * Retrieves dynamic cached KPIs, funnel analytics, and latencies.
   * @param {string} tournamentId
   * @returns {Promise<any>}
   */
  async getMetrics(tournamentId) {
    throw new Error("Method 'getMetrics' must be implemented.");
  }

  /**
   * Negotiates server-side capabilities (limits, features, schemas).
   * @param {string} tournamentId
   * @returns {Promise<any>}
   */
  async getCapabilities(tournamentId) {
    throw new Error("Method 'getCapabilities' must be implemented.");
  }
}
