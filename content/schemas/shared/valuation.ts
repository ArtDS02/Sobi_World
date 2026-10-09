// content/shared/valuation.json — the factors of a creature's value that are not its species or its
// quality (GAME_BALANCE §2.5): weight cap, the price lost while ill, the day's market.
import { z } from 'zod';
import { nonNeg, unit } from '../fields';

export const valuationFileSchema = z.strictObject({
  /** Weight factor = weight / the species' standard weight, at most this. */
  weightCap: z.number().min(1),
  /** −perDay of the price for each day ill, never below floor; treated or recovered = full price. */
  healthPenalty: z.strictObject({ perDay: unit, floor: unit }),
  /** Market factor of a day: one entry drawn per game day by weight (0.9 / 1.0 / 1.2). */
  market: z.array(z.strictObject({ factor: z.number().positive(), weight: nonNeg })).min(1),
});
