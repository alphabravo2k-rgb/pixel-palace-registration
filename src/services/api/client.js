/**
 * API GATEWAY
 *
 * This is the ONLY file the UI touches for data submission and lookup.
 * The UI has zero knowledge of Google Sheets, Supabase, or any specific persistence layer.
 * All operations are delegated to the RegistrationRepository adapter.
 */

import { GoogleSheetsRepository } from './adapters/GoogleSheetsRepository';
import { tournaments } from '../../config/tournaments';

const repository = new GoogleSheetsRepository();

/**
 * Notifies the staff Discord channel about a new registration.
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
 * Submit a canonical registration payload to the repository adapter.
 *
 * @param {string} tournamentId
 * @param {import('../../schemas/canonical').CanonicalSchema} canonicalPayload
 * @returns {Promise<{ success: boolean }>}
 */
export const submitToGateway = async (tournamentId, canonicalPayload) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) {
    throw new Error(`Tournament "${tournamentId}" not found in config.`);
  }

  // Soft Ban Check
  if (tournament.softBanEnabled) {
    try {
      const steamIds = canonicalPayload.roster.map(p => p.steam64).filter(Boolean);
      if (steamIds.length > 0) {
        const banRes = await repository.checkBans(tournamentId, steamIds);
        if (banRes.hasBans) {
          canonicalPayload.metadata.status = 'PENDING REVIEW';
        }
      }
    } catch (e) {
      console.warn("[Gateway] Soft ban check failed, proceeding safely", e);
    }
  }

  // Delegate creation to persistence repository adapter
  const result = await repository.createRegistration(tournamentId, canonicalPayload);
  
  if (result.success) {
    notifyStaffWebhook(tournament, canonicalPayload.team);
  }
  
  return result;
};

/**
 * Live invite code validation.
 */
export const validateCode = async (tournamentId, code) => {
  return repository.validateInviteCode(tournamentId, code);
};

/**
 * Fetch live slot counters.
 */
export const fetchSlots = async (tournamentId) => {
  return repository.fetchSlots(tournamentId);
};

/**
 * Fetch live roster (team list).
 */
export const fetchTeams = async (tournamentId) => {
  return repository.getRegistrations(tournamentId);
};

/**
 * Fetch Bracket data.
 */
export const fetchBracket = async (tournamentId) => {
  return repository.fetchBracket(tournamentId);
};

/**
 * Track team registration by submission or registration ID.
 */
export const trackRegistration = async (tournamentId, searchId, secondaryId) => {
  return repository.trackRegistration(tournamentId, searchId, secondaryId);
};
