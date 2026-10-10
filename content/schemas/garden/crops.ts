// content/garden/crops.json — the plants of Sobi Garden (GAME_BALANCE §5): what a seed grows into, how long it
// takes and how much it gives. Prices live on the seed and produce items (content/shared/items.json).
import { z } from 'zod';
import { assetId, itemId, posInt, text } from '../fields';

export const cropSchema = z.strictObject({
  id: z.string().regex(/^crop_[a-z0-9_]+$/),
  nameVi: text,
  /** The item that is sown (one per plot); its priceGold is the seed price. */
  seedItem: itemId,
  /** The item harvested. */
  produceItem: itemId,
  /** Hours of growth in a watered plot, unfertilised. */
  growHours: z.number().finite().positive(),
  /** Items per harvest. */
  yield: posInt,
  /** Art id stem: the scene looks for `<art>_sprout`, `<art>_grow`, `<art>_ripe`, `<art>_wilt`. */
  art: assetId,
});

export const cropsFileSchema = z.strictObject({ crops: z.array(cropSchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.crops.map((c) => c.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate crop id ${dup}` });
});
