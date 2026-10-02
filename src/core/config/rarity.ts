// Rarity ladder of the species (DECISIONS U00-1 D9).
export const RARITY_VALUES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
export type Rarity = (typeof RARITY_VALUES)[number];

/** NPC order demand per rarity (U04): common species are wanted more often, TUNABLE. */
export const RARITY_ORDER_WEIGHT: Record<Rarity, number> = {
  COMMON: 6,
  UNCOMMON: 4,
  RARE: 2,
  EPIC: 1,
  LEGENDARY: 0.5,
};

/** 0 = COMMON … 4 = LEGENDARY. */
export const rarityRank = (r: Rarity): number => RARITY_VALUES.indexOf(r);
