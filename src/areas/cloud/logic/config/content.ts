// The Cloud's content files (content/cloud/*.json), validated once when first imported (ARCHITECTURE §8,
// core/content), and the tables built from them.
import areaRaw from '../../../../../content/cloud/area.json';
import balanceRaw from '../../../../../content/cloud/balance.json';
import flowersRaw from '../../../../../content/cloud/flowers.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { cloudBalanceFileSchema } from '../../../../../content/schemas/cloud/balance';
import { flowersFileSchema, type FLOWER_KIND_VALUES } from '../../../../../content/schemas/cloud/flowers';
import { loadContent } from '../../../../core/content/load';
import type { CropRule, PlotRules } from '../../../../systems/plants/plot';

export const CLOUD_CONTENT = {
  area: loadContent('cloud/area.json', areaManifestSchema, areaRaw),
  balance: loadContent('cloud/balance.json', cloudBalanceFileSchema, balanceRaw),
  flowers: loadContent('cloud/flowers.json', flowersFileSchema, flowersRaw),
};

export const CLOUD_AREA_ID = CLOUD_CONTENT.area.id;
export const CB = CLOUD_CONTENT.balance;
const HOUR = 3_600_000;
const MINUTE = 60_000;

export type FlowerKind = (typeof FLOWER_KIND_VALUES)[number];

export interface Flower extends CropRule {
  id: string;
  nameVi: string;
  kind: FlowerKind;
  seedItem: string;
  produceItem: string;
  art: string;
}

export const FLOWER_LIST: readonly Flower[] = CLOUD_CONTENT.flowers.flowers.map((f) => ({
  id: f.id,
  nameVi: f.nameVi,
  kind: f.kind,
  seedItem: f.seedItem,
  produceItem: f.produceItem,
  art: f.art,
  growMs: f.growHours * HOUR,
  yield: f.yield,
}));
export const FLOWERS: Readonly<Record<string, Flower>> = Object.fromEntries(FLOWER_LIST.map((f) => [f.id, f]));
export const flowerBySeed = (itemId: string): Flower | undefined => FLOWER_LIST.find((f) => f.seedItem === itemId);

export const PLOT_RULES: PlotRules = {
  dryRate: CB.dryGrowthRate,
  fertilizerFactor: CB.fertilizer.timeFactor,
  fertilizerBonusYield: CB.fertilizer.bonusYield,
  witherAfterMs: CB.witherAfterHours * HOUR,
  witherYieldFactor: CB.witherYieldFactor,
};
export const WATER_MS = CB.waterHours * HOUR;
export const MAX_PLOTS = CB.plotExpansions.at(-1)?.plots ?? CB.startPlots;

export const WATER_ITEM = 'item_pure_water';
export const FERTILIZER_ITEM = 'item_fertilizer';
/** The building id recipes name (content/shared/recipes.json `building`). */
export const CAULDRON = 'cauldron';

export interface SpringLevel {
  intervalMs: number;
  capacity: number;
  price: number;
  materials: Readonly<Record<string, number | undefined>>;
}
export const SPRING_LEVELS: readonly SpringLevel[] = CB.spring.levels.map((l) => ({
  intervalMs: l.intervalMin * MINUTE,
  capacity: l.capacity,
  price: l.price,
  materials: l.materials,
}));
export const MAX_SPRING_LEVEL = SPRING_LEVELS.length;
export const springLevel = (level: number): SpringLevel => SPRING_LEVELS[Math.min(Math.max(level, 1), MAX_SPRING_LEVEL) - 1]!;
