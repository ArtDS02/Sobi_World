// content/farm/species.json — the pig species (UN_IN_PIG_CATALOGUE.md). Stats come from the rarity
// tier; a row only overrides what makes it different. Adding a species = one row here + `npm run
// content:ids` + one manifest row (the admin dashboard does all three, DECISIONS A7-1).
import { z } from 'zod';
import { FAMILY_VALUES, RARITY_VALUES, TRAIT_VALUES } from '../vocab';
import { assetId, breedId, color, nonNeg, posInt, text } from '../fields';

const tierSchema = z.strictObject({
  sellGold: nonNeg,
  growthSec: z.number().positive(),
  /** null = cannot breed (D10). */
  pregnancySec: z.number().positive().nullable(),
  maxWeight: z.number().positive(),
  breedable: z.boolean(),
});

const speciesRowSchema = z.strictObject({
  id: breedId,
  nameVi: text,
  rarity: z.enum(RARITY_VALUES),
  family: z.enum(FAMILY_VALUES),
  /** Its artwork: the manifest pig row with this id. */
  artId: assetId,
  /** Flat fill when the artwork is missing. */
  color,
  /** null / absent = cannot be bought, only bred. */
  buyGold: nonNeg.nullable().optional(),
  /** Farm level needed to buy it in the shop. */
  unlockLevel: posInt.optional(),
  /** false = retired: not sold, never bred; pigs already owned stay. */
  enabled: z.boolean().optional(),
  /** Gene tags (DECISIONS PS-2); empty = rarity and family alone. */
  traits: z.array(z.enum(TRAIT_VALUES)),
  ...tierSchema.partial().shape,
});

export const speciesFileSchema = z
  .strictObject({
    tiers: z.strictObject(Object.fromEntries(RARITY_VALUES.map((r) => [r, tierSchema])) as Record<(typeof RARITY_VALUES)[number], typeof tierSchema>),
    species: z.array(speciesRowSchema).min(1),
  })
  .superRefine((f, ctx) => {
    const ids = f.species.map((s) => s.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) ctx.addIssue({ code: 'custom', message: `duplicate species ${dup}` });
  });
