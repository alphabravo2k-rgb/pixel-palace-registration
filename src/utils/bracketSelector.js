/**
 * Centralized Bracket Selector & Operational Fallback Decision Point
 * Resolves whether to display live Flux API matches or official published bracket poster dataset.
 */
import { ppcc2PublishedBracket } from '../data/temporary/ppcc2PublishedBracket.js';

// Operational feature flag - set to false so live API data is rendered
export const USE_PUBLISHED_BRACKET_FALLBACK = false;

/**
 * Helper to check if Flux API matches contain REAL seeded team assignments
 * (Filters out Flux placeholder test names like "TEAM 67", "TEAM 69", "FROM W-R1-P0")
 */
function hasSeededParticipants(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return false;

  return matches.some(m => {
    const t1 = typeof m.team1 === 'string' ? m.team1 : m.team1?.name;
    const t2 = typeof m.team2 === 'string' ? m.team2 : m.team2?.name;

    const isRealTeamName = (name) => {
      if (!name || typeof name !== 'string') return false;
      const clean = name.trim();
      if (clean === 'TBD' || clean === 'BYE') return false;
      if (clean.toUpperCase().startsWith('FROM W-') || clean.toUpperCase().startsWith('FROM ')) return false;
      if (/^TEAM\s+\d+$/i.test(clean)) return false; // Filter out Flux dummy "TEAM 53", "TEAM 67"
      return true;
    };

    return isRealTeamName(t1) || isRealTeamName(t2);
  });
}

/**
 * Single decision point used by BracketsTab and MatchCenterList
 */
export function resolveDisplayMatches(fluxMatches) {
  const isLiveSeeded = hasSeededParticipants(fluxMatches);

  if (isLiveSeeded || !USE_PUBLISHED_BRACKET_FALLBACK) {
    return {
      matches: fluxMatches || [],
      isSeeded: true
    };
  }

  return {
    matches: ppcc2PublishedBracket,
    isSeeded: false
  };
}
