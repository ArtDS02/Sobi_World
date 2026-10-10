// Asset ids the Cloud draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { FLOWER_LIST } from './config/content';

/** The pictures of a flower on a plot, in the order it grows. */
export const FLOWER_STAGES = ['sprout', 'grow', 'ripe', 'wilt'] as const;
export type FlowerStage = (typeof FLOWER_STAGES)[number];

export const flowerArtId = (flower: { art: string }, stage: FlowerStage): string => `${flower.art}_${stage}`;

export const CLOUD_BUILDING_ART = { spring: 'bld_cloud_spring', cauldron: 'bld_cauldron' } as const;
export const CLOUD_PLOT_ART = 'plot_cloud';
export const CLOUD_BACKDROP_ART = 'bg_cloud';

/** Items the Cloud introduced: each has its own icon (`ui_item_*`). */
export const CLOUD_ITEM_IDS = ITEM_IDS.filter((id) => ITEMS[id].category === 'FLOWER' || ITEMS[id].category === 'POTION' || id === 'item_pure_water' || FLOWER_LIST.some((f) => f.seedItem === id));

/** Every id the Cloud needs in the manifest. */
export const cloudArtIds = (): string[] => [
  CLOUD_PLOT_ART,
  CLOUD_BACKDROP_ART,
  ...Object.values(CLOUD_BUILDING_ART),
  ...FLOWER_LIST.flatMap((f) => FLOWER_STAGES.map((s) => flowerArtId(f, s))),
  ...CLOUD_ITEM_IDS.map(itemArtId),
];
