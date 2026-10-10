// content/shared/achievements.json — long-term goals (spec V2 §9, GAME_BALANCE §8): reached when a metric meets
// its target, claimed in the goals panel for Gems. Ids are never removed (saves keep claims).
import { z } from 'zod';
import { STAT_ID_VALUES } from '../vocab';
import { nonNeg, posInt } from '../fields';

/** A stat counter of progression.stats, or a value of the world: its level or its Codex. */
export const ACHIEVEMENT_METRIC_VALUES = [...STAT_ID_VALUES, 'worldLevel', 'codex', 'codexBreed', 'codexCrop', 'codexItem', 'codexFish', 'codexFlower'] as const;

export const achievementSchema = z.strictObject({
  id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  metric: z.enum(ACHIEVEMENT_METRIC_VALUES),
  /** Target value; 'ALL' = every entry the world offers for that metric (every species, every decoration…). */
  target: z.union([posInt, z.literal('ALL')]),
  /** 5-30 Gems each (GAME_BALANCE §8). */
  gems: posInt.max(30),
  xp: nonNeg,
});

export const achievementsFileSchema = z
  .strictObject({ achievements: z.array(achievementSchema) })
  .superRefine((f, ctx) => {
    const ids = f.achievements.map((a) => a.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) ctx.addIssue({ code: 'custom', message: `duplicate achievement id ${dup}` });
  });
