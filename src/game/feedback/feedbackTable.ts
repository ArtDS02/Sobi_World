// The presentation contract (spec §11.3) as data: one row per GameEvent type. Adding an event is
// one row here. Order per event is fixed by the director: animation → VFX → sound → toast.
import type { AudioKey, FxId } from '../../core/config/assetIds';
import type { GameEventType } from '../../core/events';

export type AnimationId =
  | 'bounce'
  | 'eat'
  | 'shake'
  | 'clean'
  | 'happy'
  | 'exit'
  | 'popIn'
  | 'grow'
  | 'wiggle'
  | 'giftSpawn'
  | 'giftOpen';

export interface FeedbackRow {
  animation: AnimationId | null;
  vfx: FxId[];
  sound: AudioKey | null;
  toast: boolean;
  /** Several pigs animate one after another (FEEDBACK.STAGGER_MS apart). */
  stagger?: boolean;
  /** Reward amounts rise from the target as text (U06); a toast instead under reduceMotion. */
  float?: boolean;
}

const row = (
  animation: AnimationId | null,
  vfx: FxId[],
  sound: AudioKey | null,
  toast: boolean,
  stagger = false,
): FeedbackRow => ({ animation, vfx, sound, toast, ...(stagger ? { stagger } : {}) });

export const FEEDBACK_TABLE: Record<GameEventType, FeedbackRow> = {
  PIG_BOUGHT: row('bounce', ['fx_sparkle'], 'ui_click', true),
  PIG_FED: row('eat', ['fx_crumb'], 'feed_munch', false),
  TROUGH_FILLED: row('shake', ['fx_crumb'], 'feed_munch', false),
  PIG_CLEANED: row('clean', ['fx_bubble'], 'water_splash', false, true),
  PIG_TREATED: row('happy', ['fx_sparkle'], 'ui_click', true),
  PIG_SOLD: row('exit', ['fx_coin'], 'coin_collect', true),
  BREEDING_STARTED: row('happy', ['fx_heart'], 'breed_chime', true),
  BIRTH: row('popIn', ['fx_heart', 'fx_sparkle'], 'birth_fanfare', true),
  PIG_BECAME_ADULT: row('grow', ['fx_sparkle'], 'level_up', true),
  PIG_BECAME_SICK: row(null, ['fx_sick'], 'notify', true),
  LEVEL_UP: row(null, ['fx_sparkle'], 'level_up', true),
  TROUGH_EMPTY: row('wiggle', [], 'notify', true),
  ORDER_NEW: row('wiggle', [], 'notify', true),
  ORDER_FULFILLED: row(null, ['fx_coin'], 'coin_collect', true),
  DISCOVERY: row(null, ['fx_coin'], 'coin_collect', true),
  // U06: small smoke puff then the box pops in; opening pops it and the reward floats up.
  GIFT_SPAWNED: row('giftSpawn', ['fx_smoke'], 'notify', false),
  GIFT_OPENED: { ...row('giftOpen', ['fx_sparkle'], 'coin_collect', false), float: true },
  SLOT_BOUGHT: row(null, [], 'ui_click', true),
  ITEM_BOUGHT: row(null, [], 'ui_click', true),
  PIG_RENAMED: row(null, [], 'ui_click', true),
  // The toggle itself is the feedback (the button's ui_click; music starts / stops).
  SETTING_CHANGED: row(null, [], null, false),
  // Not in the §11.3 table: toast only, as before (DECISIONS R05B-1).
  PIG_HUNGRY_ZERO: row(null, [], null, true),
  ORDER_EXPIRED: row(null, [], null, true),
};

/** Rejected action (`ok: false`): error sound + toast with the reason. */
export const REJECT_ROW: FeedbackRow = row(null, [], 'ui_error', true);
