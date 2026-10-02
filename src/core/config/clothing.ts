// Clothing foundation (DECISIONS U00-1 D1): data shape only. A clothing item only changes how a
// pig looks; it never touches species, rarity of the pig or any number. Worn items live in
// Pig.cosmetics keyed by slot. No equip action and no shop until the feature is built.
import type { CosmeticSlot } from './ids';
import type { Rarity } from './rarity';

export interface ClothingDef {
  id: string; // also its asset id (manifest `cosmetics` section)
  slot: CosmeticSlot;
  rarity: Rarity;
  priceGold: number | null; // null = not sold
}

export const CLOTHING: Record<string, ClothingDef> = {};
