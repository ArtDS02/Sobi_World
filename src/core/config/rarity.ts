// Rarity ladder shared by species and skins (DECISIONS U00-1 D9).
export const RARITY_VALUES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
export type Rarity = (typeof RARITY_VALUES)[number];

/** Skin rows in the manifest keep the catalogue keys P1..P5; this is their fixed mapping. */
export type SkinRarityKey = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
export const RARITY_OF_SKIN_KEY: Record<SkinRarityKey, Rarity> = {
  P1: 'COMMON',
  P2: 'UNCOMMON',
  P3: 'RARE',
  P4: 'EPIC',
  P5: 'LEGENDARY',
};

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
