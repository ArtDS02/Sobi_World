// content/shared/weather.json — the weather of a game day (spec V2 §10, GĐ12): how likely each kind is in each season of the
// calendar, when a rainbow follows the rain, and the small gifts each kind brings. Weather only ever offers an opportunity.
import { z } from 'zod';
import { unit } from '../fields';

const weight = z.number().finite().min(0);
const row = z.strictObject({ sunny: weight, rainy: weight, foggy: weight, snowy: weight });

export const weatherFileSchema = z.strictObject({
  /** Relative weight of each base weather in a season of the calendar (Vietnamese seasons, core/config/seasons). */
  weights: z.strictObject({ spring: row, summer: row, autumn: row, winter: row }),
  /** The day after a rainy day: a sunny or foggy one turns into a rainbow with this chance. */
  rainbow: z.strictObject({ afterRainChance: unit }),
  effects: z.strictObject({
    /** A rainy day waters every crop and makes it grow this much faster. */
    rain: z.strictObject({ growthRate: z.number().finite().min(1).max(3) }),
    /** Rain at night: the rarer the fish, the more it bites (multiplies the rod's luck for rare fish). */
    rainNight: z.strictObject({ rareLuck: z.number().finite().min(1).max(5) }),
    /** Fog: the fish bite easier (added to the cast's score). */
    fog: z.strictObject({ biteBonus: unit }),
    /** A rainbow: percentage points added to the mutation chance of every litter and clutch (a flower gives 3–8). */
    rainbow: z.strictObject({ mutationBoost: z.number().finite().min(0).max(25) }),
  }),
}).superRefine((f, ctx) => {
  for (const [season, w] of Object.entries(f.weights)) {
    if (w.sunny + w.rainy + w.foggy + w.snowy <= 0) ctx.addIssue({ code: 'custom', message: `weights.${season}: no weather can happen` });
  }
});
