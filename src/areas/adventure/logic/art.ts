// Asset ids the Adventure draws (every id resolves through the manifest; `npm run assets:check` requires them): the HUD, the enemies,
// the zone pictures, the items it brings, the props of its areas and the things on them (chests, portals, element gates, springs,
// travellers, lore stones, shrines, resource spots). Ground tiles (`adv_tile_<zone>_<kind>`) are optional: the scene paints flat
// colours until they exist (GĐ14, docs/ASSET_TODO.md).
import { AREA_HUD_ART, itemArtId } from '../../../core/config/assetIds';
import { ITEMS, ITEM_IDS } from '../../../core/config/items';
import { ELEMENTS } from '../../../systems/combat/types';
import { ENEMY_LIST, PROP_LIST, SKILL_SCROLL, ZONE_LIST, type LineageId } from './config/content';

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

/** The First Guardian each lineage descends from: the portrait on the fighter sheet. */
export const GUARDIAN_ART: Readonly<Record<LineageId, string>> = {
  nam_hai: 'guardian_whale',
  quy_son: 'guardian_turtle',
  da_mac: 'guardian_octopus',
  quang_tru: 'guardian_light_pig',
  loi_duong: 'guardian_thunder_pig',
  thiet_giap: 'guardian_metal_boar',
  hoa_giai: 'guardian_forge_crab',
  moc_mau: 'guardian_bloom_sow',
  hu_khong: 'guardian_void_jelly',
};

/** The legend picture of the nine First Guardians, over the camp. */
export const GUARDIANS_LEGEND_ART = 'bg_first_guardians';

/** The camp's dressing on the owner's mock-up (batches adventure-03 / 05): the sign, the beast peeking over it, the plaque, the corner
 *  leaves, and the camp's own painting behind the board. */
export const CAMP_ART = {
  sign: 'ui_adv_sign_title',
  peek: 'ui_adv_peek_beast',
  plaque: 'ui_adv_plaque',
  leaves: 'ui_adv_corner_leaves',
  backdrop: 'bg_adventure_camp',
} as const;

/** The badges of the elements, classes and plain actions (skills have their own icons, `ui_` + id, optional). */
export const ICON_ART_IDS = [
  ...ELEMENTS.map((e) => `ui_icon_elem_${e.toLowerCase()}`),
  ...['tanker', 'striker', 'mage', 'support'].map((c) => `ui_icon_class_${c}`),
  ...['attack', 'skill', 'guard', 'ultimate', 'flee', 'auto', 'speed', 'map', 'camp', 'formation', 'sweep', 'interact'].map((a) => `ui_icon_adv_${a}`),
];

/** Every id the Adventure needs in the manifest. */
export const adventureArtIds = (): string[] => [
  ...Object.values(AREA_HUD_ART),
  ...ENEMY_LIST.map((e) => e.art),
  ...ZONE_LIST.map((z) => z.backdrop),
  ...ADVENTURE_ITEM_IDS.map(itemArtId),
  ...PROP_LIST.map((p) => p.art),
  ...Object.keys(THING_ART),
  ...Object.values(GUARDIAN_ART),
  GUARDIANS_LEGEND_ART,
  ...Object.values(CAMP_ART),
  ...ICON_ART_IDS,
];
