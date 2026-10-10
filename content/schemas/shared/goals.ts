// content/shared/goals.json — the daily goals (spec V2 §9): three light goals a day, new at local midnight.
import { z } from 'zod';
import { STAT_ID_VALUES } from '../vocab';
import { nonNeg, posInt } from '../fields';

const range = z.tuple([nonNeg, nonNeg]).refine(([a, b]) => a <= b, 'range needs min <= max');

export const dailyTemplateSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  /** The counter in progression.stats it counts (the goal is "this many more today"). */
  metric: z.enum(STAT_ID_VALUES),
  /** The Area it belongs to: offered only once that Area is open. */
  area: z.string().regex(/^[a-z][a-z0-9_]*$/),
  fromWorldLevel: posInt,
  min: posInt,
  max: posInt,
  /** Reward range of coins (50-150, GAME_BALANCE §8), scaled by the target drawn. */
  coins: range,
});

export const goalsFileSchema = z
  .strictObject({
    daily: z.strictObject({
      count: posInt,
      /** Finishing every goal of the day. */
      bonus: z.strictObject({ xp: nonNeg, coins: nonNeg }),
      templates: z.array(dailyTemplateSchema).min(1),
    }),
  })
  .superRefine((f, ctx) => {
    const ids = f.daily.templates.map((t) => t.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) ctx.addIssue({ code: 'custom', message: `duplicate daily template ${dup}` });
    for (const t of f.daily.templates) if (t.min > t.max) ctx.addIssue({ code: 'custom', message: `template ${t.id}: min > max` });
  });
