/**
 * Infrastructure LOT Gaming Provider Adapter (Anti-Corruption Layer)
 * Supports multiple LOT Gaming instances (dlan, fluxbot, etc.) via configurable base URL.
 */
import { Logger } from '../shared/kernel/Logger.js';

// Known LOT Gaming instance URL → local dev proxy path map
const LOT_PROXY_MAP = {
  'dlan.lotgaming.xyz': 'https://dlan.lotgaming.xyz/api',
  'fluxbot.lotgaming.xyz': 'https://flux2.lotgaming.xyz/api',
  'flux2.lotgaming.xyz': 'https://flux2.lotgaming.xyz/api',
};

function sanitizeLogoUrl(logoUrl) {
  if (!logoUrl) return '';
  const urlStr = String(logoUrl).trim();
  if (urlStr.includes("drive.google.com")) {
    const driveIdMatch = urlStr.match(/id=([a-zA-Z0-9_-]{25,})/) || urlStr.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (driveIdMatch) {
      return "https://lh3.googleusercontent.com/d/" + driveIdMatch[1];
    }
  }
  return urlStr;
}

/**
 * Resolves the correct fetch base URL for a given LOT instance hostname.
 * In development (localhost), uses the Vite dev proxy to bypass CORS.
 * In production, uses the direct remote URL.
 */
function resolveBaseUrl(hostname) {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && LOT_PROXY_MAP[hostname]) {
    return LOT_PROXY_MAP[hostname];
  }
  return `https://${hostname}/api`;
}

export class LotGamingAdapter {
  /**
   * @param {string} providerHostname e.g. 'dlan.lotgaming.xyz' or 'fluxbot.lotgaming.xyz'
   */
  constructor(providerHostname = 'dlan.lotgaming.xyz') {
    this.hostname = providerHostname;
    this.baseUrl = resolveBaseUrl(providerHostname);
    Logger.info(`LotGamingAdapter: Initialized for [${providerHostname}] → ${this.baseUrl}`);
  }

  getCapabilities() {
    return {
      scoreboardPolling: true,
      timelineFeed: false,
      playerStatistics: true,
      economyTracking: false,
      pauseEventParsing: false,
      rconIntegration: false,
    };
  }

  /**
   * Fetches raw match payload from the LOT Gaming endpoint.
   * @param {string} externalMatchId e.g. "8"
   */
  async fetchMatchData(externalMatchId) {
    const url = `${this.baseUrl}/matches/${externalMatchId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP Error Status: ${response.status} from ${url}`);
      }
      const rawJson = await response.json();
      return rawJson;
    } catch (err) {
      Logger.debug(`LOT Adapter: Match #${externalMatchId} not yet created on server (${err.message})`);
      return null;
    }
  }

  /**
   * Fetches a LOT match directly from the Pixel Palace platform API.
   * This is the canonical source when the bracket provides a match_id.
   * URL: https://pixelpalace.lotgaming.xyz/api/matches/:lotMatchId
   * @param {number|string} lotMatchId
   */
  static async fetchFromPixelPalace(lotMatchId) {
    const url = `https://pixelpalace.lotgaming.xyz/api/matches/${lotMatchId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      Logger.debug(`[PixelPalace LOT] Match #${lotMatchId} fetch failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Fetches raw stats for a specific map in the series.
   * @param {string} externalMatchId
   * @param {number} mapIndex
   */
  async fetchMapStats(externalMatchId, mapIndex) {
    const url = `${this.baseUrl}/matches/${externalMatchId}/maps/${mapIndex}/stats`;
    Logger.info(`LOT Adapter [${this.hostname}]: Fetching map ${mapIndex} stats from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const rawJson = await response.json();
      return rawJson;
    } catch {
      return null;
    }
  }

  /**
   * Anti-Corruption Layer: Maps raw LOT JSON to our Canonical DTO contract.
   * @param {Object} raw
   * @param {Array} mapStatsArray
   */
  async translateToCanonical(raw, mapStatsArray = []) {
    Logger.debug('LOT ACL: Mapping raw JSON payload');
    const targetMatchId = `MC-2026-${String(raw.id).padStart(7, '0')}`;

    let teamAName = raw.team1_name || 'Team 1';
    let teamATag = raw.team1_tag
      ? raw.team1_tag.toUpperCase()
      : (raw.team1_name || 'T1').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'T1';
    let teamALogo = null;

    let teamBName = raw.team2_name || 'Team 2';
    let teamBTag = raw.team2_tag
      ? raw.team2_tag.toUpperCase()
      : (raw.team2_name || 'T2').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'T2';
    let teamBLogo = null;

    // Apply Admin local overrides if present
    try {
      const overridesStr = localStorage.getItem(`admin_override_${targetMatchId}`);
      if (overridesStr) {
        const overrides = JSON.parse(overridesStr);
        if (overrides.teamAName) teamAName = overrides.teamAName;
        if (overrides.teamATag) teamATag = overrides.teamATag;
        if (overrides.teamALogo) teamALogo = overrides.teamALogo;
        if (overrides.teamBName) teamBName = overrides.teamBName;
        if (overrides.teamBTag) teamBTag = overrides.teamBTag;
        if (overrides.teamBLogo) teamBLogo = overrides.teamBLogo;
      }
    } catch (e) {
      Logger.warn(`LOT ACL: Failed to load admin overrides: ${e.message}`);
    }

    const mapPlayer = (p) => ({
      steamId: p.steam_id,
      name: p.name,
      kills: p.kills || 0,
      deaths: p.deaths || 0,
      assists: p.assists || 0,
      kd: p.kd || 0,
      damage: p.damage || 0,
      headshots: p.headshots || 0,
      hsPct: p.hs_pct || 0,
      adr: p.adr || 0,
      rating: p.hltv_rating || p.rating || 0,
      hltvRating: p.hltv_rating || 0,
      fluxImpact: p.flux_impact || 0,
      mvps: p.mvps || 0,
      score: p.score || 0,
      // Advanced Tactical Stats
      entryKills: p.entry_kills || 0,
      openingDeaths: p.opening_deaths || 0,
      tradeKills: p.trade_kills || 0,
      tradedDeaths: p.traded_deaths || 0,
      multikills: {
        k2: p.multikill_2k || 0,
        k3: p.multikill_3k || 0,
        k4: p.multikill_4k || 0,
        k5: p.multikill_5k || 0,
      },
      clutches: {
        v1: p.clutch_1v1 || 0,
        v2: p.clutch_1v2 || 0,
        v3: p.clutch_1v3 || 0,
        v4: p.clutch_1v4 || 0,
        v5: p.clutch_1v5 || 0,
        total: (p.clutch_1v1 || 0) + (p.clutch_1v2 || 0) + (p.clutch_1v3 || 0) + (p.clutch_1v4 || 0) + (p.clutch_1v5 || 0),
      },
      objective: {
        bombPlants: p.bomb_plants || 0,
        bombDefuses: p.bomb_defuses || 0,
        flashAssists: p.flash_assists || 0,
      },
      kastPct: p.kast_pct || 0,
      kastRounds: p.kast_rounds || 0,
      impactRating: p.impact_rating || 0,
      faceit: p.faceit ? {
        nickname: p.faceit.nickname,
        avatar: p.faceit.avatar,
        level: p.faceit.skill_level,
        elo: p.faceit.faceit_elo,
        country: p.faceit.country,
        profileUrl: p.faceit.faceit_url?.replace('{lang}', 'en'),
      } : null,
    });

    const winnerId = raw.status === 'finished'
      ? (raw.map_wins_team1 > raw.map_wins_team2 ? `T-${raw.team1_id}` : `T-${raw.team2_id}`)
      : null;

    // Filter out players with zero kills AND zero damage (bench/coaches)
    const isActivePlayer = (p) => p.kills > 0 || p.damage > 0 || p.deaths > 0;

    return {
      matchId: targetMatchId,
      game: 'Counter-Strike 2',
      format: `BO${raw.best_of || 1}`,
      status: this.mapStatus(raw.status),
      matchStage: raw.match_stage || null,   // 'warmup' | 'knife' | 'live' | ...
      teamA: {
        teamId: `T-${raw.team1_id}`,
        name: teamAName,
        tag: teamATag,
        logo: sanitizeLogoUrl(teamALogo || raw.team1_logo_url) || null,
        players: (raw.team1_players || []).filter(isActivePlayer).map(p => p.name),
      },
      teamB: {
        teamId: `T-${raw.team2_id}`,
        name: teamBName,
        tag: teamBTag,
        logo: sanitizeLogoUrl(teamBLogo || raw.team2_logo_url) || null,
        players: (raw.team2_players || []).filter(isActivePlayer).map(p => p.name),
      },
      scoreboard: {
        teamAScore: raw.score_team1 || 0,
        teamBScore: raw.score_team2 || 0,
      },
      seriesScore: {
        teamAWins: raw.map_wins_team1 || 0,
        teamBWins: raw.map_wins_team2 || 0,
      },
      activeMap: raw.map || null,
      mapImageUrl: raw.map_image_url || null,
      startingSide: raw.starting_side || null,
      currentMapIndex: raw.current_map_index ?? 0,
      mapList: (() => {
        try {
          return typeof raw.map_list === 'string' ? JSON.parse(raw.map_list) : (raw.map_list || []);
        } catch { return []; }
      })(),
      winnerId,
      startedAt: raw.started_at || null,
      finishedAt: raw.finished_at || null,
      bestOf: raw.best_of || 1,
      // Knife round info
      knifeRound: raw.has_knife_round ? {
        winner: raw.knife_round_winner,
        decision: raw.knife_round_decision,
      } : null,
      // Veto info
      veto: raw.veto_enabled ? {
        format: raw.veto_format,
        sessionId: raw.veto_session_id,
        mapPool: raw.map_pool,
      } : null,
      // Pre-match roster (all players, including warmup — not filtered)
      team1_players: raw.team1_players || [],
      team2_players: raw.team2_players || [],
      // Rich player stats — filter inactive bench players (post-match)
      playerStats: {
        teamA: (raw.team1_players || []).filter(isActivePlayer).map(mapPlayer),
        teamB: (raw.team2_players || []).filter(isActivePlayer).map(mapPlayer),
      },
      // Server & CSTV info (include SDR & Password regardless of country field)
      server: {
        country: raw.server_country_name || null,
        city: raw.server_city || null,
        countryCode: raw.server_country_code || null,
        serverPassword: raw.server_password_set || raw.server_password || null,
        cstvIp: raw.cstv1_ip || null,
        cstvPassword: raw.cstv1_password || null,
        cstvPublic: raw.cstv1_public === 1,
        cstvViewers: raw.cstv1_viewers ?? 0,
        sdrAddress: raw.sdr_address || null,
      },
      // Demo links
      demoLinks: (raw.demo_links || []).map(d => ({
        mapIndex: d.map_index,
        filename: d.filename,
        downloadUrl: d.download_url,
      })),
      mapsStats: mapStatsArray,
      // Map-by-map per-player breakdown stats
      statsByMap: raw.stats_by_map ? Object.fromEntries(
        Object.entries(raw.stats_by_map).map(([mapIdx, mapObj]) => [
          mapIdx,
          {
            teamA: (mapObj.team1_players || []).filter(isActivePlayer).map(mapPlayer),
            teamB: (mapObj.team2_players || []).filter(isActivePlayer).map(mapPlayer),
          }
        ])
      ) : null,
    };
  }

  mapStatus(rawStatus) {
    switch (rawStatus) {
      case 'finished': return 'Completed';
      case 'live': return 'Live';
      case 'warmup': return 'Preparation';
      case 'knife': return 'Preparation';
      default: return 'Scheduled';
    }
  }
}

// Pre-registered singleton instances for known providers
export const lotDlanAdapter = new LotGamingAdapter('dlan.lotgaming.xyz');
export const lotFluxbotAdapter = new LotGamingAdapter('fluxbot.lotgaming.xyz');
