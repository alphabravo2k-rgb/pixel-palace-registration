/**
 * API GATEWAY — Phase 1: Google Sheets
 *
 * This is the ONLY file the UI touches for data submission.
 * The UI has zero knowledge of Google Sheets, Supabase, or any backend.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  PHASE 2 MIGRATION — SUPABASE                                       │
 * │                                                                      │
 * │  Step 1: Install @supabase/supabase-js                              │
 * │  Step 2: Create src/lib/supabase.js exporting the client            │
 * │  Step 3: In submitToGateway(), replace the fetch() block with:      │
 * │                                                                      │
 * │    import { supabase } from '../../lib/supabase';                   │
 * │                                                                      │
 * │    const { error } = await supabase                                 │
 * │      .from('registrations')                                          │
 * │      .insert({                                                       │
 * │        ...canonicalPayload,                                          │
 * │        roster: canonicalPayload.roster,  // JSONB column            │
 * │      });                                                             │
 * │    if (error) throw new Error(error.message);                       │
 * │    return { success: true };                                         │
 * │                                                                      │
 * │  Step 4: Delete the flattenForSheets import — not needed.           │
 * │  Step 5: No other files change. The UI is completely unaffected.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { flattenForSheets } from './adapters/googleSheets';
import { tournaments } from '../../config/tournaments';

/**
 * Submit a canonical registration payload to the configured storage backend.
 *
 * @param {import('../../schemas/canonical').CanonicalSchema} canonicalPayload
 * @param {string} tournamentId
 * @returns {Promise<{ success: boolean }>}
 */
export const submitToGateway = async (canonicalPayload, tournamentId) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament) {
    throw new Error(`Tournament "${tournamentId}" not found in config.`);
  }

  // ── Dev / Staging mock (no endpoint configured) ────────────────────────
  if (!tournament.sheetsEndpoint) {
    console.warn('[Gateway] No sheetsEndpoint. Returning mock success after 1.5s.');
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  }

  // ── Phase 1: Flatten for Google Sheets adapter ─────────────────────────
  const flatPayload = flattenForSheets(canonicalPayload);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(tournament.sheetsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(flatPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Network error: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    return { success: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out (30s). Please retry.');
    }
    throw err;
  }
};

/**
 * Live invite code validation — hits the Apps Script with a GET param.
 * Phase 2: Replace with supabase.rpc('validate_invite_code', { code }).
 *
 * @returns {Promise<{ valid: boolean }>}
 */
export const validateCode = async (tournamentId, code) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament?.sheetsEndpoint) {
    // Mock: only 'ADMIN' is valid in dev
    return new Promise((resolve) =>
      setTimeout(() => resolve({ valid: code.toUpperCase() === 'ADMIN' }), 800)
    );
  }

  const res = await fetch(
    `${tournament.sheetsEndpoint}?validateCode=${encodeURIComponent(code)}`
  );
  return res.json();
};

/**
 * Fetch live slot counters (invite vs open) from the Apps Script.
 * Phase 2: Replace with supabase.rpc('get_tournament_slots', { tournament_id }).
 *
 * @returns {Promise<{ inviteConfirmed: number, openConfirmed: number, isFull: boolean }>}
 */
export const fetchSlots = async (tournamentId) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament?.sheetsEndpoint) {
    // Mock data
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ inviteConfirmed: 12, openConfirmed: 30, isFull: false }),
        1000
      )
    );
  }

  const res = await fetch(
    `${tournament.sheetsEndpoint}?action=getSlots&t=${Date.now()}`
  );
  return res.json();
};
