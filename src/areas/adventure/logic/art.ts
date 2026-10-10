// Asset ids the Adventure draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { ENEMY_LIST, ZONE_LIST } from './config/content';

/** Items the Adventure introduced: the equipment and the two materials its monsters drop. */
export const ADVENTURE_ITEM_IDS = ITEM_IDS.filter((id) => ITEMS[id].category === 'EQUIPMENT' || id === 'item_forest_herb' || id === 'item_beast_fang');

/** Every id the Adventure needs in the manifest. */
export const adventureArtIds = (): string[] => [...ENEMY_LIST.map((e) => e.art), ...ZONE_LIST.map((z) => z.backdrop), ...ADVENTURE_ITEM_IDS.map(itemArtId)];
