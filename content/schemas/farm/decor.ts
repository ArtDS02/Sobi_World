// content/farm/decor.json — farm decorations (DECISIONS PG-3): a coin sink that adds a small happiness
// bonus to every pig; each shows on the farm at its layout placement. Ids are never removed.
import { z } from 'zod';
import { assetId, decorId, nonNeg, posInt } from '../fields';

export const decorFileSchema = z.strictObject({
  decor: z.array(
    z.strictObject({
      id: decorId,
      /** Artwork id in the manifest. */
      artId: assetId,
      priceGold: nonNeg,
      unlockLevel: posInt,
      /** Happiness points added to every pig while owned. */
      happyBonus: nonNeg,
    }),
  ),
});
