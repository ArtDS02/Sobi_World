// content/cloud/tiers.json and content/garden/zones.json — the upgrade tiers of a cloud tier / garden zone (decision 056).
// Five tiers (1 = what everyone starts with); each step of `steps` raises a group by one tier.
import { z } from 'zod';
import { itemId, nonNeg, posInt, unit } from '../fields';

export const plotTiersFileSchema = z
  .strictObject({
    /** Id of each tier, 1..5 (the display names are in the string tables under the id). */
    ids: z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)).min(2),
    /** Price of group g (0-based: the first cloud tier / garden zone is 0) = round(baseCoins x (1 + groupFactor x g)). */
    groupFactor: nonNeg,
    /** One-off XP of an upgrade = xpPerTier x the new tier. */
    xpPerTier: nonNeg,
    /** Top-rank perk (Cloud): the chance a plot is watered without spending pure water. Absent = none. */
    freeWaterChance: unit.optional(),
    /** `steps[n]` raises a group from tier n + 1 to n + 2: the world level, the coins for group 0, the items and the yield bonus it gives (percent). */
    steps: z
      .array(
        z.strictObject({
          worldLevel: posInt,
          baseCoins: nonNeg,
          items: z.partialRecord(itemId, posInt),
          bonusPct: nonNeg.max(100),
        }),
      )
      .min(1),
  })
  .superRefine((f, ctx) => {
    if (f.steps.length !== f.ids.length - 1) ctx.addIssue({ code: 'custom', message: 'steps needs one entry per tier above the first' });
    f.steps.forEach((s, i) => {
      const prev = f.steps[i - 1];
      if (prev && (s.worldLevel < prev.worldLevel || s.bonusPct <= prev.bonusPct)) {
        ctx.addIssue({ code: 'custom', message: `steps[${i}]: world level must not fall and the bonus must rise` });
      }
    });
  });
