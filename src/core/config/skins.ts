// Skin type (spec §6.6). Every skin row — species artwork and outfits alike — lives only in
// public/assets/manifest/assets.json and is read through SkinRegistry (DECISIONS C2).
// A species' artwork is its `defaultSkin` (breeds.ts): always owned, never sold, fits only that
// species. Outfit skins are drawn on the pink body and fit PIG_EARTH_PINK (DECISIONS U00-1 D6).
import { BREEDS } from "./breeds";
import type { BreedId } from "./ids";
import type { SkinRarityKey } from "./rarity";

export interface SkinDef {
  id: string;
  nameVi: string;
  rarity: SkinRarityKey;      // P1..P5, shown as COMMON..LEGENDARY (rarity.ts)
  priceGold: number | null;   // null = not purchasable (owned from start, or unlock-only)
  unlock?: { kind: "LEVEL"; level: number } | { kind: "COLLECTION"; count: number };
  allowedBreeds: BreedId[] | "ALL";
}

/** Owned by every save: the artwork of every species. */
export const STARTER_SKINS = Object.values(BREEDS).map((b) => b.defaultSkin);
