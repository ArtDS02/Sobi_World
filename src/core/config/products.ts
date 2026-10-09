// Shop products (DECISIONS AD-1): what the shop's item tab sells. A product is a pack of one game
// item (its effect stays in items.ts) with its own price, icon, order and on/off switch, so new
// packs need no code: content/shared/shop.json, edited by the admin dashboard (`npm run admin` → Cửa
// hàng). Product ids are never deleted once shipped (transactions keep them as refId): retire one
// with `active: false`.
import { PRICE_CURRENCY_VALUES, PRODUCT_CATEGORY_VALUES, type PriceCurrency, type ProductCategory } from '../../../content/schemas/vocab';
import { CONTENT } from './content';
import type { ItemId } from './ids';

export { PRODUCT_CATEGORY_VALUES, type ProductCategory };
/** Sobi Coin (the wallet's coins) are the only price currency (spec §8.16). */
export const CURRENCY_VALUES = PRICE_CURRENCY_VALUES;
export type Currency = PriceCurrency;

export interface ProductDef {
  id: string;
  nameVi: string;
  descVi: string;
  category: ProductCategory;
  currency: Currency;
  itemId: ItemId;
  /** Item units one purchase gives. */
  quantity: number;
  priceGold: number;
  /** Manifest asset id drawn on the card (any section). */
  icon: string;
  /** Ascending; ties keep the table order. */
  sortOrder: number;
  active: boolean;
}

export const PRODUCTS: readonly ProductDef[] = CONTENT.shop.products;
