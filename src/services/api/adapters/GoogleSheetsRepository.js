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
    if (!endpoint) {
      return { teams: [] };
    }

    try {
      const res = await fetch(`${endpoint}?endpoint=/api/v1/getTeams&action=getTeams&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Tracker offline");
      return res.json();
    } catch (err) {
      console.error("[GoogleSheetsRepository] getRegistrations failed:", err);
      return { teams: [], error: true };
    }
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
      return { inviteConfirmed: 12, openConfirmed: 30, isFull: false };
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
}
