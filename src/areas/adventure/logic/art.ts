// Asset ids the Adventure draws (every id resolves through the manifest; `npm run assets:check` requires them).
import { AREA_HUD_ART, itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { ENEMY_LIST, ZONE_LIST } from './config/content';

/** Materials and rations the Adventure introduced (GĐ10 forest drops, GĐ11 mountain, ruins and field kitchen). */
const ADVENTURE_MATERIALS = ['item_forest_herb', 'item_beast_fang', 'item_mountain_ore', 'item_ancient_cog', 'item_ancient_rune', 'item_ration_hearty', 'item_ration_spicy', 'item_ration_swift', 'item_pig_egg_wild'];

/** Items the Adventure introduced: the equipment and the materials and rations it brings. */
export const ADVENTURE_ITEM_IDS = ITEM_IDS.filter((id) => ITEMS[id].category === 'EQUIPMENT' || ADVENTURE_MATERIALS.includes(id));

/** Every id the Adventure needs in the manifest. */
export const adventureArtIds = (): string[] => [...Object.values(AREA_HUD_ART), ...ENEMY_LIST.map((e) => e.art), ...ZONE_LIST.map((z) => z.backdrop), ...ADVENTURE_ITEM_IDS.map(itemArtId)];
