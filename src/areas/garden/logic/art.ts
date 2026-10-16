// Asset ids the Garden draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { AREA_HUD_ART, itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { CROP_LIST, GB, type Crop } from './config/content';

/** The pictures of a crop on a plot, in the order it grows. */
export const CROP_STAGES = ['sprout', 'grow', 'ripe', 'wilt'] as const;
export type CropStage = (typeof CROP_STAGES)[number];

export const cropArtId = (crop: Pick<Crop, 'art'>, stage: CropStage): string => `${crop.art}_${stage}`;

export const PLOT_ART = { soil: 'plot_soil', wet: 'plot_soil_wet', locked: 'plot_locked' } as const;
export const SPRINKLER_ART = 'bld_sprinkler';
/** The painted field (owner's mock-up, GĐ14, decision 027). */
export const GARDEN_BACKDROP_ART = 'bg_garden';

/** Items the Garden introduced: each has its own icon (`ui_item_*`). */
export const GARDEN_ITEM_IDS = ITEM_IDS.filter((id) => CROP_LIST.some((c) => c.seedItem === id) || ITEMS[id].category === 'CROP' || id === 'FOOD_PREMIUM' || id === 'item_fertilizer');

/** The icons on the bottom tray's action cards (decision 031); sowing shows the chosen seed instead. */
export const GARDEN_DOCK_ART = { water: 'ui_icon_water', harvest: 'ui_item_wheat', fertilize: 'ui_item_fertilizer', expand: 'ui_icon_growth', lab: 'ui_btn_breed' } as const;

/** Every id the Garden needs in the manifest. */
export const gardenArtIds = (): string[] => [
  ...Object.values(PLOT_ART),
  SPRINKLER_ART,
  GARDEN_BACKDROP_ART,
  ...Object.values(AREA_HUD_ART),
  ...Object.values(GARDEN_DOCK_ART),
  GB.buildings.mill.art,
  GB.buildings.composter.art,
  ...CROP_LIST.flatMap((c) => CROP_STAGES.map((s) => cropArtId(c, s))),
  ...GARDEN_ITEM_IDS.map(itemArtId),
];
