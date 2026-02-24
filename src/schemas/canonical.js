import { z } from 'zod';

export const RosterPlayerSchema = z.object({
  discord: z.string().optional(),
  steam: z.string().optional(),
  faceit: z.string().optional(),
  rank: z.string().optional()
});

export const CanonicalSchema = z.object({
  submission_id: z.string(),
  tournament_id: z.string(),
  team: z.object({
    team_name: z.string().min(1, "Team name required"),
    team_tag: z.string(),
    region: z.string(),
    logo_url: z.string(),
    invite_code: z.string().optional()
  }),
  roster: z.array(RosterPlayerSchema),
  metadata: z.object({
    submitted_at: z.string(),
    source: z.literal("portal_v1"),
    schema_version: z.literal("1.0"),
    sub_included: z.boolean()
  })
});
