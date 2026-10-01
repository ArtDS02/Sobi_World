import type { BreedId } from "./ids";

export interface SkinDef {
  id: string;
  nameVi: string;
  rarity: "P1" | "P2" | "P3" | "P4" | "P5";
  priceGold: number | null;   // null = not purchasable (owned from start, or unlock-only)
  unlock?: { kind: "LEVEL"; level: number } | { kind: "COLLECTION"; count: number };
  allowedBreeds: BreedId[] | "ALL";
  isBreedDefault?: true;
}

export const SKINS: Record<string, SkinDef> = {
  // --- Breed defaults. Always owned. Never purchasable. ---
  pig_classic:    { id: "pig_classic",    nameVi: "Heo Hồng Cổ Điển", rarity: "P1", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },
  pig_watermelon: { id: "pig_watermelon", nameVi: "Heo Dưa Hấu",      rarity: "P1", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },
  pig_superhero:  { id: "pig_superhero",  nameVi: "Heo Siêu Nhân",    rarity: "P1", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },
  pig_thienlong:  { id: "pig_thienlong",  nameVi: "Heo Thiên Long",   rarity: "P5", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },

  // --- Shop stock. P1 ladder = 2,000 gold (§6.6, TUNABLE). ---
  pig_white:     { id: "pig_white",     nameVi: "Heo Trắng",     rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_black:     { id: "pig_black",     nameVi: "Heo Đen",       rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_brown:     { id: "pig_brown",     nameVi: "Heo Nâu",       rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_farmer:    { id: "pig_farmer",    nameVi: "Heo Nông Dân",  rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_chef:      { id: "pig_chef",      nameVi: "Heo Đầu Bếp",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_nerd:      { id: "pig_nerd",      nameVi: "Heo Mọt Sách",  rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_knight:    { id: "pig_knight",    nameVi: "Heo Hiệp Sĩ",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_wizard:    { id: "pig_wizard",    nameVi: "Heo Pháp Sư",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_cowboy:    { id: "pig_cowboy",    nameVi: "Heo Cao Bồi",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_detective: { id: "pig_detective", nameVi: "Heo Thám Tử",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_ghost:     { id: "pig_ghost",     nameVi: "Heo Ma",        rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_christmas: { id: "pig_christmas", nameVi: "Heo Giáng Sinh", rarity: "P1", priceGold: 2000, allowedBreeds: "ALL",
                   unlock: { kind: "LEVEL", level: 3 } },
  pig_tet:       { id: "pig_tet",       nameVi: "Heo Tết",       rarity: "P1", priceGold: 2000, allowedBreeds: "ALL",
                   unlock: { kind: "LEVEL", level: 3 } },
};

export const STARTER_SKINS = Object.values(SKINS)
  .filter((s) => s.isBreedDefault)
  .map((s) => s.id);
