// Shop items (spec §6.3).
import { BALANCE } from './balance';
import type { ItemId } from './ids';

export interface ItemDef {
  id: ItemId;
  priceGold: number;
  hungerRestore: number; // 0 = no hunger effect
  curesSickness: boolean;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  // Also the unit the trough consumes.
  FOOD_BASIC: {
    id: 'FOOD_BASIC',
    priceGold: 25,
    hungerRestore: BALANCE.FOOD_HUNGER_RESTORE,
    curesSickness: false,
  },
  MEDICINE_COMMON: { id: 'MEDICINE_COMMON', priceGold: 100, hungerRestore: 0, curesSickness: true },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
