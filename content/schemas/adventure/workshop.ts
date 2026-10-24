// content/adventure/workshop.json — how a fighter grows besides battles (adventure-big-update-1 §17): the experience books and what each
// gives, the Adventure Shop (what it sells for Sobi Coin) and the Forge (recipes that turn materials from every Area into books and
// battle potions, made at once). Prices and amounts are content; the Admin edits them in "Nội dung game".
import { z } from 'zod';
import { itemId, posInt } from '../fields';

const counts = z.partialRecord(itemId, posInt);

export const workshopFileSchema = z
  .strictObject({
    /** An experience book: used on one fighter outside a trip, it gives `exp` experience (its level-ups and SP as in battle). */
    tomes: z.array(z.strictObject({ itemId, exp: posInt })).min(1),
    /** The Adventure Shop: each line sells one item for `price` Sobi Coin. */
    shop: z.array(z.strictObject({ itemId, price: posInt })).min(1),
    /** The Forge: `inputs` from the bag make `outputs` at once. */
    recipes: z
      .array(
        z.strictObject({
          id: z.string().regex(/^forge_[a-z0-9_]+$/),
          inputs: counts.refine((c) => Object.keys(c).length > 0, 'a recipe needs inputs'),
          outputs: counts.refine((c) => Object.keys(c).length > 0, 'a recipe makes something'),
        }),
      )
      .min(1),
  })
  .superRefine((f, ctx) => {
    const ids = new Set<string>();
    for (const r of f.recipes) {
      if (ids.has(r.id)) ctx.addIssue({ code: 'custom', message: `duplicate recipe ${r.id}` });
      ids.add(r.id);
    }
    const tomes = new Set<string>();
    for (const t of f.tomes) {
      if (tomes.has(t.itemId)) ctx.addIssue({ code: 'custom', message: `duplicate book ${t.itemId}` });
      tomes.add(t.itemId);
    }
  });
