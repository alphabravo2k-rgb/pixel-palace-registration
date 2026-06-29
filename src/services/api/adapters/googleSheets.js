/**
 * GOOGLE SHEETS ADAPTER — Phase 1
 *
 * Responsibility: Flatten the canonical nested JSON into a flat key-value
 * map that Google Apps Script can unpack from a single POST body.
 *
 * PHASE 2 MIGRATION:
 *   This entire file is superseded by src/services/api/adapters/supabase.js
 *   The supabase adapter inserts the canonical payload directly as-is.
 *   roster → stored as a JSONB column, no flattening required.
 *   Remove this adapter and update client.js accordingly.
 */

/**
 * Converts the normalized canonical payload into a flat record for Sheets.
 *
 * Input (canonical roster):
 *   roster: [{ player_id, role, discord, steam, faceit, rank }]
 *
 * Output (flat columns):
 *   p1Discord, p1Steam, p1Faceit, p1Rank, p1Role
 *   p2Discord, p2Steam, p2Faceit, p2Rank, p2Role
 *   ...
 *
 * @param {import('../../schemas/canonical').CanonicalSchema} canonicalPayload
 * @returns {Record<string, string | boolean>}
 */
export const flattenForSheets = (canonicalPayload) => {
  const { submission_id, tournament_id, team, roster, metadata } = canonicalPayload;

  const flat = {
    submission_id,
    tournament_id,
    submitted_at: metadata.submitted_at,
    sub_included: metadata.sub_included,
    status: metadata.status, // ADDED for Soft Bans

    // Team fields
    team_name: team.team_name,
    team_tag: team.team_tag,
    region: team.region,
    logo_url: team.logo_url,
    invite_code: team.invite_code ?? '',
  };

  // Flatten roster array → p1Discord, p2Discord, etc.
  roster.forEach((player, idx) => {
    const n = idx + 1;
    flat[`p${n}Role`]         = player.role;
    flat[`p${n}Id`]           = player.player_id;
    flat[`p${n}IGN`]          = player.ign;
    flat[`p${n}Discord`]      = player.discord;
    flat[`p${n}Steam`]        = player.steam;
    flat[`p${n}Steam64`]      = player.steam64;
    flat[`p${n}Faceit`]       = player.faceit;
    flat[`p${n}FaceitLevel`]  = player.faceitLevel;
    flat[`p${n}FaceitElo`]    = player.faceitElo;
    flat[`p${n}CS2Rank`]      = player.cs2RankLabel;
    flat[`p${n}Avatar`]       = player.avatar;
    
    // Legacy support for backend script if it strictly looks for "Rank" instead of "FaceitLevel"
    flat[`p${n}Rank`]         = player.faceitLevel;
  });

  return flat;
};
