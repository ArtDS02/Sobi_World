// Asset ids the Adventure draws (every id resolves through the manifest; `npm run assets:check` requires them): the HUD, the enemies,
// the zone pictures, the items it brings, the props of its areas and the things on them (chests, portals, element gates, springs,
// travellers, lore stones, shrines, resource spots). Ground tiles (`adv_tile_<zone>_<kind>`) are optional: the scene paints flat
// colours until they exist (GĐ14, docs/ASSET_TODO.md).
import { AREA_HUD_ART, itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { ELEMENTS } from '../../../systems/combat/types';
import { ENEMY_LIST, PROP_LIST, SKILL_SCROLL, ZONE_LIST } from './config/content';

/** Materials and rations the Adventure introduced (GĐ10 forest drops, GĐ11 mountain, ruins and field kitchen, the Skill Scroll). */
const ADVENTURE_MATERIALS = ['item_forest_herb', 'item_beast_fang', 'item_mountain_ore', 'item_ancient_cog', 'item_ancient_rune', 'item_ration_hearty', 'item_ration_spicy', 'item_ration_swift', 'item_pig_egg_wild', SKILL_SCROLL];

/** Items the Adventure introduced: the equipment and the materials and rations it brings. */
export const ADVENTURE_ITEM_IDS = ITEM_IDS.filter((id) => ITEMS[id].category === 'EQUIPMENT' || ADVENTURE_MATERIALS.includes(id));

/** The things on a map: id → the states its row must have (none = one picture). */
export const THING_ART: Readonly<Record<string, readonly string[]>> = {
  adv_chest: ['closed', 'open'],
  adv_portal: ['off', 'on'],
  adv_spring: [],
  adv_npc_traveler: [],
  adv_lore_stone: [],
  adv_shrine: [],
  adv_node_herb: [],
  adv_node_ore: [],
  ...Object.fromEntries(ELEMENTS.filter((e) => e !== 'VOID').map((e) => [`adv_gate_${e.toLowerCase()}`, []])),
};

/** Every id the Adventure needs in the manifest. */
export const adventureArtIds = (): string[] => [
  ...Object.values(AREA_HUD_ART),
  ...ENEMY_LIST.map((e) => e.art),
  ...ZONE_LIST.map((z) => z.backdrop),
  ...ADVENTURE_ITEM_IDS.map(itemArtId),
  ...PROP_LIST.map((p) => p.art),
  ...Object.keys(THING_ART),
];
