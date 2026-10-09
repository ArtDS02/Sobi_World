// Rarity ladder of the species (DECISIONS U00-1 D9).
import { RARITY_VALUES, type Rarity } from '../../../content/schemas/vocab';

export { RARITY_VALUES, type Rarity };

/** 0 = COMMON … 4 = LEGENDARY. */
export const rarityRank = (r: Rarity): number => RARITY_VALUES.indexOf(r);
