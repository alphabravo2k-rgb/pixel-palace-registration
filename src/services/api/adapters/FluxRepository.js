/**
 * Clean Minimal FluxRepository Adapter
 * Responsible ONLY for providing public bracket & match data from Flux API.
 * Endpoint: https://flux2.lotgaming.xyz/api/brackets/8/public
 * Pure data access layer — NO presentation fallbacks, NO seeding JSON merges.
 */

const DEFAULT_BRACKET_URL = "https://flux2.lotgaming.xyz/api/brackets/8/public";

// Round number to human readable round name mapping
const ROUND_NAMES = {
  1: "Round of 32",
  2: "Round of 16",
  3: "Quarterfinals",
  4: "Semifinals",
  5: "Grand Finals"
};

export class FluxRepository {
  constructor(baseUrl = DEFAULT_BRACKET_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Retrieves full public bracket structure from Flux API
   */
  async getBracket(url = this.baseUrl) {
    try {
      const targetUrl = url || DEFAULT_BRACKET_URL;
      const res = await fetch(`${targetUrl}?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Flux API HTTP ${res.status}`);
      }
      const data = await res.json();
      
      // Standardize match payload for React UI components
      if (data && Array.isArray(data.matches)) {
        const teamsMap = data.teams || {};
        data.matches = data.matches.map(m => {
          const t1Obj = teamsMap[m.team1_id] || (m.team1_id ? { id: m.team1_id } : null);
          const t2Obj = teamsMap[m.team2_id] || (m.team2_id ? { id: m.team2_id } : null);
          
          const roundName = ROUND_NAMES[m.round_number] || `Round ${m.round_number}`;
          const isBye = m.team2_id === null && m.winner_id === m.team1_id && m.status === 'completed';

          return {
            ...m,
            id: m.id,
            matchId: m.id,
            round: roundName,
            format: `BO${m.best_of || 1}`,
            team1: t1Obj ? (t1Obj.name || t1Obj.tag || `Team ${m.team1_id}`) : (m.team1_source ? `From ${m.team1_source}` : 'TBD'),
            team2: isBye ? 'BYE' : (t2Obj ? (t2Obj.name || t2Obj.tag || `Team ${m.team2_id}`) : (m.team2_source ? `From ${m.team2_source}` : 'TBD')),
            team1Obj: t1Obj,
            team2Obj: t2Obj,
            winner: m.winner_id ? (m.winner_id === m.team1_id ? 'team1' : 'team2') : null,
            status: isBye ? 'BYE' : (m.status ? m.status.toUpperCase() : 'PENDING'),
            score: m.score || (m.winner_id ? (m.winner_id === m.team1_id ? '1-0' : '0-1') : '0-0')
          };
        });
      }

      return data;
    } catch (err) {
      console.error("[FluxRepository] Error fetching bracket from Flux API:", err);
      throw err;
    }
  }

  /**
   * Retrieves a specific match by canonical matchId from Flux API.
   */
  async getMatch(matchId, url = this.baseUrl) {
    const bracketData = await this.getBracket(url);
    if (!bracketData || !Array.isArray(bracketData.matches)) return null;

    const normalizedTarget = String(matchId).trim().toLowerCase();
    return bracketData.matches.find(m => String(m.id).trim().toLowerCase() === normalizedTarget) || null;
  }
}

export const fluxRepository = new FluxRepository();
