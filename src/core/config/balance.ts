// Balance constants (spec §6.4): content/farm/balance.json (`balance`). TUNABLE in the file / admin.
import { CONTENT } from './content';
import { ITEMS } from './items';

export const BALANCE = {
  ...CONTENT.farmBalance.balance,
  /** One food unit's hunger (manual feeding and every trough meal): the item's own effect. */
  FOOD_HUNGER_RESTORE: ITEMS.FOOD_BASIC.hungerRestore,
};
