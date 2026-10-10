// Asset ids the Aquarium draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { FISH_LIST } from './config/content';

/** The tank, the dock and the rod, as the scene draws them. */
export const TANK_ART = { glass: 'bld_fish_tank', dock: 'bld_fish_dock', background: 'bg_aquarium' } as const;

/** Items the Aquarium introduced: each has its own icon (`ui_item_*`). */
export const AQUARIUM_ITEM_IDS = ITEM_IDS.filter(
  (id) => ITEMS[id].category === 'FISH' || id === 'item_scale' || id === 'item_pearl' || id === 'FOOD_FISH',
);

/** Every id the Aquarium needs in the manifest. */
export const aquariumArtIds = (): string[] => [
  ...Object.values(TANK_ART),
  ...FISH_LIST.map((f) => f.art),
  ...AQUARIUM_ITEM_IDS.map(itemArtId),
];
