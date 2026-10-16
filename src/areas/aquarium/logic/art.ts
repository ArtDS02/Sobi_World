// Asset ids the Aquarium draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { FISH_LIST } from './config/content';

/** The scene's own pictures (GĐ14, decision 030): one painted place per tank level, the rod, the signs, the sand. */
export const TANK_ART = {
  places: ['bg_aquarium', 'bg_aquarium_t2', 'bg_aquarium_t3', 'bg_aquarium_t4', 'bg_aquarium_t5'],
  props: ['bld_fish_dock', 'prop_aqua_sign', 'prop_aqua_plaque', 'prop_fish_egg', 'prop_scale_pile', 'prop_orange_pearls', 'prop_pearl_pile'],
} as const;

/** Items the Aquarium introduced: each has its own icon (`ui_item_*`). */
export const AQUARIUM_ITEM_IDS = ITEM_IDS.filter(
  (id) => ITEMS[id].category === 'FISH' || id === 'item_scale' || id === 'item_pearl' || id === 'FOOD_FISH',
);

/** Every id the Aquarium needs in the manifest. */
export const aquariumArtIds = (): string[] => [
  ...TANK_ART.places,
  ...TANK_ART.props,
  ...FISH_LIST.map((f) => f.art),
  ...AQUARIUM_ITEM_IDS.map(itemArtId),
];
