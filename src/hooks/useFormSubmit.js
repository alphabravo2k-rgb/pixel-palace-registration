import { useState } from 'react';
import { submitRegistration, fetchTournamentSlots } from '../services/sheets';
import { CanonicalSchema } from '../schemas/canonical';
import { transformToCanonical } from '../utils/dataFixer';
import { tournaments } from '../config/tournaments';
import {
  getOrCreateSubmissionId,
  clearSubmissionId,
  saveDraft,
  clearDraft,
  getSessionUuid,
  clearSessionUuid,
  clearRevision,
} from '../utils/idempotency';
// checkBanStatus removed for security.

/**
 * Form submission hook.
 *
 * Accepts formData from react-hook-form (the validated `players[]` shape),
 * transforms it to the canonical structure, validates the canonical payload
 * against the Zod schema, then submits via the gateway.
 *
 * Idempotency: submission_id is generated once and stored in sessionStorage.
 * It is cleared only on confirmed success (200 OK). On failure, the same key
 * is reused on retry — preventing duplicate rows from duplicate POSTs.
 */
export const useFormSubmit = (tournamentId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * @param {object} formData - Validated output from react-hook-form
   */
  const submit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    const tournament = tournaments.find((t) => t.id === tournamentId);
    const sessionUuid = getSessionUuid(tournamentId);
    const lockOwner = localStorage.getItem(`pp_lock_owner_${tournamentId}`);
    let revision = parseInt(localStorage.getItem(`pp_revision_${tournamentId}`)) || 1;

    try {
      if (!tournament) throw new Error(`Tournament "${tournamentId}" not found.`);

      // ── Save draft in case of failure (via idempotency.js helper) ───────
      saveDraft(tournamentId, formData);

      // ── 1. FSM Transition: VALIDATING ────────────────────────────────────
      if (sessionUuid && tournament.sessionManagementEnabled) {
        try {
          await saveDraftToSheets(tournamentId, {
            sessionUuid,
            lockOwner,
            draftStatus: 'STATUS_VALIDATING',
            formData: JSON.stringify(formData),
            currentRevision: revision,
            tournamentId,
            teamName: formData.teamName,
            p1IGN: formData.players?.[0]?.ign,
            p1Discord: formData.players?.[0]?.discord,
            p1Faceit: formData.players?.[0]?.faceit,
            p1Steam64: formData.players?.[0]?.steam64
          });
        } catch (e) {
          console.warn("Failed to transition to VALIDATING", e);
        }
      }

      // ── Idempotency: reuse or generate submission_id ───────────────────
      const submissionId = getOrCreateSubmissionId(tournamentId);

      // ── Transform form output → canonical structure ────────────────────
      const canonicalData = transformToCanonical(tournament, formData, submissionId, sessionUuid);

      // ── Validate canonical structure before touching the network ───────
      const validation = CanonicalSchema.safeParse(canonicalData);
      if (!validation.success) {
        const messages = validation.error.errors.map((e) => e.message).join(' · ');
        throw new Error(`Validation failed: ${messages}`);
      }

      // ── Final Race Condition Check against authoritative state ─────────
      try {
        const liveSlots = await fetchTournamentSlots(tournamentId);
        if (liveSlots && liveSlots.registration && !liveSlots.registration.isAcceptingRegistrations) {
           const reason = liveSlots.registration.closedReason || 'Registration closed';
           const message = reason === 'SLOT_LIMIT_REACHED'
             ? 'Tournament filled up while you were registering. Verification failed.'
             : 'Registration closed before submission could be processed.';
           throw new Error(message);
        }
      } catch (e) {
        if (e.message.includes('filled up') || e.message.includes('Registration closed')) throw e;
        console.warn("[Gateway] State check failed, proceeding with caution", e);
      }

      // ── 2. FSM Transition: SUBMITTING ────────────────────────────────────
      if (sessionUuid && tournament.sessionManagementEnabled) {
        try {
          revision++;
          await saveDraftToSheets(tournamentId, {
            sessionUuid,
            lockOwner,
            draftStatus: 'STATUS_SUBMITTING',
            formData: JSON.stringify(formData),
            currentRevision: revision,
            tournamentId,
            teamName: formData.teamName,
            p1IGN: formData.players?.[0]?.ign,
            p1Discord: formData.players?.[0]?.discord,
            p1Faceit: formData.players?.[0]?.faceit,
            p1Steam64: formData.players?.[0]?.steam64
          });
          localStorage.setItem(`pp_revision_${tournamentId}`, revision);
        } catch (e) {
          console.warn("Failed to transition to SUBMITTING", e);
        }
      }

      // ── Submit via gateway ─────────────────────────────────────────────
      await submitRegistration(tournamentId, validation.data);

      // ── Success: clear idempotency key, draft, session & revision ──────
      clearSubmissionId(tournamentId);
      clearDraft(tournamentId);
      clearSessionUuid(tournamentId);
      clearRevision(tournamentId);
      setIsSuccess(true);
      return { success: true, submissionId };
    } catch (err) {
      // ── 3. Rollback: Transition state back to ACTIVE ───────────────────────
      if (sessionUuid && tournament?.sessionManagementEnabled) {
        try {
          revision++;
          await saveDraftToSheets(tournamentId, {
            sessionUuid,
            lockOwner,
            draftStatus: 'STATUS_ACTIVE',
            formData: JSON.stringify(formData),
            currentRevision: revision,
            tournamentId,
            teamName: formData.teamName,
            p1IGN: formData.players?.[0]?.ign,
            p1Discord: formData.players?.[0]?.discord,
            p1Faceit: formData.players?.[0]?.faceit,
            p1Steam64: formData.players?.[0]?.steam64
          });
          localStorage.setItem(`pp_revision_${tournamentId}`, revision);
        } catch (e) {
          console.warn("Failed to roll back to ACTIVE", e);
        }
      }

      // ── Bug #8: Dead-Letter Queue ──────────────────────────────────────
      // If we failed after all gateway retries, persist the final
      // canonical payload for cross-session recovery.
      const isFatal = err.message.includes('Validation failed') || err.message.includes('not found');
      if (!isFatal) {
        try {
          const tournament = tournaments.find((t) => t.id === tournamentId);
          const canonicalData = transformToCanonical(tournament, formData, getOrCreateSubmissionId(tournamentId));
          localStorage.setItem(`pp_dlq_${tournamentId}`, JSON.stringify({
             payload: canonicalData,
             formData: formData, // Store original for draft restoration
             timestamp: new Date().toISOString(),
             teamName: formData.teamName
          }));
        } catch (e) {
          console.error("Failed to save to Dead-Letter Queue:", e);
        }
      }

      setError(err.message ?? 'An unexpected error occurred. Please retry.');
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setIsSubmitting(false);
    setError(null);
    setIsSuccess(false);
  };

  return { submit, isSubmitting, error, isSuccess, reset };
};
