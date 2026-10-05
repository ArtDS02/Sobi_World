// Balance constants (spec §6.4): content/farm/balance.json (`balance`). TUNABLE in the file / admin.
import type { Rarity } from '../../../../core/config/rarity';
import { FARM_CONTENT } from './content';
import { ITEMS } from '../../../../core/config/items';

/** NPC order demand per rarity (U04): common species are wanted more often (`orderDemand`). */
export const RARITY_ORDER_WEIGHT: Record<Rarity, number> = FARM_CONTENT.farmBalance.orderDemand;

export const BALANCE = {
  ...FARM_CONTENT.farmBalance.balance,
  /** One food unit's hunger (manual feeding and every trough meal): the item's own effect. */
  FOOD_HUNGER_RESTORE: ITEMS.FOOD_BASIC.hungerRestore,
};
