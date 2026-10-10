// The Garden's content files (content/garden/*.json), validated once when first imported
// (ARCHITECTURE §8, core/content), and the tables built from them.
import areaRaw from '../../../../../content/garden/area.json';
import balanceRaw from '../../../../../content/garden/balance.json';
import cropsRaw from '../../../../../content/garden/crops.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { gardenBalanceFileSchema } from '../../../../../content/schemas/garden/balance';
import { cropsFileSchema } from '../../../../../content/schemas/garden/crops';
import { loadContent } from '../../../../core/content/load';
import { levelFromXp as coreLevel, type LevelTable } from '../../../../core/progression/levels';
import type { CropRule, PlotRules } from '../../../../systems/plants/plot';

export const GARDEN_CONTENT = {
  area: loadContent('garden/area.json', areaManifestSchema, areaRaw),
  balance: loadContent('garden/balance.json', gardenBalanceFileSchema, balanceRaw),
  crops: loadContent('garden/crops.json', cropsFileSchema, cropsRaw),
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
}

export const CROP_LIST: readonly Crop[] = GARDEN_CONTENT.crops.crops.map((c) => ({
  id: c.id,
  nameVi: c.nameVi,
  seedItem: c.seedItem,
  produceItem: c.produceItem,
  art: c.art,
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

export const GARDEN_LEVELS: LevelTable = { xp: GB.levels.xp, maxLevel: GB.levels.maxLevel };
export const gardenLevel = (xp: number): number => coreLevel(xp, GARDEN_LEVELS);

export type BuildingId = 'mill' | 'composter';
export const BUILDING_IDS: readonly BuildingId[] = ['mill', 'composter'];
export const MAX_PLOTS = GB.plotExpansions.at(-1)?.plots ?? GB.startPlots;
