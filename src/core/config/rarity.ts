// Rarity ladder of the species (DECISIONS U00-1 D9).
import { RARITY_VALUES, type Rarity } from '../../../content/schemas/vocab';
import { CONTENT } from './content';

export { RARITY_VALUES, type Rarity };

/** NPC order demand per rarity (U04): common species are wanted more often (content/farm/balance.json). */
export const RARITY_ORDER_WEIGHT: Record<Rarity, number> = CONTENT.farmBalance.orderDemand;

/** 0 = COMMON … 4 = LEGENDARY. */
export const rarityRank = (r: Rarity): number => RARITY_VALUES.indexOf(r);
