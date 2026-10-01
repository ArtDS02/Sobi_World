// Skin type and the 4 breed defaults (spec §6.6). Every other skin, and the shop price list, lives
// only in public/assets/manifest/assets.json and is read through SkinRegistry (DECISIONS C2).
import type { BreedId } from './ids';

export interface SkinDef {
  id: string;
  nameVi: string;
  rarity: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  priceGold: number | null; // null = not purchasable (owned from start, or unlock-only)
  unlock?: { kind: 'LEVEL'; level: number } | { kind: 'COLLECTION'; count: number };
  allowedBreeds: BreedId[] | 'ALL';
  isBreedDefault?: true;
}

export const SKINS: Record<string, SkinDef> = {
  // Breed defaults. Always owned. Never purchasable. Their manifest rows must agree.
  pig_classic: {
    id: 'pig_classic',
    nameVi: 'Heo Hồng Cổ Điển',
    rarity: 'P1',
    priceGold: null,
    allowedBreeds: 'ALL',
    isBreedDefault: true,
  },
  pig_watermelon: {
    id: 'pig_watermelon',
    nameVi: 'Heo Dưa Hấu',
    rarity: 'P1',
    priceGold: null,
    allowedBreeds: 'ALL',
    isBreedDefault: true,
  },
  pig_superhero: {
    id: 'pig_superhero',
    nameVi: 'Heo Siêu Nhân',
    rarity: 'P1',
    priceGold: null,
    allowedBreeds: 'ALL',
    isBreedDefault: true,
  },
  pig_thienlong: {
    id: 'pig_thienlong',
    nameVi: 'Heo Thiên Long',
    rarity: 'P5',
    priceGold: null,
    allowedBreeds: 'ALL',
    isBreedDefault: true,
  },
};

export const STARTER_SKINS = Object.values(SKINS)
  .filter((s) => s.isBreedDefault)
  .map((s) => s.id);
