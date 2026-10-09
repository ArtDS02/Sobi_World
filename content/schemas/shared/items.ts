// content/shared/items.json — every item of the shared bag (spec §6 Item): what it does.
import { z } from 'zod';
import { itemId, nonNeg } from '../fields';
import { ITEM_CATEGORY_VALUES, RARITY_VALUES } from '../vocab';

export const itemSchema = z.strictObject({
  id: itemId,
  category: z.enum(ITEM_CATEGORY_VALUES),
  rarity: z.enum(RARITY_VALUES),
  /** Unit price at the shop (shop.json may sell packs at other prices). */
  priceGold: nonNeg,
  /** What the shop pays for one; absent = cannot be sold. */
  sellGold: nonNeg.optional(),
  /** Hunger restored when a creature eats it; 0 = not food. */
  hungerRestore: nonNeg,
  curesSickness: z.boolean(),
});

export const itemsFileSchema = z.strictObject({ items: z.array(itemSchema) });
