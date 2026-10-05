// content/shared/achievements.json — long-term goals (spec §20.4, DECISIONS PG-2): reached when a metric
// meets its target, claimed in the achievements panel. Ids are never removed (saves keep claims).
import { z } from 'zod';
import { STAT_ID_VALUES } from '../vocab';
import { nonNeg, posInt } from '../fields';

/** A stat counter, or a value read from the save. */
export const ACHIEVEMENT_METRIC_VALUES = [...STAT_ID_VALUES, 'discovered', 'level', 'slots', 'decor'] as const;

export const achievementSchema = z.strictObject({
  id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  metric: z.enum(ACHIEVEMENT_METRIC_VALUES),
  /** Target value; 'ALL' = every species that can be discovered, or every decoration. */
  target: z.union([posInt, z.literal('ALL')]),
  gold: nonNeg,
  xp: nonNeg,
});

export const achievementsFileSchema = z.strictObject({ achievements: z.array(achievementSchema) });
