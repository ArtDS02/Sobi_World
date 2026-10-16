// The Garden's content files (content/garden/*.json), validated once when first imported
// (ARCHITECTURE §8, core/content), and the tables built from them.
import areaRaw from '../../../../../content/garden/area.json';
import balanceRaw from '../../../../../content/garden/balance.json';
import cropsRaw from '../../../../../content/garden/crops.json';
import hybridsRaw from '../../../../../content/garden/hybrids.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { gardenBalanceFileSchema } from '../../../../../content/schemas/garden/balance';
import { cropsFileSchema } from '../../../../../content/schemas/garden/crops';
import { hybridsFileSchema } from '../../../../../content/schemas/shared/hybrids';
import { loadContent } from '../../../../core/content/load';
import type { CropRule, PlotRules } from '../../../../systems/plants/plot';

export const GARDEN_CONTENT = {
  area: loadContent('garden/area.json', areaManifestSchema, areaRaw),
  balance: loadContent('garden/balance.json', gardenBalanceFileSchema, balanceRaw),
  crops: loadContent('garden/crops.json', cropsFileSchema, cropsRaw),
  hybrids: loadContent('garden/hybrids.json', hybridsFileSchema, hybridsRaw),
};

export const GARDEN_AREA_ID = GARDEN_CONTENT.area.id;
export const GB = GARDEN_CONTENT.balance;
const HOUR = 3_600_000;

export interface Crop extends CropRule {
  id: string;
  nameVi: string;
  seedItem: string;
  produceItem: string;
  art: string;
  /** Only bred (decision 035): its seed is sold once the lab has given it. */
  hybrid: boolean;
}

export const CROP_LIST: readonly Crop[] = GARDEN_CONTENT.crops.crops.map((c) => ({
  id: c.id,
  nameVi: c.nameVi,
  seedItem: c.seedItem,
  produceItem: c.produceItem,
  art: c.art,
  hybrid: c.hybrid ?? false,
  growMs: c.growHours * HOUR,
  yield: c.yield,
}));
export const CROPS: Readonly<Record<string, Crop>> = Object.fromEntries(CROP_LIST.map((c) => [c.id, c]));
export const cropBySeed = (itemId: string): Crop | undefined => CROP_LIST.find((c) => c.seedItem === itemId);

export const PLOT_RULES: PlotRules = {
  dryRate: GB.dryGrowthRate,
  fertilizerFactor: GB.fertilizer.timeFactor,
  fertilizerBonusYield: GB.fertilizer.bonusYield,
  witherAfterMs: GB.witherAfterHours * HOUR,
  witherYieldFactor: GB.witherYieldFactor,
};
export const WATER_MS = GB.waterHours * HOUR;

/** The crossing lab (decision 035): recipes, pity and what a try costs. */
export const GARDEN_HYBRIDS = GARDEN_CONTENT.hybrids;
export const GARDEN_LAB = GARDEN_HYBRIDS.lab ?? { cost: 0, seeds: 1, consolation: 0, xp: 0 };
for (const r of GARDEN_HYBRIDS.recipes) {
  for (const id of [...r.parents, r.result]) if (!(id in CROPS)) throw new Error(`garden/hybrids.json ${r.id}: unknown crop ${id}`);
}


export type BuildingId = 'mill' | 'composter';
export const BUILDING_IDS: readonly BuildingId[] = ['mill', 'composter'];
export const MAX_PLOTS = GB.plotExpansions.at(-1)?.plots ?? GB.startPlots;
/** The field is shown one zone at a time (decision 028); a new zone opens whole. */
export const PLOTS_PER_ZONE = GB.plotsPerZone;
export const ZONE_COUNT = Math.ceil(MAX_PLOTS / PLOTS_PER_ZONE);
/** The zone plot `index` lies in (0-based). */
export const zoneOf = (index: number): number => Math.floor(index / PLOTS_PER_ZONE);
