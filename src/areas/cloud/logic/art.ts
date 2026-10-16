// Asset ids the Cloud draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { AREA_HUD_ART, itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { FLOWER_LIST } from './config/content';

/** The pictures of a flower on a plot, in the order it grows. */
export const FLOWER_STAGES = ['sprout', 'grow', 'ripe', 'wilt'] as const;
export type FlowerStage = (typeof FLOWER_STAGES)[number];

export const flowerArtId = (flower: { art: string }, stage: FlowerStage): string => `${flower.art}_${stage}`;

export const CLOUD_BUILDING_ART = { spring: 'bld_cloud_spring', cauldron: 'bld_cauldron' } as const;
export const CLOUD_PLOT_ART = 'plot_cloud';
/** Bác Cú Giả Kim's own picture (content/shared/npcs.json `artId` moves to it once the art is accepted). */
export const CLOUD_NPC_ART = 'prop_npc_alchemist';
export const CLOUD_BACKDROP_ART = 'bg_cloud';
/** Scene dressing (decision 023): label planks, the tier banner and its arrows, the ambient bird. */
export const CLOUD_DRESSING_ART = { plank: 'prop_sign_plank', banner: 'prop_title_banner', up: 'ui_btn_tier_up', down: 'ui_btn_tier_down', bird: 'prop_cloud_bird' } as const;

/** Items the Cloud introduced: each has its own icon (`ui_item_*`). */
export const CLOUD_ITEM_IDS = ITEM_IDS.filter((id) => ITEMS[id].category === 'FLOWER' || ITEMS[id].category === 'POTION' || id === 'item_pure_water' || FLOWER_LIST.some((f) => f.seedItem === id));

/** Every id the Cloud needs in the manifest. */
/** The icons on the bottom tray's action cards (decision 031); sowing shows the chosen seed instead. */
export const CLOUD_DOCK_ART = { collect: 'ui_item_pure_water', water: 'ui_icon_water', harvest: 'ui_item_flower_cloud_daisy', fertilize: 'ui_item_fertilizer', expand: 'ui_btn_tier_up' } as const;

export const cloudArtIds = (): string[] => [
  ...Object.values(AREA_HUD_ART),
  ...Object.values(CLOUD_DOCK_ART),
  CLOUD_PLOT_ART,
  CLOUD_BACKDROP_ART,
  ...Object.values(CLOUD_BUILDING_ART),
  ...Object.values(CLOUD_DRESSING_ART),
  CLOUD_NPC_ART,
  ...FLOWER_LIST.flatMap((f) => FLOWER_STAGES.map((s) => flowerArtId(f, s))),
  ...CLOUD_ITEM_IDS.map(itemArtId),
];
