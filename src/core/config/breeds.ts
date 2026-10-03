// Pig species (spec §6.1, UN_IN_PIG_CATALOGUE.md). Stats come from the rarity tier; a species row
// (speciesTable.ts) only overrides what makes it different. Adding a species = one row there + one
// id in ids.ts + one manifest row — the admin dashboard does all three (DECISIONS A7-1).
import { BALANCE } from "./balance";
import type { BreedId } from "./ids";
import type { Rarity } from "./rarity";
import { SPECIES_ROWS } from "./speciesTable";

/** Breeding family (U03 uses it for "related" results). The last eight are the A7 collections. */
export const FAMILY_VALUES = [
  "FARM", "MEADOW", "WILD", "WATER", "HERO", "MYTHIC",
  "VIETNAM", "JOB", "ADVENTURE", "SCIFI", "FANTASY", "HORROR", "FOOD", "FUNNY",
] as const;
export type Family = (typeof FAMILY_VALUES)[number];

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
  enabled: boolean;            // false = retired: not sold, never bred; pigs already owned stay
  artId: string;         // its artwork; the manifest row with this id (§6.6)
  color: number;               // flat fill when the artwork is missing (§11.4)
  hungerFullSec: number;       // derived, D16 / NH-1
  cleanFullSec: number;        // derived, D16 / NH-1
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

export type SpeciesRow = Pick<BreedDef, "id" | "nameVi" | "rarity" | "family" | "artId" | "color"> &
  Partial<Pick<BreedDef, "buyGold" | "unlockLevel" | "enabled" | keyof (typeof RARITY_TIER)[Rarity]>>;

/** Care budget (NH-1): derived from growth time with a floor, never hand-tuned per species. */
const budget = (growthSec: number, ratio: number, minSec: number): number =>
  Math.max(minSec, growthSec * ratio);

/** Tier stats + row overrides, then D16 / NH-1: care budgets derived from growth time. */
const species = (row: SpeciesRow): BreedDef => {
  const b = { buyGold: null, unlockLevel: 1, enabled: true, ...RARITY_TIER[row.rarity], ...row };
  return {
    ...b,
    hungerFullSec: budget(b.growthSec, BALANCE.CARE_HUNGER_GROWTH_RATIO, BALANCE.CARE_HUNGER_MIN_SEC),
    cleanFullSec: budget(b.growthSec, BALANCE.CARE_CLEAN_GROWTH_RATIO, BALANCE.CARE_CLEAN_MIN_SEC),
  };
};

/** Every species, in SPECIES_ROWS order (grouped by rarity). */
export const BREEDS = Object.fromEntries(SPECIES_ROWS.map((row) => [row.id, species(row)])) as Record<
  BreedId,
  BreedDef
>;

export const BREED_IDS = Object.keys(BREEDS) as BreedId[];
