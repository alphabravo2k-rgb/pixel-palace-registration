import { useState } from 'react';
import { submitRegistration, fetchTournamentSlots } from '../services/sheets';
import { CanonicalSchema } from '../schemas/canonical';
import { transformToCanonical } from '../utils/dataFixer';
import { tournaments } from '../config/tournaments';
import { checkBanStatus } from '../config/bans';

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

    try {
      // ── Get tournament config ──────────────────────────────────────────
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (!tournament) throw new Error(`Tournament "${tournamentId}" not found.`);

      // ── Save draft in case of failure ──────────────────────────────────
      sessionStorage.setItem('pp_form_draft', JSON.stringify(formData));

      // ── Idempotency: reuse or generate submission_id ───────────────────
      let submissionId = sessionStorage.getItem('pp_idemp_key');
      if (!submissionId) {
        submissionId = crypto.randomUUID();
        sessionStorage.setItem('pp_idemp_key', submissionId);
      }

      // ── Transform form output → canonical structure ────────────────────
      const canonicalData = transformToCanonical(tournament, formData, submissionId);

      // ── Validate canonical structure before touching the network ───────
      const validation = CanonicalSchema.safeParse(canonicalData);
      if (!validation.success) {
        const messages = validation.error.errors.map((e) => e.message).join(' · ');
        throw new Error(`Validation failed: ${messages}`);
      }

      // ── Bug #9: Soft-Ban Cross-Check ───────────────────────────────────
      for (const p of formData.players) {
        const ban = checkBanStatus(p);
        if (ban) {
           throw new Error(`PLAYER_BANNED: Player "${p.ign || p.discord}" is restricted from participating. Reason: ${ban.reason}. Please contact support for appeals.`);
        }
      }

      // ── Bug #3: Final Race Condition Check ─────────────────────────────
      try {
        const liveSlots = await fetchTournamentSlots(tournamentId);
        if (liveSlots && liveSlots.isFull) {
           throw new Error('Tournament filled up while you were registering. Verification failed.');
        }
      } catch (e) {
        if (e.message.includes('filled up')) throw e;
        console.warn("[Gateway] Slot check failed, proceeding with caution", e);
      }

      // ── Submit via gateway ─────────────────────────────────────────────
      await submitRegistration(tournamentId, validation.data);

      // ── Success: clear idempotency key & draft ─────────────────────────
      sessionStorage.removeItem('pp_idemp_key');
      sessionStorage.removeItem('pp_form_draft');
      setIsSuccess(true);
      return { success: true, submissionId };
    } catch (err) {
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
