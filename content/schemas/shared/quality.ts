// content/shared/quality.json — Quality (spec §6, GAME_BALANCE §2.5): how well a creature was cared for,
// from its average mood over its life; separate from rarity. Not in prices before GĐ2.
import { z } from 'zod';
import { QUALITY_VALUES } from '../vocab';
import { nonNeg, unit } from '../fields';

const above = ['PERFECT', 'EXCELLENT', 'GREAT', 'GOOD'] as const;

export const qualityFileSchema = z
  .strictObject({
    /** Lowest average mood of each tier above NORMAL. */
    minMood: z.strictObject(Object.fromEntries(above.map((q) => [q, z.number().min(0).max(100)])) as Record<(typeof above)[number], z.ZodNumber>),
    priceFactor: z.strictObject(Object.fromEntries(QUALITY_VALUES.map((q) => [q, nonNeg])) as Record<(typeof QUALITY_VALUES)[number], typeof nonNeg>),
    /** From this many bond hearts a creature may reach one tier higher. */
    bond: z.strictObject({ minHearts: z.number().int().min(0).max(5), upgradeChance: unit }),
  })
  .refine((f) => above.every((q, i) => i === 0 || f.minMood[q] < f.minMood[above[i - 1]!]), 'minMood must decrease from PERFECT to GOOD');
