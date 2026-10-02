// Pig species (spec §6.1, UN_IN_PIG_CATALOGUE.md). Stats come from the rarity tier; a species row
// only overrides what makes it different. Adding a species = one row here + one manifest row.
import type { BreedId } from "./ids";
import type { Rarity } from "./rarity";

/** Breeding family (U03 uses it for "related" results). */
export type Family = "FARM" | "MEADOW" | "WILD" | "WATER" | "HERO" | "MYTHIC";

export interface BreedDef {
  id: BreedId;
  nameVi: string;
  rarity: Rarity;
  family: Family;
  buyGold: number | null;      // null = cannot be bought, only bred
  unlockLevel: number;         // player level needed to buy it in the shop
  sellGold: number;            // base price before the happiness multiplier
  growthSec: number;
  pregnancySec: number | null; // null = cannot breed (D10)
  maxWeight: number;           // display only
  breedable: boolean;
  artId: string;         // its artwork; the manifest row with this id (§6.6)
  color: number;               // flat fill when the artwork is missing (§11.4)
  hungerFullSec: number;       // derived, D16
  cleanFullSec: number;        // derived, D16
}

/** Per-rarity stats, TUNABLE. COMMON..LEGENDARY match the four v1 breeds exactly. */
export const RARITY_TIER: Record<
  Rarity,
  Pick<BreedDef, "sellGold" | "growthSec" | "pregnancySec" | "maxWeight" | "breedable">
> = {
  COMMON:    { sellGold: 1200,  growthSec: 7200,  pregnancySec: 3600,  maxWeight: 50,  breedable: true },
  UNCOMMON:  { sellGold: 3000,  growthSec: 14400, pregnancySec: 5400,  maxWeight: 80,  breedable: true },
  RARE:      { sellGold: 12000, growthSec: 28800, pregnancySec: 10800, maxWeight: 120, breedable: true },
  EPIC:      { sellGold: 24000, growthSec: 57600, pregnancySec: 18000, maxWeight: 180, breedable: true },
  LEGENDARY: { sellGold: 50000, growthSec: 86400, pregnancySec: null,  maxWeight: 250, breedable: false },
};

type SpeciesRow = Pick<BreedDef, "id" | "nameVi" | "rarity" | "family" | "artId" | "color"> &
  Partial<Pick<BreedDef, "buyGold" | "unlockLevel" | keyof (typeof RARITY_TIER)[Rarity]>>;

/** Tier stats + row overrides, then D16: care budgets derived from growth time, never hand-tuned. */
const species = (row: SpeciesRow): BreedDef => {
  const b = { buyGold: null, unlockLevel: 1, ...RARITY_TIER[row.rarity], ...row };
  return { ...b, hungerFullSec: b.growthSec / 3, cleanFullSec: b.growthSec * 0.75 };
};

export const BREEDS: Record<BreedId, BreedDef> = {
  // COMMON — farm colours, sold in the shop
  PIG_EARTH_PINK: species({ id: "PIG_EARTH_PINK", nameVi: "Heo Hồng Đất", rarity: "COMMON", family: "FARM", buyGold: 500, artId: "pig_classic", color: 0xf7a8b8 }),
  PIG_WHITE:      species({ id: "PIG_WHITE", nameVi: "Heo Trắng", rarity: "COMMON", family: "FARM", buyGold: 500, artId: "pig_white", color: 0xfff4ea }),
  PIG_BLACK:      species({ id: "PIG_BLACK", nameVi: "Heo Đen", rarity: "COMMON", family: "FARM", buyGold: 500, artId: "pig_black", color: 0x3d3540 }),
  PIG_BROWN:      species({ id: "PIG_BROWN", nameVi: "Heo Nâu", rarity: "COMMON", family: "FARM", buyGold: 500, unlockLevel: 2, artId: "pig_brown", color: 0xb9744f }),
  PIG_SPOTTED:    species({ id: "PIG_SPOTTED", nameVi: "Heo Đốm", rarity: "COMMON", family: "FARM", buyGold: 500, unlockLevel: 3, artId: "pig_spotted", color: 0xf2c4b0 }),
  // UNCOMMON
  PIG_STRIPED_MELON: species({ id: "PIG_STRIPED_MELON", nameVi: "Heo Sọc Dưa", rarity: "UNCOMMON", family: "MEADOW", artId: "pig_watermelon", color: 0x8fd18a }),
  PIG_BOAR:       species({ id: "PIG_BOAR", nameVi: "Heo Rừng", rarity: "UNCOMMON", family: "WILD", buyGold: 1500, unlockLevel: 3, artId: "pig_boar", color: 0x7a6250 }),
  PIG_SHEEP:      species({ id: "PIG_SHEEP", nameVi: "Heo Cừu", rarity: "UNCOMMON", family: "MEADOW", buyGold: 1500, unlockLevel: 4, artId: "pig_sheep", color: 0xf5ebdd }),
  PIG_BEE:        species({ id: "PIG_BEE", nameVi: "Heo Ong", rarity: "UNCOMMON", family: "MEADOW", artId: "pig_bee", color: 0xf6c944 }),
  PIG_PENGUIN:    species({ id: "PIG_PENGUIN", nameVi: "Heo Cánh Cụt", rarity: "UNCOMMON", family: "WATER", buyGold: 1800, unlockLevel: 5, artId: "pig_penguin", color: 0x33415c }),
  // RARE
  PIG_SUPERMAN:   species({ id: "PIG_SUPERMAN", nameVi: "Heo Siêu Nhân", rarity: "RARE", family: "HERO", artId: "pig_superhero", color: 0x7fa8f0 }),
  PIG_TIGER:      species({ id: "PIG_TIGER", nameVi: "Heo Hổ", rarity: "RARE", family: "WILD", buyGold: 7000, unlockLevel: 6, artId: "pig_tiger", color: 0xf29a4a }),
  PIG_PANDA:      species({ id: "PIG_PANDA", nameVi: "Heo Gấu Trúc", rarity: "RARE", family: "WILD", artId: "pig_panda", color: 0xf4f1ee }),
  PIG_AXOLOTL:    species({ id: "PIG_AXOLOTL", nameVi: "Heo Kỳ Giông", rarity: "RARE", family: "WATER", buyGold: 7000, unlockLevel: 7, artId: "pig_axolotl", color: 0xffc4d6 }),
  // EPIC — bred only
  PIG_KOI:        species({ id: "PIG_KOI", nameVi: "Heo Cá Chép", rarity: "EPIC", family: "WATER", artId: "pig_koi", color: 0xe8573e }),
  PIG_DRAGONLING: species({ id: "PIG_DRAGONLING", nameVi: "Heo Rồng Con", rarity: "EPIC", family: "MYTHIC", artId: "pig_dragonling", color: 0x5fc2a0 }),
  PIG_GALAXY:     species({ id: "PIG_GALAXY", nameVi: "Heo Ngân Hà", rarity: "EPIC", family: "MYTHIC", artId: "pig_galaxy", color: 0x3b3a78 }),
  PIG_ROBOT:      species({ id: "PIG_ROBOT", nameVi: "Heo Robot", rarity: "EPIC", family: "HERO", artId: "pig_robot", color: 0x9aa4b4 }),
  PIG_UNICORN:    species({ id: "PIG_UNICORN", nameVi: "Heo Kỳ Lân", rarity: "EPIC", family: "MYTHIC", artId: "pig_unicorn", color: 0xffd6e4 }),
  // LEGENDARY — bred only, cannot breed further
  PIG_MYTHICAL:   species({ id: "PIG_MYTHICAL", nameVi: "Heo Thần Thoại", rarity: "LEGENDARY", family: "MYTHIC", artId: "pig_thienlong", color: 0xc9a0f0 }),
  PIG_PHOENIX:    species({ id: "PIG_PHOENIX", nameVi: "Heo Phượng Hoàng", rarity: "LEGENDARY", family: "MYTHIC", artId: "pig_phoenix", color: 0xf07a3e }),
};

export const BREED_IDS = Object.keys(BREEDS) as BreedId[];
