// Asset ids the Garden draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { CROP_LIST, GB, type Crop } from './config/content';

/** The pictures of a crop on a plot, in the order it grows. */
export const CROP_STAGES = ['sprout', 'grow', 'ripe', 'wilt'] as const;
export type CropStage = (typeof CROP_STAGES)[number];

export const cropArtId = (crop: Pick<Crop, 'art'>, stage: CropStage): string => `${crop.art}_${stage}`;

export const PLOT_ART = { soil: 'plot_soil', wet: 'plot_soil_wet', locked: 'plot_locked' } as const;
export const SPRINKLER_ART = 'bld_sprinkler';

/** Items the Garden introduced: each has its own icon (`ui_item_*`). */
export const GARDEN_ITEM_IDS = ITEM_IDS.filter((id) => CROP_LIST.some((c) => c.seedItem === id) || ITEMS[id].category === 'CROP' || id === 'FOOD_PREMIUM' || id === 'item_fertilizer');

/** Every id the Garden needs in the manifest. */
export const gardenArtIds = (): string[] => [
  ...Object.values(PLOT_ART),
  SPRINKLER_ART,
  GB.buildings.mill.art,
  GB.buildings.composter.art,
  ...CROP_LIST.flatMap((c) => CROP_STAGES.map((s) => cropArtId(c, s))),
  ...GARDEN_ITEM_IDS.map(itemArtId),
];
