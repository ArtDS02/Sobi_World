// content/aquarium/fish.json — the fish species of Sobi Aquarium (spec V2 §8.3, GAME_BALANCE §9). A species is data:
// how fast it grows, how rare it is, when it bites, what it is worth caught and raised. Each species has an item
// (the catch in the bag, sold by items.json) so it can be an order, a gift or a recipe input like any other item.
import { z } from 'zod';
import { assetId, itemId, nonNeg, text } from '../fields';
import { RARITY_VALUES } from '../vocab';

export const fishSchema = z.strictObject({
  id: z.string().regex(/^fish_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  rarity: z.enum(RARITY_VALUES),
  /** The caught fish as an item of the bag (category FISH). */
  item: itemId,
  /** Hours from hatching to full size, fed and healthy (spec: 6-24). */
  growHours: z.number().finite().min(1).max(72),
  /** Base price of a full-grown tank fish sold out of the tank (a caught one is the item's own `sellGold`). */
  tankGold: nonNeg,
  /** Share of the casts that bite it (relative; 0 = never caught, only bred). */
  catchWeight: nonNeg,
  /** Bites only at night (the night period of the day cycle). */
  nightOnly: z.boolean(),
  /** A grown fish sheds one scale this many hours. */
  scaleHours: z.number().finite().positive(),
  /** Pairs of this species can have eggs. */
  breedable: z.boolean(),
  /** Art id: the picture of the fish swimming (`<art>`). */
  art: assetId,
});

export const fishFileSchema = z.strictObject({ fish: z.array(fishSchema).min(1) }).superRefine((f, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  const ids = f.fish.map((x) => x.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) issue(`duplicate fish id ${dup}`);
  const items = f.fish.map((x) => x.item);
  const dupItem = items.find((id, i) => items.indexOf(id) !== i);
  if (dupItem) issue(`two fish share the item ${dupItem}`);
  if (!f.fish.some((x) => x.catchWeight > 0)) issue('no fish can be caught');
});

export const fishNamesFileSchema = z.strictObject({ names: z.array(z.string().min(1).max(16)).min(1) });
export type FishRow = z.infer<typeof fishSchema>;
