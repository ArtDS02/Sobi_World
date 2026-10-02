// Shop products (DECISIONS AD-1): what the shop's item tab sells. A product is a pack of one game
// item (its effect stays in items.ts) with its own price, icon, order and on/off switch, so new
// packs need no code. The PRODUCTS block between the admin markers is rewritten by the admin
// dashboard (`npm run admin` → Cửa hàng); keep it one object literal per row. Product ids are never
// deleted once shipped (transactions keep them as refId): retire one with `active: false`.
import type { ItemId } from './ids';

export const PRODUCT_CATEGORY_VALUES = ['FOOD', 'MEDICINE', 'SUPPLY', 'SPECIAL'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORY_VALUES)[number];
/** Gold is the game's only currency (spec §8.16); the field keeps the data honest about it. */
export const CURRENCY_VALUES = ['GOLD'] as const;
export type Currency = (typeof CURRENCY_VALUES)[number];

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

// <admin:products>
export const PRODUCTS: readonly ProductDef[] = [
  { id: "FOOD_BASIC", nameVi: "Thức ăn", descVi: "Tăng 50 độ no. Cũng là đơn vị đổ vào máng ăn.", category: "FOOD", currency: "GOLD", itemId: "FOOD_BASIC", quantity: 1, priceGold: 25, icon: "ui_btn_fill_trough", sortOrder: 10, active: true },
  { id: "MEDICINE_COMMON", nameVi: "Thuốc", descVi: "Chữa khỏi bệnh cho một con heo.", category: "MEDICINE", currency: "GOLD", itemId: "MEDICINE_COMMON", quantity: 1, priceGold: 100, icon: "ui_btn_heal", sortOrder: 20, active: true },
];
// </admin:products>
