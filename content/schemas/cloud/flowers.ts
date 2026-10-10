// content/cloud/flowers.json — the flowers of Sobi Cloud (spec §8.4): what a seed grows into, how long it takes and how
// much it gives. Prices, uses (potions, mutation boost) live on the seed and flower items (content/shared/items.json).
import { z } from 'zod';
import { assetId, itemId, posInt, text } from '../fields';

export const FLOWER_KIND_VALUES = ['COMMON', 'RARE', 'NIGHT'] as const;

export const flowerSchema = z.strictObject({
  id: z.string().regex(/^flower_[a-z0-9_]+$/),
  nameVi: text,
  /** COMMON and RARE bloom the same by day or night; a NIGHT flower gives more when picked at night. */
  kind: z.enum(FLOWER_KIND_VALUES),
  seedItem: itemId,
  produceItem: itemId,
  growHours: z.number().finite().positive(),
  yield: posInt,
  /** Art id stem: the scene looks for `<art>_sprout`, `<art>_grow`, `<art>_ripe`, `<art>_wilt`. */
  art: assetId,
});

export const flowersFileSchema = z.strictObject({ flowers: z.array(flowerSchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.flowers.map((c) => c.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate flower id ${dup}` });
});
