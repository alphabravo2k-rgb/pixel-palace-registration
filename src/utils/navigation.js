/**
 * Simple Navigation Helper
 * Resolves match center URLs for public and admin views.
 */

export const matchCenter = (matchId, isAdmin = false) => {
  if (!matchId) return isAdmin ? '/admin/match-center' : '/match-center';
  return isAdmin ? `/admin/match-center/${matchId}` : `/match-center/${matchId}`;
};

export const brackets = () => '/register?tab=brackets';
