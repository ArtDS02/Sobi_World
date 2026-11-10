// Asset ids the Cloud draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { AREA_HUD_ART, itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { FLOWER_LIST } from './config/content';
import { SKIN_ART_IDS, SKIN_BACKDROP_IDS, SKIN_BUILDING_IDS } from '../../../core/config/plotSkins';
import { RANK_SPRITES_ON, sceneryArtIds } from '../../../systems/animation/rankScenery';
import { CLOUD_SCENERY } from '../scene/cloudView';

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
/** The bird's drawn wing frames (decision 050 (5)): wings up, level, down; played 1 → 2 → 3 → 2. */
export const CLOUD_BIRD_WINGS = ['prop_cloud_bird_fly1', 'prop_cloud_bird_fly2', 'prop_cloud_bird_fly3'] as const;

/** Items the Cloud introduced: each has its own icon (`ui_item_*`). */
export const CLOUD_ITEM_IDS = ITEM_IDS.filter((id) => ITEMS[id].category === 'FLOWER' || ITEMS[id].category === 'POTION' || id === 'item_pure_water' || FLOWER_LIST.some((f) => f.seedItem === id));

/** Every id the Cloud needs in the manifest. */
/** The icons on the bottom tray's action cards (decision 031); sowing shows the chosen seed instead. */
export const CLOUD_DOCK_ART = { collect: 'ui_item_pure_water', water: 'ui_icon_water', harvest: 'ui_item_flower_cloud_daisy', fertilize: 'ui_item_fertilizer', expand: 'ui_btn_tier_up', lab: 'ui_btn_breed' } as const;

/** The decorative caterpillar's poses (decision 057, B4): the two frames of its inching, resting, and the moment the bird pecks it. */
export const CLOUD_PEST_ART = { a: 'prop_cloud_caterpillar_a', b: 'prop_cloud_caterpillar_b', perch: 'prop_cloud_caterpillar_perch', caught: 'prop_cloud_caterpillar_caught' } as const;

export const cloudArtIds = (): string[] => [
  ...Object.values(CLOUD_PEST_ART),
  ...Object.values(AREA_HUD_ART),
  ...Object.values(CLOUD_DOCK_ART),
  CLOUD_PLOT_ART,
  CLOUD_BACKDROP_ART,
  ...Object.values(CLOUD_BUILDING_ART),
  ...Object.values(CLOUD_DRESSING_ART),
  CLOUD_NPC_ART,
  ...(RANK_SPRITES_ON ? sceneryArtIds(CLOUD_SCENERY) : []),
  ...SKIN_ART_IDS.filter((id) => id.endsWith('_cloud')),
  ...SKIN_BACKDROP_IDS('cloud'),
  ...SKIN_BUILDING_IDS('cloud'),
  ...FLOWER_LIST.flatMap((f) => FLOWER_STAGES.map((s) => flowerArtId(f, s))),
  ...CLOUD_ITEM_IDS.map(itemArtId),
];
