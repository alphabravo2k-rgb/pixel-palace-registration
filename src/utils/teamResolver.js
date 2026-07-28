/**
 * Reusable Team Resolver Utility
 * Resolves a team from the Google Apps Script registration list against a Flux team reference.
 * 
 * Normalized Matching:
 * Lowercases, trims, and removes hyphens, underscores, spaces, and special punctuation
 * so "Pixel Wolves", "Pixel-Wolves", "pixelwolves", "PIXEL_WOLVES" all match seamlessly.
 * 
 * Resolution Hierarchy:
 * 1. registrationId
 * 2. teamId / id
 * 3. Tag
 * 4. Name
 * 5. null (TBD)
 */

export function normalizeString(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // removes spaces, hyphens, underscores, punctuation
}

export function resolveTeam(fluxTeam, gasTeams = []) {
  if (!fluxTeam || !Array.isArray(gasTeams)) return null;

  if (typeof fluxTeam === 'object') {
    const regId = normalizeString(fluxTeam.registrationId || fluxTeam.regId);
    const teamId = normalizeString(fluxTeam.id || fluxTeam.teamId);
    const tag = normalizeString(fluxTeam.tag);
    const name = normalizeString(fluxTeam.name);

    // Priority 1: registrationId
    if (regId) {
      const match = gasTeams.find(t => normalizeString(t.registrationId) === regId);
      if (match) return match;
    }

    // Priority 2: teamId / id
    if (teamId) {
      const match = gasTeams.find(t => normalizeString(t.id || t.teamId) === teamId);
      if (match) return match;
    }

    // Priority 3: Tag
    if (tag) {
      const match = gasTeams.find(t => normalizeString(t.tag) === tag);
      if (match) return match;
    }

    // Priority 4: Name
    if (name && name !== 'tbd' && name !== 'bye') {
      const match = gasTeams.find(t => normalizeString(t.name) === name);
      if (match) return match;
    }

    return null;
  }

  // String lookup fallback
  const cleanNorm = normalizeString(fluxTeam);
  if (!cleanNorm || cleanNorm === 'tbd' || cleanNorm === 'bye') return null;

  return gasTeams.find(t => 
    normalizeString(t.registrationId) === cleanNorm ||
    normalizeString(t.id || t.teamId) === cleanNorm ||
    normalizeString(t.tag) === cleanNorm ||
    normalizeString(t.name) === cleanNorm
  ) || null;
}

/**
 * Returns team logo URL from GAS teams using resolution hierarchy, or fallback logo
 */
export function getTeamLogo(fluxTeam, gasTeams = []) {
  const resolved = resolveTeam(fluxTeam, gasTeams);
  if (resolved && resolved.logo && resolved.logo.startsWith('http')) {
    return resolved.logo;
  }
  if (typeof fluxTeam === 'object' && fluxTeam.logo && fluxTeam.logo.startsWith('http')) {
    return fluxTeam.logo;
  }
  return null;
}
