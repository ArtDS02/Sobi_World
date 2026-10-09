// Items (spec §6 Item): what each one does — content/shared/items.json.
import { byId, CONTENT } from './content';
import type { ItemCategory, Rarity } from '../../../content/schemas/vocab';
import { ITEM_ID_VALUES, type ItemId } from './ids';

export interface ItemDef {
  id: ItemId;
  category: ItemCategory;
  rarity: Rarity;
  priceGold: number;
  hungerRestore: number; // 0 = no hunger effect
  curesSickness: boolean;
}

/** FOOD_BASIC is also the unit the trough consumes. */
export const ITEMS: Record<ItemId, ItemDef> = byId('shared/items.json', CONTENT.items.items, ITEM_ID_VALUES);

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
