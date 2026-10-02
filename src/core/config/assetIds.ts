// Asset ids the game rules reference (spec §11, §12; art standard §3.1, §7.4). Paths never live
// in src/: every id resolves through public/assets/manifest/assets.json.

/** The 12 canonical audio keys (spec §12). */
export const AUDIO_KEYS = [
  'music_farm',
  'ui_click',
  'ui_error',
  'pig_oink_happy',
  'pig_oink_hungry',
  'feed_munch',
  'water_splash',
  'coin_collect',
  'breed_chime',
  'birth_fanfare',
  'level_up',
  'notify',
] as const;
export type AudioKey = (typeof AUDIO_KEYS)[number];

/** The shared overlays and particles (art standard §3.1; fx_smoke: gift spawn, U06). */
export const FX_IDS = [
  'fx_sick',
  'fx_pregnant',
  'fx_zzz',
  'fx_heart',
  'fx_bubble',
  'fx_crumb',
  'fx_sparkle',
  'fx_coin',
  'fx_smoke',
] as const;
export type FxId = (typeof FX_IDS)[number];

/** What clicking a world placement opens (layout.placements[].action, DECISIONS R05C-1). */
export const FARM_ACTIONS = [
  'shop',
  'inventory',
  'orders',
  'collection',
  'trough',
  'cleanAll',
] as const;
export type FarmAction = (typeof FARM_ACTIONS)[number];

export const TROUGH_PROP_ID = 'prop_feed_trough';
export const ORDER_BOARD_PROP_ID = 'prop_order_board';
export const GIFT_PROP_ID = 'prop_gift_box'; // U06
/** Signed objects whose seasonal art has no painted sign: they get a text tag in season (SE-1). */
export const SEASON_UNSIGNED_IDS: readonly string[] = ['prop_water_well'];
export const SLEEP_FALLBACK_FX: FxId = 'fx_zzz'; // DECISIONS Q5

/** DOM icons (spec §11.1 DOM layer: ui_*), by what they label. Resolved through the manifest. */
export const UI_ICON = {
  gold: 'ui_icon_gold',
  xp: 'ui_icon_xp',
  trough: 'ui_icon_trough',
  orders: 'ui_icon_order',
  collection: 'ui_icon_collection',
  hunger: 'ui_icon_hunger',
  cleanliness: 'ui_icon_cleanliness',
  health: 'ui_icon_health',
  happiness: 'ui_icon_happiness',
  growth: 'ui_icon_growth',
  feed: 'ui_btn_feed',
  clean: 'ui_btn_clean',
  cleanAll: 'ui_btn_clean_all',
  treat: 'ui_btn_heal',
  breed: 'ui_btn_breed',
  shop: 'ui_btn_shop',
  fillTrough: 'ui_btn_fill_trough',
} as const;
export type UiIcon = keyof typeof UI_ICON;

/** Ambient life (spec §11.1 "clouds may drift slowly"): placements that drift or sway. */
export const AMBIENT_DRIFT_PREFIX = 'env_cloud_';
export const AMBIENT_SWAY_IDS: readonly string[] = ['env_trees_mid', 'env_ground_grass'];

/** Trough sprite states (environment catalogue §1). */
export const TROUGH_STATES = ['empty', 'half', 'full'] as const;
export type TroughState = (typeof TROUGH_STATES)[number];

/** Anchor names on the 512 x 512 pig canvas (art standard §5). */
export const ANCHOR_NAMES = [
  'head',
  'face',
  'body',
  'back',
  'hand_prop',
  'feet',
  'fx_above',
] as const;

export type AnchorName = (typeof ANCHOR_NAMES)[number];

/** Feet line of every pig canvas (art standard §4.1). */
export const PIG_FEET_Y = 0.82;

/** Default anchors when a pig has no `*.anchors.json` (art standard §5). */
export const DEFAULT_ANCHORS: Record<AnchorName, { x: number; y: number }> = {
  head: { x: 0.53, y: 0.25 },
  face: { x: 0.58, y: 0.31 },
  body: { x: 0.48, y: 0.5 },
  back: { x: 0.3, y: 0.46 },
  hand_prop: { x: 0.64, y: 0.61 },
  feet: { x: 0.5, y: PIG_FEET_Y },
  fx_above: { x: 0.5, y: 0.1 },
};
