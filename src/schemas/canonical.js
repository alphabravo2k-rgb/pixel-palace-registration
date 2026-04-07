import { z } from 'zod';

// ─── Player Role ──────────────────────────────────────────────────────────────
// Maps to a PostgreSQL ENUM column in Phase 2.
export const PlayerRole = z.enum(['CAPTAIN', 'PARTNER', 'STARTER', 'SUBSTITUTE']);

// ─── Roster Player ────────────────────────────────────────────────────────────
// Each player has a stable UUID for Phase 2 relational lookups.
export const RosterPlayerSchema = z.object({
  player_id: z.string().uuid('player_id must be a valid UUID'),
  role: PlayerRole,
  discord: z.string().min(1, 'Discord handle is required'),
  steam: z.string().min(1, 'Steam URL is required'),
  faceit: z.string().min(1, 'FACEIT URL is required'),
  rank: z.string().default('5'),
});

// ─── Canonical Submission ─────────────────────────────────────────────────────
// This is the ONE true shape. The Google Sheets adapter flattens it.
// The Supabase adapter inserts it as-is (roster as JSONB).
export const CanonicalSchema = z.object({
  submission_id: z.string().uuid('submission_id must be a valid UUID'),
  tournament_id: z.string().min(1),
  team: z.object({
    team_name: z.string().min(1, 'Team name is required'),
    team_tag: z
      .string()
      .min(1, 'Team tag is required')
      .regex(/^[A-Za-z0-9]+$/, 'Tag must be alphanumeric'),
    region: z.string().min(1, 'Region is required'),
    logo_url: z.string().min(1, 'Logo URL is required'),
    invite_code: z.string().optional().default(''),
  }),
  roster: z.array(RosterPlayerSchema).min(1, 'At least one player is required'),
  metadata: z.object({
    submitted_at: z.string().datetime(),
    source: z.literal('portal_v1'),
    schema_version: z.literal('1.0'),
    sub_included: z.boolean(),
  }),
});
