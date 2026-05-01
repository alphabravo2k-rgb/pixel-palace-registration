import { z } from 'zod';

// ─── Player Role ──────────────────────────────────────────────────────────────
// Maps to a PostgreSQL ENUM column in Phase 2.
export const PlayerRole = z.enum(['CAPTAIN', 'PARTNER', 'STARTER', 'SUBSTITUTE']);

// ─── Roster Player ────────────────────────────────────────────────────────────
// Each player has a stable UUID for Phase 2 relational lookups.
export const RosterPlayerSchema = z.object({
  player_id: z.string().uuid('player_id must be a valid UUID'),
  role: PlayerRole,
  ign: z.string().min(1, 'IGN is required'),
  discord: z.string().min(1, 'Discord handle is required'),
  steam: z.string().min(1, 'Steam URL is required'),
  steam64: z.string().optional().default(''),
  faceit: z.string().min(1, 'FACEIT URL is required'),
  faceitLevel: z.string().default('N/A'),
  faceitElo: z.string().default('N/A'),
  cs2RankLabel: z.string().default('Not Linked'),
});

// ─── Canonical Submission ─────────────────────────────────────────────────────
// This is the ONE true shape. The Google Sheets adapter flattens it.
// The Supabase adapter inserts it as-is (roster as JSONB).
export const CanonicalSchema = z.object({
  submission_id: z.string().uuid('submission_id must be a valid UUID'),
  tournament_id: z.string().min(1),
  team: z.object({
    team_name: z
      .string()
      .min(2, 'Team name must be at least 2 characters')
      .max(64, 'Team name must be under 64 characters')
      .regex(/^[\w\s\-'.!]+$/u, 'Team name contains restricted characters'),
    team_tag: z
      .string()
      .min(1, 'Team tag is required')
      .max(8, 'Tag must be 8 chars or less')
      .regex(/^[A-Za-z0-9]+$/, 'Tag must be alphanumeric'),
    region: z.string().min(1, 'Region is required'),
    logo_url: z.string().min(1, 'Logo URL is required'),
    invite_code: z.string().optional().default(''),
    wallet_address: z.string().min(26, "Invalid wallet address").max(64, "Wallet address too long").optional().or(z.literal('')),
  }),
  roster: z.array(RosterPlayerSchema).min(1, 'At least one player is required'),
  metadata: z.object({
    submitted_at: z.string().datetime(),
    source: z.literal('portal_v1'),
    schema_version: z.literal('1.1'),
    sub_included: z.boolean(),
    status: z.string().default('VERIFIED'),
  }),
});
