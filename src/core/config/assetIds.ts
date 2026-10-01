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

/** The 8 shared overlays and particles (art standard §3.1). */
export const FX_IDS = [
  'fx_sick',
  'fx_pregnant',
  'fx_zzz',
  'fx_heart',
  'fx_bubble',
  'fx_crumb',
  'fx_sparkle',
  'fx_coin',
] as const;
export type FxId = (typeof FX_IDS)[number];

export const TROUGH_PROP_ID = 'prop_feed_trough';
export const ORDER_BOARD_PROP_ID = 'prop_order_board';
export const SLEEP_FALLBACK_FX: FxId = 'fx_zzz'; // DECISIONS Q5

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
