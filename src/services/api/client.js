/**
 * API GATEWAY — Phase 1: Google Sheets
 *
 * This is the ONLY file the UI touches for data submission.
 * The UI has zero knowledge of Google Sheets, Supabase, or any backend.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  PHASE 2 MIGRATION — SUPABASE                                       │
 * │                                                                      │
 * │  Step 1: Install @supabase/supabase-js                              │
 * │  Step 2: Create src/lib/supabase.js exporting the client            │
 * │  Step 3: In submitToGateway(), replace the fetch() block with:      │
 * │                                                                      │
 * │    import { supabase } from '../../lib/supabase';                   │
 * │                                                                      │
 * │    const { error } = await supabase                                 │
 * │      .from('registrations')                                          │
 * │      .insert({                                                       │
 * │        ...canonicalPayload,                                          │
 * │        roster: canonicalPayload.roster,  // JSONB column            │
 * │      });                                                             │
 * │    if (error) throw new Error(error.message);                       │
 * │    return { success: true };                                         │
 * │                                                                      │
 * │  Step 4: Delete the flattenForSheets import — not needed.           │
 * │  Step 5: No other files change. The UI is completely unaffected.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { flattenForSheets } from './adapters/googleSheets';
import { tournaments } from '../../config/tournaments';

/**
 * Notifies the staff Discord channel about a new registration.
 * This bridges the trust gap by ensuring admins see submissions in real-time.
 */
const notifyStaffWebhook = async (tournament, teamData) => {
  const webhookUrl = tournament.discordStaffWebhook;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "🚀 New Team Registered",
          description: `**${teamData.team_name}** has joined **${tournament.name}**`,
          color: 0x00f0ff,
          fields: [
            { name: "Region", value: teamData.region, inline: true },
            { name: "Tag", value: teamData.team_tag, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (e) {
    console.warn("[Webhook] Failed to notify staff:", e);
  }
};

/**
 * Submit a canonical registration payload to the configured storage backend.
 *
 * @param {import('../../schemas/canonical').CanonicalSchema} canonicalPayload
 * @param {string} tournamentId
 * @returns {Promise<{ success: boolean }>}
 */
export const submitToGateway = async (tournamentId, canonicalPayload) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament) {
    throw new Error(`Tournament "${tournamentId}" not found in config.`);
  }

  // ── Dev / Staging mock (no endpoint configured) ────────────────────────
  if (!tournament.sheetsEndpoint) {
    console.warn('[Gateway] No sheetsEndpoint. Returning mock success after 1.5s.');
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  }

  // ── Soft Ban Check ───────────────────────────────────────────────────────
  if (tournament.softBanEnabled) {
    try {
      const steamIds = canonicalPayload.roster.map(p => p.steam64).filter(Boolean);
      if (steamIds.length > 0) {
        const banRes = await fetch(`${tournament.sheetsEndpoint}?endpoint=/api/v1/checkBans&action=checkBans&steamIds=${encodeURIComponent(steamIds.join(','))}`);
        if (banRes.ok) {
           const banData = await banRes.json();
           if (banData.hasBans) {
              canonicalPayload.metadata.status = 'PENDING REVIEW';
           }
        }
      }
    } catch (e) {
      console.warn("[Gateway] Soft ban check failed, proceeding safely", e);
    }
  }

  // ── Phase 1: Flatten for Google Sheets adapter ─────────────────────────
  const flatPayload = {
    ...flattenForSheets(canonicalPayload),
    endpoint: '/api/v1/register',
    _gateway_secret: import.meta.env.VITE_GATEWAY_AUTH_SECRET || ''
  };

  try {
    let attempt = 0;
    const maxRetries = 3;
    const delays = [2000, 5000, 12000];

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(tournament.sheetsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(flatPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
           // Don't retry on 4xx errors
           if (response.status >= 400 && response.status < 500) {
              throw new Error(`Client error: ${response.status}`);
           }
           throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Notify staff via webhook (async/fire-and-forget)
        notifyStaffWebhook(tournament, canonicalPayload.team);

        return { success: true, data };
      } catch (err) {
        clearTimeout(timeoutId);
        
        const isTimeout = err.name === 'AbortError' || err.message.includes('timed out');
        const isNetwork = err.name === 'TypeError'; // fetch throws TypeError on network failure

        if ((isTimeout || isNetwork) && attempt < maxRetries) {
          console.warn(`[Gateway] Attempt ${attempt + 1} failed. Retrying in ${delays[attempt]}ms...`, err);
          await new Promise(r => setTimeout(r, delays[attempt]));
          attempt++;
          continue;
        }
        
        // If we're here, we're out of retries or it's a fatal error
        if (isTimeout) throw new Error('Connection timed out after multiple retries. Please save your work and try later.');
        throw err;
      }
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Live invite code validation — hits the Apps Script with a GET param.
 * Phase 2: Replace with supabase.rpc('validate_invite_code', { code }).
 *
 * @returns {Promise<{ valid: boolean }>}
 */
export const validateCode = async (tournamentId, code) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament?.sheetsEndpoint) {
    // Mock: only 'ADMIN' is valid in dev
    return new Promise((resolve) =>
      setTimeout(() => resolve({ valid: code.toUpperCase() === 'ADMIN' }), 800)
    );
  }

  const res = await fetch(
    `${tournament.sheetsEndpoint}?endpoint=/api/v1/validateCode&validateCode=${encodeURIComponent(code)}&tournamentId=${encodeURIComponent(tournamentId)}`
  );
  return res.json();
};

/**
 * Fetch live slot counters (invite vs open) from the Apps Script.
 * Phase 2: Replace with supabase.rpc('get_tournament_slots', { tournament_id }).
 *
 * @returns {Promise<{ inviteConfirmed: number, openConfirmed: number, isFull: boolean }>}
 */
export const fetchSlots = async (tournamentId) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament?.sheetsEndpoint) {
    // Mock data
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ inviteConfirmed: 12, openConfirmed: 30, isFull: false }),
        1000
      )
    );
  }

  const res = await fetch(
    `${tournament.sheetsEndpoint}?endpoint=/api/v1/getSlots&action=getSlots&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`
  );
  return res.json();
};
/**
 * Fetch live roster (team list) from the Apps Script.
 * Phase 2: Replace with supabase.from('registrations').select('team_name, team_tag, logo_url').eq('tournament_id', tournamentId).
 *
 * @returns {Promise<{ teams: Array<{ name: string, tag: string, logo: string }> }>}
 */
export const fetchTeams = async (tournamentId) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament?.sheetsEndpoint) {
    // Mock data for dev
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ 
          teams: [
            { 
              name: "Natus Vincere", tag: "NAVI", logo: "https://i.imgur.com/yourlogo.png", status: "VERIFIED", averageElo: 2840,
              roster: [
                 { ign: "s1mple", faceitLevel: "10", faceitElo: "3100" },
                 { ign: "b1t", faceitLevel: "10", faceitElo: "2580" }
              ]
            },
            { 
              name: "Team Vitality", tag: "VIT", logo: "https://i.imgur.com/yourlogo2.png", status: "VERIFIED", averageElo: 2750,
              roster: [
                 { ign: "ZywOo", faceitLevel: "10", faceitElo: "3200" },
                 { ign: "Spinx", faceitLevel: "10", faceitElo: "2300" }
              ]
            }
          ] 
        }),
        1200
      )
    );
  }

  try {
    const res = await fetch(
      `${tournament.sheetsEndpoint}?endpoint=/api/v1/getTeams&action=getTeams&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`
    );
    if (!res.ok) throw new Error("Tracker offline");
    return res.json();
  } catch (err) {
    console.error("Tracker fetch failed:", err);
    return { teams: [], error: true };
  }
};

/**
 * Fetch Bracket data from the Apps Script.
 * @returns {Promise<{ bracketUrl: string, schedule: string[] }>}
 */
export const fetchBracket = async (tournamentId) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament?.sheetsEndpoint) {
    // Mock data for dev
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ 
           bracketUrl: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png", 
           schedule: ["Quarterfinals: 18:00 GST", "Semifinals: 20:00 GST", "Grand Finals: 22:00 GST"] 
        }),
        800
      )
    );
  }

  try {
    const res = await fetch(
      `${tournament.sheetsEndpoint}?action=getBracket&tournamentId=${encodeURIComponent(tournamentId)}&t=${Date.now()}`
    );
    if (!res.ok) throw new Error("Bracket offline");
    return res.json();
  } catch (err) {
    throw err;
  }
};
