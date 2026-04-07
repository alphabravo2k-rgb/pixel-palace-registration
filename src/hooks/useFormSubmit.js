import { useState } from 'react';
import { submitRegistration } from '../services/sheets';
import { CanonicalSchema } from '../schemas/canonical';
import { transformToCanonical } from '../utils/dataFixer';
import { tournaments } from '../config/tournaments';

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

      // ── Submit via gateway ─────────────────────────────────────────────
      await submitRegistration(tournamentId, validation.data);

      // ── Success: clear idempotency key ─────────────────────────────────
      sessionStorage.removeItem('pp_idemp_key');
      setIsSuccess(true);
      return { success: true };
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
