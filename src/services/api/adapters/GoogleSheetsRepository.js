import { RegistrationRepository } from '../RepositoryInterface';
import { flattenForSheets } from './googleSheets';
import { tournaments } from '../../../config/tournaments';

export class GoogleSheetsRepository extends RegistrationRepository {
  constructor() {
    super();
  }

  _getEndpoint(tournamentId) {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament "${tournamentId}" not found in config.`);
    }
    return tournament.sheetsEndpoint;
  }

  async createRegistration(tournamentId, payload) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) {
      console.warn('[GoogleSheetsRepository] No sheetsEndpoint. Returning mock success.');
      return { success: true, teamId: 'PP-MOCK-001' };
    }

    const flatPayload = {
      ...flattenForSheets(payload),
      endpoint: '/api/v1/register',
      _gateway_secret: import.meta.env.VITE_GATEWAY_AUTH_SECRET || ''
    };

    let attempt = 0;
    const maxRetries = 3;
    const delays = [2000, 5000, 12000];

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(flatPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Client error: ${response.status}`);
          }
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return { success: true, data };
      } catch (err) {
        clearTimeout(timeoutId);
        const isTimeout = err.name === 'AbortError' || err.message.includes('timed out');
        const isNetwork = err.name === 'TypeError';

        if ((isTimeout || isNetwork) && attempt < maxRetries) {
          console.warn(`[GoogleSheetsRepository] Attempt ${attempt + 1} failed. Retrying in ${delays[attempt]}ms...`, err);
          await new Promise(r => setTimeout(r, delays[attempt]));
          attempt++;
          continue;
        }
        if (isTimeout) throw new Error('Connection timed out after multiple retries. Please save your work and try later.');
        throw err;
      }
    }
  }

  async getRegistrations(tournamentId) {
    const endpoint = this._getEndpoint(tournamentId);
    let apiTeams = [];
    if (endpoint) {
      try {
        const res = await fetch(`${endpoint}?endpoint=/api/v1/getTeams&action=getTeams&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.teams)) {
            apiTeams = data.teams;
          }
        }
      } catch (err) {
        console.error("[GoogleSheetsRepository] getRegistrations failed:", err);
      }
    }

    // Merge static teams list with API teams, avoiding duplicate names
    const mergedMap = new Map();
    
    // First, populate with static teams
    STATIC_TEAMS.forEach(t => {
      const sanitizedLogo = sanitizeLogoUrl(t.logo_url);
      t.logo_url = sanitizedLogo;
      if (t.team) t.team.logo_url = sanitizedLogo;
      mergedMap.set(t.team_name.toLowerCase().trim(), t);
    });

    // Then, merge API teams (overwriting or keeping custom ones)
    apiTeams.forEach(t => {
      const name = (t.team_name || t.team?.team_name || '').toLowerCase().trim();
      if (name) {
        const logo = sanitizeLogoUrl(t.logo_url || t.team?.logo_url);
        // Construct canonical team structure
        const canonicalTeam = {
          id: t.id || `T-SHEET-${name.replace(/\s+/g, '-')}`,
          team_name: t.team_name || t.team?.team_name,
          team_tag: t.team_tag || t.team?.team_tag,
          logo_url: logo,
          team: {
            team_name: t.team_name || t.team?.team_name,
            team_tag: t.team_tag || t.team?.team_tag,
            logo_url: logo,
          }
        };
        mergedMap.set(name, canonicalTeam);
      }
    });

    return { teams: Array.from(mergedMap.values()) };
  }

  async validateInviteCode(tournamentId, code) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) {
      return { valid: code.toUpperCase() === 'ADMIN' };
    }

    const res = await fetch(`${endpoint}?endpoint=/api/v1/validateCode&validateCode=${encodeURIComponent(code)}&tournamentId=${encodeURIComponent(tournamentId)}`);
    return res.json();
  }

  async fetchSlots(tournamentId) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) {
      const serverTime = new Date().toISOString();
      return {
        max: 32,
        confirmed: 31,
        left: 1,
        inviteConfirmed: 6,
        openConfirmed: 25,
        isFull: false,
        phase: "REGISTRATION",
        registration: {
          status: "OPEN",
          isAcceptingRegistrations: true,
          closedAt: null,
          closedReason: null,
          triggeredBy: null,
          remainingSlots: 1,
          registrationDeadline: "2026-07-26T23:59:00+05:00",
          serverTime: serverTime,
          version: 1,
          title: "Registration Active",
          subtitle: "Secure your place before registrations close.",
          cta: "Register Your Team",
          icon: "shield-check",
          severity: "info",
          lastTransition: {
            from: "CLOSED",
            to: "OPEN",
            reason: "ADMIN_ACTION",
            timestamp: "2026-07-22T20:10:00Z",
            transitionId: "REG-000001"
          },
          waitlist: {
            enabled: false,
            status: "INACTIVE",
            position: 0,
            available: 0
          }
        },
        capacity: {
          total: 32,
          public: 26,
          invite: 6,
          remaining: 1,
          percentage: 96.88
        },
        registrationPools: {
          public: { max: 26, used: 25, remaining: 1 },
          invite: { max: 6, used: 6, remaining: 0 }
        },
        analytics: {
          confirmedTeams: 31,
          pendingTeams: 0,
          rejectedTeams: 0,
          withdrawnTeams: 0,
          inviteUsed: 6,
          publicUsed: 25
        },
        meta: {
          apiVersion: "3.0",
          schemaVersion: "v3",
          registrationEngineVersion: "3.0.0",
          generatedAt: serverTime,
          generationTimeMs: 5,
          cacheStatus: "MISS",
          requestId: "REQ-MOCK",
          serverRegion: "Dubai (DXB)"
        }
      };
    }

    const res = await fetch(`${endpoint}?endpoint=/api/v1/getSlots&action=getSlots&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
    return res.json();
  }

  async checkBans(tournamentId, steamIds) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint || steamIds.length === 0) {
      return { hasBans: false };
    }

    const res = await fetch(`${endpoint}?endpoint=/api/v1/checkBans&action=checkBans&steamIds=${encodeURIComponent(steamIds.join(','))}`);
    return res.json();
  }

  async fetchBracket(tournamentId) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) {
      return { 
         bracketUrl: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png", 
         schedule: ["Quarterfinals: 18:00 GST", "Semifinals: 20:00 GST", "Grand Finals: 22:00 GST"] 
      };
    }

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/getBracket&action=getBracket&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Bracket offline");
      return res.json();
    } catch (err) {
      throw err;
    }
  }

  async trackRegistration(tournamentId, searchId, secondaryId = "") {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) {
      return { success: false, error: 'No endpoint configured' };
    }

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/trackRegistration&action=trackRegistration&tournamentId=${encodeURIComponent(tournamentId)}&searchId=${encodeURIComponent(searchId)}&secondaryId=${encodeURIComponent(secondaryId)}&t=${Date.now()}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP Error ${res.status}: ${res.statusText || 'Offline'} - ${text.substring(0, 100)}`);
      }
      const data = await res.json();
      if (data && data.success && data.team && data.team.logo) {
        let logoUrl = data.team.logo;
        if (logoUrl.includes("drive.google.com")) {
          const driveIdMatch = logoUrl.match(/id=([a-zA-Z0-9_-]{25,})/) || logoUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
          if (driveIdMatch) {
            data.team.logo = "https://lh3.googleusercontent.com/d/" + driveIdMatch[1];
          }
        }
      }
      return data;
    } catch (err) {
      console.error("[GoogleSheetsRepository] trackRegistration failed:", err);
      return { success: false, error: err.message };
    }
  }

  async saveDraft(tournamentId, payload) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: true };

    const body = {
      ...payload,
      endpoint: '/api/v1/saveDraft',
      _gateway_secret: import.meta.env.VITE_GATEWAY_AUTH_SECRET || ''
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] saveDraft failed:", err);
      throw err;
    }
  }

  async getDraft(tournamentId, sessionUuid) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: false, error: 'No endpoint configured' };

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/getDraft&sessionUuid=${encodeURIComponent(sessionUuid)}&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] getDraft failed:", err);
      throw err;
    }
  }

  async renewLock(tournamentId, sessionUuid, lockOwner) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: true };

    const body = {
      endpoint: '/api/v1/renewLock',
      sessionUuid,
      lockOwner,
      _gateway_secret: import.meta.env.VITE_GATEWAY_AUTH_SECRET || ''
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.warn("[GoogleSheetsRepository] renewLock failed:", err);
      return { success: false, error: err.message };
    }
  }

  async checkDuplicateDrafts(tournamentId, params) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { duplicate: false };

    const queryStr = Object.keys(params)
      .map(k => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/checkDuplicateDrafts&tournamentId=${encodeURIComponent(tournamentId)}&${queryStr}&t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] checkDuplicateDrafts failed:", err);
      return { duplicate: false };
    }
  }

  async getAllDrafts(tournamentId) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: false, error: 'No endpoint configured' };

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/getAllDrafts&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] getAllDrafts failed:", err);
      throw err;
    }
  }

  async logEvents(tournamentId, sessionUuid, events) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: true };

    const body = {
      endpoint: '/api/v1/logEvents',
      sessionUuid,
      events,
      _gateway_secret: import.meta.env.VITE_GATEWAY_AUTH_SECRET || ''
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.warn("[GoogleSheetsRepository] logEvents failed:", err);
      return { success: false, error: err.message };
    }
  }

  async logDiagnostics(tournamentId, sessionUuid, diagnostics) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: true };

    const body = {
      endpoint: '/api/v1/logDiagnostics',
      sessionUuid,
      diagnostics,
      _gateway_secret: import.meta.env.VITE_GATEWAY_AUTH_SECRET || ''
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.warn("[GoogleSheetsRepository] logDiagnostics failed:", err);
      return { success: false, error: err.message };
    }
  }

  async getMetrics(tournamentId) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: false, error: 'No endpoint configured' };

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/metrics&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] getMetrics failed:", err);
      throw err;
    }
  }

  async getCapabilities(tournamentId) {
    const endpoint = this._getEndpoint(tournamentId);
    if (!endpoint) return { success: false, error: 'No endpoint configured' };

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/capabilities&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] getCapabilities failed:", err);
      throw err;
    }
  }
}

export function sanitizeLogoUrl(logoUrl) {
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

const STATIC_TEAMS = [
  {
    id: "team-eagle",
    team_name: "Team Eagle",
    team_tag: "Eagle",
    logo_url: "https://drive.google.com/uc?export=view&id=1MdrjT0acW7JLJoOWBfr_Y3QDWFtRB430",
    team: {
      team_name: "Team Eagle",
      team_tag: "Eagle",
      logo_url: "https://drive.google.com/uc?export=view&id=1MdrjT0acW7JLJoOWBfr_Y3QDWFtRB430"
    }
  },
  {
    id: "team-black",
    team_name: "team black",
    team_tag: "black",
    logo_url: "https://drive.google.com/uc?export=view&id=1_TIig1SFENt4ECS-rWStt0TgCVxkw4YM",
    team: {
      team_name: "team black",
      team_tag: "black",
      logo_url: "https://drive.google.com/uc?export=view&id=1_TIig1SFENt4ECS-rWStt0TgCVxkw4YM"
    }
  },
  {
    id: "team-legion",
    team_name: "Legion",
    team_tag: "lg",
    logo_url: "https://drive.google.com/uc?export=view&id=1l-ayzwYBElLx7EeAMV953cPteKYiJ8Nh",
    team: {
      team_name: "Legion",
      team_tag: "lg",
      logo_url: "https://drive.google.com/uc?export=view&id=1l-ayzwYBElLx7EeAMV953cPteKYiJ8Nh"
    }
  },
  {
    id: "team-invictus",
    team_name: "Team Invictus",
    team_tag: "INVIC",
    logo_url: "https://drive.google.com/uc?export=view&id=1DqvTa08R0YtLCPQzf-2kkGcq25ftF4pu",
    team: {
      team_name: "Team Invictus",
      team_tag: "INVIC",
      logo_url: "https://drive.google.com/uc?export=view&id=1DqvTa08R0YtLCPQzf-2kkGcq25ftF4pu"
    }
  },
  {
    id: "team-board-to-death",
    team_name: "Board To Death",
    team_tag: "BTD",
    logo_url: "https://drive.google.com/uc?export=view&id=17y5iDghg53oONpQVXAtUrO3LDi7nuHWu",
    team: {
      team_name: "Board To Death",
      team_tag: "BTD",
      logo_url: "https://drive.google.com/uc?export=view&id=17y5iDghg53oONpQVXAtUrO3LDi7nuHWu"
    }
  },
  {
    id: "team-pakboyz",
    team_name: "PAKBOYZ",
    team_tag: "PAKBOYZ",
    logo_url: "https://drive.google.com/uc?export=view&id=1YgPBykbPp0QfOBXV_Mkni7r5S8f3rX-R",
    team: {
      team_name: "PAKBOYZ",
      team_tag: "PAKBOYZ",
      logo_url: "https://drive.google.com/uc?export=view&id=1YgPBykbPp0QfOBXV_Mkni7r5S8f3rX-R"
    }
  },
  {
    id: "team-udst-wolves",
    team_name: "UDST Wolves",
    team_tag: "WLVS",
    logo_url: "https://drive.google.com/uc?export=view&id=1cdTr8x4PC__iLxGBzD9959KHqEdSkL5_",
    team: {
      team_name: "UDST Wolves",
      team_tag: "WLVS",
      logo_url: "https://drive.google.com/uc?export=view&id=1cdTr8x4PC__iLxGBzD9959KHqEdSkL5_"
    }
  },
  {
    id: "team-back-below",
    team_name: "Back Below",
    team_tag: "BB",
    logo_url: "https://drive.google.com/uc?export=view&id=1nwxrGcSBRxVXDCXTuCrhNqXeMborUQQ6",
    team: {
      team_name: "Back Below",
      team_tag: "BB",
      logo_url: "https://drive.google.com/uc?export=view&id=1nwxrGcSBRxVXDCXTuCrhNqXeMborUQQ6"
    }
  },
  {
    id: "team-mr-clan",
    team_name: "Mr  CLAN ",
    team_tag: "Mr",
    logo_url: "https://drive.google.com/uc?export=view&id=1mEGkcRM_x4_MKGlu5mhiZhJU4sMQ7MfD",
    team: {
      team_name: "Mr  CLAN ",
      team_tag: "Mr",
      logo_url: "https://drive.google.com/uc?export=view&id=1mEGkcRM_x4_MKGlu5mhiZhJU4sMQ7MfD"
    }
  },
  {
    id: "team-nhk",
    team_name: "NHK",
    team_tag: "NHK",
    logo_url: "https://drive.google.com/uc?export=view&id=1PvJkpkYG9ipMod_4J75g-N4lvSsuX6MD",
    team: {
      team_name: "NHK",
      team_tag: "NHK",
      logo_url: "https://drive.google.com/uc?export=view&id=1PvJkpkYG9ipMod_4J75g-N4lvSsuX6MD"
    }
  },
  {
    id: "team-arrival",
    team_name: "ArriVal",
    team_tag: "AVL",
    logo_url: "https://drive.google.com/uc?export=view&id=1UGpQ1pDtWUpkc0IYSVS2PVPFME8t4pDN",
    team: {
      team_name: "ArriVal",
      team_tag: "AVL",
      logo_url: "https://drive.google.com/uc?export=view&id=1UGpQ1pDtWUpkc0IYSVS2PVPFME8t4pDN"
    }
  },
  {
    id: "team-btc",
    team_name: "TEAM BTC",
    team_tag: "BTC",
    logo_url: "https://drive.google.com/uc?export=view&id=15jjuCssA3AE5NxItIA_vx7iJRTIJmYFK",
    team: {
      team_name: "TEAM BTC",
      team_tag: "BTC",
      logo_url: "https://drive.google.com/uc?export=view&id=15jjuCssA3AE5NxItIA_vx7iJRTIJmYFK"
    }
  },
  {
    id: "team-aimst4rs",
    team_name: "Aimst4rs",
    team_tag: "AS",
    logo_url: "https://drive.google.com/uc?export=view&id=1AsxaAW0Mj0ih-4oRc249mBZW1IdXq77k",
    team: {
      team_name: "Aimst4rs",
      team_tag: "AS",
      logo_url: "https://drive.google.com/uc?export=view&id=1AsxaAW0Mj0ih-4oRc249mBZW1IdXq77k"
    }
  },
  {
    id: "team-last-dance",
    team_name: "Last Dance",
    team_tag: "lD",
    logo_url: "https://drive.google.com/uc?export=view&id=1S4M1nsmakUaBvDjb4yNxz_cBKMKt0mK4",
    team: {
      team_name: "Last Dance",
      team_tag: "lD",
      logo_url: "https://drive.google.com/uc?export=view&id=1S4M1nsmakUaBvDjb4yNxz_cBKMKt0mK4"
    }
  },
  {
    id: "team-mani69",
    team_name: "Team Mani69",
    team_tag: "M69",
    logo_url: "https://drive.google.com/uc?export=view&id=1GCmjGSvBsXPuP-53mHQKKKSM3jL1UDbu",
    team: {
      team_name: "Team Mani69",
      team_tag: "M69",
      logo_url: "https://drive.google.com/uc?export=view&id=1GCmjGSvBsXPuP-53mHQKKKSM3jL1UDbu"
    }
  },
  {
    id: "team-m5",
    team_name: "Team M5",
    team_tag: "M5",
    logo_url: "https://drive.google.com/uc?export=view&id=1kRH0c7peX-Y6m4fvDBNDQaKlb1_dPUEV",
    team: {
      team_name: "Team M5",
      team_tag: "M5",
      logo_url: "https://drive.google.com/uc?export=view&id=1kRH0c7peX-Y6m4fvDBNDQaKlb1_dPUEV"
    }
  },
  {
    id: "team-cloud69",
    team_name: "cloud69",
    team_tag: "C69",
    logo_url: "https://drive.google.com/uc?export=view&id=1Y5FNFuL2mrNA5Xj3tefsoFY4tQGFnrt0",
    team: {
      team_name: "cloud69",
      team_tag: "C69",
      logo_url: "https://drive.google.com/uc?export=view&id=1Y5FNFuL2mrNA5Xj3tefsoFY4tQGFnrt0"
    }
  },
  {
    id: "team-quintess-esports",
    team_name: "Quintess Esports",
    team_tag: "QES",
    logo_url: "https://drive.google.com/uc?export=view&id=1P6ZyU4H-Qyo3abz12CiF8JmL1KY0eH3h",
    team: {
      team_name: "Quintess Esports",
      team_tag: "QES",
      logo_url: "https://drive.google.com/uc?export=view&id=1P6ZyU4H-Qyo3abz12CiF8JmL1KY0eH3h"
    }
  },
  {
    id: "team-bambarbola",
    team_name: "Bambarbola",
    team_tag: "BB",
    logo_url: "https://drive.google.com/uc?export=view&id=15dGtyRnWS-3vTdQ0kiF-HfUoIF9Dma9E",
    team: {
      team_name: "Bambarbola",
      team_tag: "BB",
      logo_url: "https://drive.google.com/uc?export=view&id=15dGtyRnWS-3vTdQ0kiF-HfUoIF9Dma9E"
    }
  },
  {
    id: "team-star-bois",
    team_name: "Star Bois",
    team_tag: "SB",
    logo_url: "https://drive.google.com/uc?export=view&id=1Klo6q-NuQhUKidGBACRYht2XRRyDykRA",
    team: {
      team_name: "Star Bois",
      team_tag: "SB",
      logo_url: "https://drive.google.com/uc?export=view&id=1Klo6q-NuQhUKidGBACRYht2XRRyDykRA"
    }
  },
  {
    id: "team-jpb",
    team_name: "JPB",
    team_tag: "JPB",
    logo_url: "https://drive.google.com/uc?export=view&id=1i4Jz_NpABwpYJqjhHNiU0UUPhmNR0XA2",
    team: {
      team_name: "JPB",
      team_tag: "JPB",
      logo_url: "https://drive.google.com/uc?export=view&id=1i4Jz_NpABwpYJqjhHNiU0UUPhmNR0XA2"
    }
  },
  {
    id: "team-diamond-dogs",
    team_name: "Diamond Dogs",
    team_tag: "DD",
    logo_url: "https://drive.google.com/uc?export=view&id=1I3Y-R2hapLO-J7USyr9mIef_4H7YzqiC",
    team: {
      team_name: "Diamond Dogs",
      team_tag: "DD",
      logo_url: "https://drive.google.com/uc?export=view&id=1I3Y-R2hapLO-J7USyr9mIef_4H7YzqiC"
    }
  },
  {
    id: "team-throwers",
    team_name: "Team_Throwers",
    team_tag: "TKMF",
    logo_url: "https://drive.google.com/uc?export=view&id=158cryD2sMFrHtiGY5iVFjuyUkrbIpfsS",
    team: {
      team_name: "Team_Throwers",
      team_tag: "TKMF",
      logo_url: "https://drive.google.com/uc?export=view&id=158cryD2sMFrHtiGY5iVFjuyUkrbIpfsS"
    }
  },
  {
    id: "team-valo-boosters",
    team_name: "Valo Boosters",
    team_tag: "VBS",
    logo_url: "https://drive.google.com/uc?export=view&id=1E-_B6kHur9j3boFUMbcR84BlmS3LNV8s",
    team: {
      team_name: "Valo Boosters",
      team_tag: "VBS",
      logo_url: "https://drive.google.com/uc?export=view&id=1E-_B6kHur9j3boFUMbcR84BlmS3LNV8s"
    }
  },
  {
    id: "team-losersgaming",
    team_name: "LosersGaming",
    team_tag: "LOSERS",
    logo_url: "https://drive.google.com/uc?export=view&id=1AZJoFehRKkvwxDuMuEZOVrJdi5ZOVFfh",
    team: {
      team_name: "LosersGaming",
      team_tag: "LOSERS",
      logo_url: "https://drive.google.com/uc?export=view&id=1AZJoFehRKkvwxDuMuEZOVrJdi5ZOVFfh"
    }
  },
  {
    id: "team-egopeekers",
    team_name: "EGOPEEKERS",
    team_tag: "EGO",
    logo_url: "https://drive.google.com/uc?export=view&id=180vcRWr_6FUCz2a-dEsV737kIYXsceeu",
    team: {
      team_name: "EGOPEEKERS",
      team_tag: "EGO",
      logo_url: "https://drive.google.com/uc?export=view&id=180vcRWr_6FUCz2a-dEsV737kIYXsceeu"
    }
  },
  {
    id: "team-ppeeks",
    team_name: "PPeeks",
    team_tag: "PPeeks",
    logo_url: "https://drive.google.com/uc?export=view&id=12XaFdF2TATny9KwAGyXCP2T3TqmCIz9c",
    team: {
      team_name: "PPeeks",
      team_tag: "PPeeks",
      logo_url: "https://drive.google.com/uc?export=view&id=12XaFdF2TATny9KwAGyXCP2T3TqmCIz9c"
    }
  },
  {
    id: "team-eternity-esports",
    team_name: "Eternity Esports",
    team_tag: "Eternity",
    logo_url: "https://drive.google.com/uc?export=view&id=1KlO3JSy29_da7Fa0c-HWq5VD3QffZPXL",
    team: {
      team_name: "Eternity Esports",
      team_tag: "Eternity",
      logo_url: "https://drive.google.com/uc?export=view&id=1KlO3JSy29_da7Fa0c-HWq5VD3QffZPXL"
    }
  },
  {
    id: "team-aimgodz",
    team_name: "Aimgodz",
    team_tag: "AIMGOD",
    logo_url: "https://drive.google.com/uc?export=view&id=1gobCM-hFrpfgqLtLNa41N-HnLf8YiZez",
    team: {
      team_name: "Aimgodz",
      team_tag: "AIMGOD",
      logo_url: "https://drive.google.com/uc?export=view&id=1gobCM-hFrpfgqLtLNa41N-HnLf8YiZez"
    }
  }
];
