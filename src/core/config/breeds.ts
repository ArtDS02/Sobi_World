import type { BreedId } from "./ids";

export interface BreedDef {
  id: BreedId;
  nameVi: string;
  buyGold: number | null;      // null = cannot be bought, only bred
  sellGold: number;            // base price before the happiness multiplier
  growthSec: number;
  pregnancySec: number | null; // null = cannot breed (D10)
  maxWeight: number;           // display only
  breedable: boolean;
  defaultSkin: string;         // §6.6
  hungerFullSec: number;       // derived, D16
  cleanFullSec: number;        // derived, D16
}

/** D16 — care budgets are derived from growth time, never hand-tuned per breed. */
const care = <T extends { growthSec: number }>(b: T) => ({
  ...b,
  hungerFullSec: b.growthSec / 3,
  cleanFullSec: b.growthSec * 0.75,
});

export const BREEDS: Record<BreedId, BreedDef> = {
  PIG_EARTH_PINK: care({
    id: "PIG_EARTH_PINK", nameVi: "Heo Hồng Đất",
    buyGold: 500, sellGold: 1200,
    growthSec: 7200, pregnancySec: 3600,
    maxWeight: 50, breedable: true, defaultSkin: "pig_classic",
  }),
  PIG_STRIPED_MELON: care({
    id: "PIG_STRIPED_MELON", nameVi: "Heo Sọc Dưa",
    buyGold: null, sellGold: 3000,
    growthSec: 14400, pregnancySec: 5400,
    maxWeight: 80, breedable: true, defaultSkin: "pig_watermelon",
  }),
  PIG_SUPERMAN: care({
    id: "PIG_SUPERMAN", nameVi: "Heo Siêu Nhân",
    buyGold: null, sellGold: 12000,
    growthSec: 28800, pregnancySec: 10800,
    maxWeight: 120, breedable: true, defaultSkin: "pig_superhero",
  }),
  PIG_MYTHICAL: care({
    id: "PIG_MYTHICAL", nameVi: "Heo Thần Thoại",
    buyGold: null, sellGold: 50000,
    growthSec: 86400, pregnancySec: null,
    maxWeight: 250, breedable: false, defaultSkin: "pig_thienlong",
  }),
};

export const BREED_IDS = Object.keys(BREEDS) as BreedId[];
