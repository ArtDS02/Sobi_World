// content/shared/valuation.json — the factors of a creature's value that are not its species or its
// quality (GAME_BALANCE §2.5): weight cap, the price lost while ill, the day's market.
import { z } from 'zod';
import { posInt } from '../fields';
import { MARKET_GROUP_VALUES } from '../vocab';
import { unit } from '../fields';

export const valuationFileSchema = z.strictObject({
  /** Weight factor = weight / the species' standard weight, at most this. */
  weightCap: z.number().min(1),
  /** −perDay of the price for each day ill, never below floor; treated or recovered = full price. */
  healthPenalty: z.strictObject({ perDay: unit, floor: unit }),
  /** The day's market: `up.count` groups pay `up.factor`, the next `down.count` pay `down.factor`, the rest the plain price. */
  market: z
    .strictObject({
      up: z.strictObject({ count: posInt, factor: z.number().min(1) }),
      down: z.strictObject({ count: posInt, factor: z.number().positive().max(1) }),
    })
    .refine((m) => m.up.count + m.down.count <= MARKET_GROUP_VALUES.length, 'more groups than the market has'),
});
