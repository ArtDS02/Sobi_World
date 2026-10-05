// Pig species (spec §6.1, UN_IN_PIG_CATALOGUE.md): content/farm/species.json. Stats come from the
// rarity tier; a species row only overrides what makes it different. Adding a species = one row
// there + `npm run content:ids` + one manifest row — the admin dashboard does all three (DECISIONS A7-1).
import { FAMILY_VALUES, type Family } from "../../../../../content/schemas/vocab";
import { BALANCE } from "./balance";
import { FARM_CONTENT } from "./content";
import type { BreedId } from "./ids";
import type { Rarity } from "../../../../core/config/rarity";
import { SPECIES_ROWS } from "./speciesTable";

/** Breeding family (U03 uses it for "related" results). The last eight are the A7 collections. */
export { FAMILY_VALUES, type Family };

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

/** Per-rarity stats (content/farm/species.json `tiers`), TUNABLE. */
export const RARITY_TIER: Record<
  Rarity,
  Pick<BreedDef, "sellGold" | "growthSec" | "pregnancySec" | "maxWeight" | "breedable">
> = FARM_CONTENT.species.tiers;

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
