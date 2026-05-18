/**
 * Per-tournament idempotency helpers.
 * The key is namespaced by tournamentId to prevent cross-tournament collisions.
 */
const idempKey = (tournamentId) => `pp_idemp_${tournamentId}`;
const draftKey = (tournamentId) => `pp_draft_${tournamentId}`;

export const getOrCreateSubmissionId = (tournamentId) => {
  const key = idempKey(tournamentId);
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
};

export const clearSubmissionId = (tournamentId) => {
  sessionStorage.removeItem(idempKey(tournamentId));
};

export const saveDraft = (tournamentId, formData) => {
  sessionStorage.setItem(draftKey(tournamentId), JSON.stringify(formData));
};

export const clearDraft = (tournamentId) => {
  sessionStorage.removeItem(draftKey(tournamentId));
};

export const getDraft = (tournamentId) => {
  try {
    const raw = sessionStorage.getItem(draftKey(tournamentId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
