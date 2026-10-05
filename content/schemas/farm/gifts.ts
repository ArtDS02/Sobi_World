// content/farm/gifts.json — timed gift boxes on the farm (U06): one farm-wide timer; rarer herds wait
// a little longer but get more per box.
import { z } from 'zod';
import { RARITY_VALUES } from '../vocab';
import { nonNeg, posInt, unit } from '../fields';

const perRarity = z.strictObject(Object.fromEntries(RARITY_VALUES.map((r) => [r, nonNeg])) as Record<(typeof RARITY_VALUES)[number], typeof nonNeg>);

export const giftsFileSchema = z
  .strictObject({
    BASE_INTERVAL_MS: z.number().positive(),
    INTERVAL_FACTOR: perRarity,
    PIGS_PER_EXTRA_BOX: posInt,
    MAX_PER_SPAWN: posInt,
    MAX_ON_FARM: posInt,
    POWER: perRarity,
    BABY_SHARE: unit,
    GOLD_PER_POWER: nonNeg,
    XP_PER_POWER: nonNeg,
    VARIANCE: unit,
    MIN_GOLD: nonNeg,
    MAX_GOLD: nonNeg,
    MIN_XP: nonNeg,
    MAX_XP: nonNeg,
    MAX_STEPS: posInt,
  })
  .refine((g) => g.MIN_GOLD <= g.MAX_GOLD && g.MIN_XP <= g.MAX_XP, 'gift MIN_* must be <= MAX_*');
