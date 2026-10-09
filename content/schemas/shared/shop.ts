// content/shared/shop.json — what the shop's item tab sells (DECISIONS AD-1): packs of one item with
// their own price, icon, order and on/off switch. Product ids are never deleted (transactions keep
// them as refId): retire one with `active: false`.
import { z } from 'zod';
import { PRICE_CURRENCY_VALUES, PRODUCT_CATEGORY_VALUES } from '../vocab';
import { assetId, int, itemId, nonNeg, posInt, text } from '../fields';

export const productSchema = z.strictObject({
  id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  nameVi: text,
  descVi: z.string(),
  category: z.enum(PRODUCT_CATEGORY_VALUES),
  currency: z.enum(PRICE_CURRENCY_VALUES),
  itemId,
  /** Item units one purchase gives. */
  quantity: posInt,
  priceGold: nonNeg,
  /** Manifest asset id drawn on the card. */
  icon: assetId,
  /** Ascending; ties keep the file order. */
  sortOrder: int,
  active: z.boolean(),
});

export const shopFileSchema = z.strictObject({ products: z.array(productSchema) }).superRefine((f, ctx) => {
  const ids = f.products.map((p) => p.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate product id ${dup}` });
});
