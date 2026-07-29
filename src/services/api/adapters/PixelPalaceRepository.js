/**
 * PixelPalaceRepository Adapter
 * Responsible for fetching public bracket data from the Pixel Palace Platform API.
 * Endpoint pattern: ${baseUrl}/brackets/${bracketId}/public
 * Includes 15-second TTL in-memory caching and O(1) team map hydration.
 */

import { getTeamTag, getTeamLogoUrl } from '../../../utils/teamResolver';
import { getMatchSchedule } from '../../../utils/matchSchedule';

const DEFAULT_BASE_URL = "https://pixelpalace.lotgaming.xyz/api";
const DEFAULT_BRACKET_ID = 1;
const DEFAULT_CACHE_TTL_MS = 15000;

const ROUND_NAMES = {
  1: "Round of 32",
  2: "Round of 16",
  3: "Quarterfinals",
  4: "Semifinals",
  5: "Grand Finals"
};

export class PixelPalaceRepository {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.bracketId = options.bracketId || DEFAULT_BRACKET_ID;
    this.cacheTtlMs = options.cacheTtlMs || DEFAULT_CACHE_TTL_MS;
    
    // In-memory TTL cache storage: key -> { timestamp, data }
    this._cache = new Map();
  }

  /**
   * Resolves target URL from tournament options or string input
   */
  _resolveUrl(input) {
    if (typeof input === 'string' && input.startsWith('http')) {
      return input;
    }
    if (typeof input === 'object' && input !== null) {
      if (input.api?.baseUrl && input.api?.bracketId) {
        return `${input.api.baseUrl}/brackets/${input.api.bracketId}/public`;
      }
      if (input.bracketApiUrl) {
        return input.bracketApiUrl;
      }
    }
    return `${this.baseUrl}/brackets/${this.bracketId}/public`;
  }

  /**
   * Extensible status normalizer switch
   */
  _normalizeStatus(statusStr, isBye = false) {
    if (isBye) return 'BYE';
    if (!statusStr) return 'PENDING';

    switch (statusStr.toLowerCase()) {
      case 'completed':
      case 'finished':
        return 'COMPLETED';
      case 'live':
        return 'LIVE';
      case 'scheduled':
        return 'SCHEDULED';
      case 'checkin':
        return 'CHECKIN';
      case 'paused':
        return 'PAUSED';
      case 'walkover':
        return 'WALKOVER';
      case 'cancelled':
        return 'CANCELLED';
      case 'bye':
        return 'BYE';
      default:
        return statusStr.toUpperCase();
    }
  }

  /**
   * Normalizes the inline match_status field returned when a bracket match
   * has been linked to a LOT match (status = scheduled/live)
   */
  _normalizeLotMatchStatus(matchStatus) {
    if (!matchStatus) return null;
    switch (matchStatus.toLowerCase()) {
      case 'live':      return 'LIVE';
      case 'finished':  return 'COMPLETED';
      case 'pending':   return 'PENDING';
      case 'paused':    return 'PAUSED';
      case 'cancelled': return 'CANCELLED';
      default:          return matchStatus.toUpperCase();
    }
  }

  /**
   * Retrieves full bracket & match dataset with 15-second TTL caching
   */
  async getBracket(input) {
    const targetUrl = this._resolveUrl(input);
    const cacheKey = `bracket_${targetUrl}`;
    const now = Date.now();

    // Check in-memory cache
    if (this._cache.has(cacheKey)) {
      const cachedEntry = this._cache.get(cacheKey);
      if (now - cachedEntry.timestamp < this.cacheTtlMs) {
        return cachedEntry.data;
      }
    }

    try {
      const res = await fetch(`${targetUrl}?t=${now}`);
      if (!res.ok) {
        throw new Error(`PixelPalace API HTTP ${res.status}`);
      }
      const rawData = await res.json();

      // Normalize bracket payload
      const normalizedData = this._normalizeBracketPayload(rawData);

      // Cache normalized result
      this._cache.set(cacheKey, { timestamp: now, data: normalizedData });

      return normalizedData;
    } catch (err) {
      console.error("[PixelPalaceRepository] Error fetching bracket data:", err);
      // Return cached fallback if available during network degradation
      if (this._cache.has(cacheKey)) {
        return this._cache.get(cacheKey).data;
      }
      throw err;
    }
  }

  /**
   * Normalizes raw API response into clean JS domain models
   */
  _normalizeBracketPayload(data) {
    if (!data) return null;

    const rawTeams = data.teams || {};
    // O(1) Team Lookup Map enriched with official tags & logos
    const teamLookup = new Map();
    Object.entries(rawTeams).forEach(([id, teamObj]) => {
      if (teamObj) {
        const enrichedTeam = {
          ...teamObj,
          tag: teamObj.tag || getTeamTag(teamObj.name),
          logo: teamObj.logo_url || teamObj.logo || getTeamLogoUrl(teamObj.name) || null
        };
        teamLookup.set(String(id), enrichedTeam);
        if (teamObj.id) teamLookup.set(String(teamObj.id), enrichedTeam);
      }
    });

    const matches = Array.isArray(data.matches) ? data.matches.map(m => {
      const t1Obj = m.team1_id ? teamLookup.get(String(m.team1_id)) || { id: m.team1_id } : null;
      const t2Obj = m.team2_id ? teamLookup.get(String(m.team2_id)) || { id: m.team2_id } : null;

      const roundName = ROUND_NAMES[m.round_number] || `Round ${m.round_number}`;
      const isBye = m.status === 'bye' || (m.round_number === 1 && (m.team2_id === null || m.team1_id === null));
      const status = isBye ? 'BYE' : this._normalizeStatus(m.status);

      let winner = null;
      if (m.winner_id) {
        winner = m.winner_id === m.team1_id ? 'team1' : 'team2';
      }

      const scheduleInfo = getMatchSchedule(m.id, m.scheduled_date || data.bracket?.scheduled_date);

      const formatSourceLabel = (src) => {
        if (!src) return 'TBD';
        if (/^\d+$/.test(src)) return `Winner of Match #${src}`;
        const matchDigits = String(src).match(/(\d+)/);
        if (matchDigits) return `Winner of Match #${matchDigits[1]}`;
        return `From ${src}`;
      };

      // ── Inline LOT match data (present when kancha schedules/goes live) ──
      // The bracket API embeds match_id + match_* fields for linked matches.
      const hasLotData = m.match_id != null;
      const lotMatchStatus = hasLotData ? this._normalizeLotMatchStatus(m.match_status) : null;
      const liveMap = m.match_map || null;           // e.g. "de_nuke"
      const mapScoreT1 = m.match_score_team1 ?? 0;
      const mapScoreT2 = m.match_score_team2 ?? 0;
      const mapWinsT1 = m.match_map_wins_team1 ?? 0;
      const mapWinsT2 = m.match_map_wins_team2 ?? 0;
      const mapStats = Array.isArray(m.match_map_stats) ? m.match_map_stats : [];

      // The effective display status: prefer the live LOT match status over bracket status
      const effectiveStatus = hasLotData && lotMatchStatus ? lotMatchStatus : status;

      return {
        id: m.id,
        matchId: m.id,
        // The LOT platform match ID — used to look up live scoreboard data
        lotMatchId: hasLotData ? m.match_id : null,
        bracketId: m.bracket_id,
        roundNumber: m.round_number,
        round: roundName,
        position: m.position,
        format: `BO${m.best_of || 1}`,
        status: effectiveStatus,
        isBye,
        team1Id: m.team1_id,
        team2Id: m.team2_id,
        team1Source: m.team1_source,
        team2Source: m.team2_source,
        team1Obj: t1Obj,
        team2Obj: t2Obj,
        team1: t1Obj ? (t1Obj.name || t1Obj.tag || `Team ${m.team1_id}`) : (m.team1_source ? formatSourceLabel(m.team1_source) : 'TBD'),
        team2: isBye ? 'BYE' : (t2Obj ? (t2Obj.name || t2Obj.tag || `Team ${m.team2_id}`) : (m.team2_source ? formatSourceLabel(m.team2_source) : 'TBD')),
        winnerId: m.winner_id,
        loserId: m.loser_id,
        winner,
        score: m.score || (m.winner_id ? (m.winner_id === m.team1_id ? '1-0' : '0-1') : '0-0'),
        scheduleInfo,
        scheduledDate: scheduleInfo.iso,
        // Live match intelligence from inline LOT data
        hasLotData,
        liveMap,
        mapScoreT1,
        mapScoreT2,
        mapWinsT1,
        mapWinsT2,
        mapStats,
        lotMatchStatus,
        seriesScore: hasLotData ? {
          teamAWins: mapWinsT1,
          teamBWins: mapWinsT2,
        } : null,
      };
    }) : [];

    return {
      bracket: data.bracket || null,
      seasonName: data.season_name || "PixelPalace Community Cup 2",
      matches,
      teams: Array.isArray(rawTeams) ? rawTeams : Object.values(rawTeams),
      teamsMap: rawTeams,
      teamLookup
    };
  }

  /**
   * Retrieves a specific match by canonical ID
   */
  async getMatch(matchId, input) {
    const bracketData = await this.getBracket(input);
    if (!bracketData || !Array.isArray(bracketData.matches)) return null;

    const targetIdStr = String(matchId).trim().toLowerCase();
    return bracketData.matches.find(m => String(m.id).trim().toLowerCase() === targetIdStr) || null;
  }

  /**
   * Clears the in-memory TTL cache
   */
  clearCache() {
    this._cache.clear();
  }
}

export const pixelPalaceRepository = new PixelPalaceRepository();
