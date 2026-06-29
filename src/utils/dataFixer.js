/**
 * DATA TRANSFORMER — Form Output → Canonical Schema
 *
 * Converts react-hook-form output (which uses a `players[]` array) into
 * the CanonicalSchema shape expected by client.js and validated by Zod.
 *
 * The form's `players` array has this shape (from useFieldArray):
 *   [{ discord, steam, faceit, rank }, ...]
 *
 * The canonical `roster` array has this shape:
 *   [{ player_id (UUID), role (ENUM), discord, steam, faceit, rank }, ...]
 */

/**
 * Derive a canonical role from the player's array index plus tournament config.
 *
 * @param {number} idx - Zero-based index in the players array
 * @param {number} coreCount - tournament.playersPerTeam
 * @returns {'CAPTAIN'|'PARTNER'|'STARTER'|'SUBSTITUTE'}
 */
const deriveRole = (idx, coreCount) => {
  if (idx === 0) return 'CAPTAIN';
  if (idx >= coreCount) return 'SUBSTITUTE';
  // 2v2 format: second core player is PARTNER instead of STARTER
  if (coreCount === 2) return 'PARTNER';
  return 'STARTER';
};

/**
 * @param {import('../config/tournaments').Tournament} tournament
 * @param {object} formData - react-hook-form validated output
 * @param {string} [submissionId] - Pre-generated UUID (from sessionStorage)
 * @returns {import('../schemas/canonical').CanonicalSchema}
 */
export const transformToCanonical = (tournament, formData, submissionId) => {
  const {
    inviteCode = '',
    teamName,
    teamTag,
    teamRegion,
    logoLink,
    players = [],
  } = formData;

  const coreCount = tournament.playersPerTeam ?? 5;

  // Generate stable UUIDs for each roster player.
  const roster = players
    .filter((p) => p.discord?.trim() || p.steam?.trim())
    .map((p, idx) => {
      const role = deriveRole(idx, coreCount);
      return {
        player_id: crypto.randomUUID(),
        role,
        ign: p.ign?.trim() ?? '',
        discord: p.discord?.trim() ?? '',
        steam: p.steam?.trim() ?? '',
        steam64: p.steam64?.trim() ?? '',
        faceit: p.faceit?.trim() ?? '',
        faceitLevel: p.faceitLevel !== undefined ? String(p.faceitLevel) : 'N/A',
        faceitElo: p.faceitElo !== undefined ? String(p.faceitElo) : 'N/A',
        cs2RankLabel: p.cs2RankLabel ?? 'Not Linked',
        avatar: p.avatar?.trim() ?? '',
        // Collect wallet address only if provided (typically only for Captain/Role via form)
        wallet_address: p.walletAddress?.trim() ?? '',
      };
    });

  const hasEntryFee = (tournament.entryFee ?? 0) > 0;

  return {
    submission_id: submissionId ?? crypto.randomUUID(),
    tournament_id: tournament.id,
    team: {
      team_name: teamName,
      team_tag: teamTag,
      region: teamRegion,
      logo_url: logoLink,
      invite_code: inviteCode,
    },
    roster,
    metadata: {
      submitted_at: new Date().toISOString(),
      source: 'portal_v1',
      schema_version: '1.1',
      sub_included: players.length > coreCount,
      status: 'VERIFIED',
      payment_status: hasEntryFee ? 'PENDING_PAYMENT' : 'NOT_REQUIRED',
      payment_tx_hash: '',
      payment_confirmed_at: undefined,
    },
  };
};
