// Asset ids the Aquarium draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { FISH_LIST } from './config/content';

/** The scene's own pictures (GĐ14, decision 030): one painted place per tank level, the rod, the signs, the sand. */
export const TANK_ART = {
  places: ['bg_aquarium', 'bg_aquarium_t2', 'bg_aquarium_t3', 'bg_aquarium_t4', 'bg_aquarium_t5'],
  props: ['bld_fish_dock', 'prop_aqua_sign', 'prop_aqua_plaque', 'prop_fish_egg', 'prop_scale_pile', 'prop_orange_pearls', 'prop_pearl_pile'],
} as const;

/** The HUD's icons (decision 030): the water pill, the level star, the three buttons at the top right. */
export const HUD_ART = { water: 'ui_icon_water', star: 'ui_icon_star', plaza: 'ui_hud_hub', items: 'ui_hud_bag', menu: 'ui_hud_menu' } as const;

/** The icon on each card of the bar (sheets H and I of aquarium-01-scene). */
export const BAR_ART = {
  fish: 'ui_aqua_fish',
  feedAll: 'ui_aqua_seaweed',
  water: 'ui_icon_water',
  scales: 'ui_aqua_shell',
  bag: 'ui_aqua_treasure',
  tank: 'ui_aqua_coral',
  breed: 'ui_aqua_flower',
} as const;

/** Items the Aquarium introduced: each has its own icon (`ui_item_*`). */
export const AQUARIUM_ITEM_IDS = ITEM_IDS.filter(
  (id) => ITEMS[id].category === 'FISH' || id === 'item_scale' || id === 'item_pearl' || id === 'FOOD_FISH',
);

/** Every id the Aquarium needs in the manifest. */
export const aquariumArtIds = (): string[] => [
  ...TANK_ART.places,
  ...TANK_ART.props,
  ...new Set([...Object.values(HUD_ART), ...Object.values(BAR_ART)]),
  ...FISH_LIST.map((f) => f.art),
  ...AQUARIUM_ITEM_IDS.map(itemArtId),
];
