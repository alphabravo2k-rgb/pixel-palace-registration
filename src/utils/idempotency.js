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

// ─── Registration Session UUID Storage Helpers (LocalStorage) ──────────────
const sessionUuidKey = (tournamentId) => `pp_session_uuid_${tournamentId}`;
const revisionKey = (tournamentId) => `pp_revision_${tournamentId}`;

export const getSessionUuid = (tournamentId) => {
  try {
    return localStorage.getItem(sessionUuidKey(tournamentId));
  } catch {
    return null;
  }
};

export const setSessionUuid = (tournamentId, uuid) => {
  try {
    localStorage.setItem(sessionUuidKey(tournamentId), uuid);
  } catch (e) {
    console.error("Failed to write Session UUID to localStorage:", e);
  }
};

export const clearSessionUuid = (tournamentId) => {
  try {
    localStorage.removeItem(sessionUuidKey(tournamentId));
  } catch (e) {
    console.error("Failed to clear Session UUID:", e);
  }
};

export const getRevision = (tournamentId) => {
  try {
    const rev = localStorage.getItem(revisionKey(tournamentId));
    return rev ? parseInt(rev, 10) : 0;
  } catch {
    return 0;
  }
};

export const incrementRevision = (tournamentId) => {
  try {
    const nextRev = getRevision(tournamentId) + 1;
    localStorage.setItem(revisionKey(tournamentId), String(nextRev));
    return nextRev;
  } catch {
    return 1;
  }
};

export const clearRevision = (tournamentId) => {
  try {
    localStorage.removeItem(revisionKey(tournamentId));
  } catch {}
};
