// The presentation contract (spec §11.3) as data: one row per GameEvent type. Adding an event is
// one row here. Order per event is fixed by the director: animation → VFX → sound → toast.
import type { AudioKey, FxId } from '../../../../core/config/assetIds';
import type { GameEventType } from '../../logic/events';

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
  /** Handed to the pigs' life simulation (PL-1), which plays the behaviour itself. */
  life?: boolean;
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
  PIG_ADOPTED: row('bounce', ['fx_heart', 'fx_sparkle'], 'birth_fanfare', true), // BR-1
  PIG_FED: row('eat', ['fx_crumb'], 'feed_munch', false),
  TROUGH_UPGRADED: row('shake', ['fx_sparkle'], 'level_up', true),
  TROUGH_FILLED: row('shake', ['fx_crumb'], 'feed_munch', false),
  PIG_CLEANED: row('clean', ['fx_bubble'], 'water_splash', false, true),
  MANURE_CLEANED: row(null, ['fx_bubble'], 'water_splash', true),
  ITEM_SOLD: row(null, ['fx_coin'], 'coin_collect', true),
  PIG_TREATED: row('happy', ['fx_sparkle'], 'ui_click', true),
  PIG_POTION_USED: row('happy', ['fx_sparkle', 'fx_heart'], 'ui_click', true),
  PIG_SOLD: row('exit', ['fx_coin'], 'coin_collect', true),
  BREEDING_STARTED: row('happy', ['fx_heart'], 'breed_chime', true),
  // BR-1: the newborn goes to the nursery; the mother celebrates on the farm.
  BIRTH: row('happy', ['fx_heart', 'fx_sparkle'], 'birth_fanfare', true),
  PIG_BECAME_ADULT: row('grow', ['fx_sparkle'], 'level_up', true),
  // PL-1: no sound / toast; the life simulation walks the pig to the trough and plays eating.
  PIG_ATE_FROM_TROUGH: { ...row(null, [], null, false), life: true },
  PIG_BECAME_SICK: row(null, ['fx_sick'], 'notify', true),
  PIG_BECAME_CRITICAL: row(null, ['fx_sick'], 'notify', true),
  PIG_DIED: row(null, [], 'notify', true),
  LEVEL_UP: row(null, ['fx_sparkle'], 'level_up', true),
  TROUGH_EMPTY: row('wiggle', [], 'notify', true),
  ORDER_NEW: row('wiggle', [], 'notify', true),
  ORDER_FULFILLED: row(null, ['fx_coin'], 'coin_collect', true),
  DISCOVERY: row(null, ['fx_coin'], 'coin_collect', true),
  // U06: small smoke puff then the box pops in; opening pops it and the reward floats up.
  GIFT_SPAWNED: row('giftSpawn', ['fx_smoke'], 'notify', false),
  GIFT_OPENED: { ...row('giftOpen', ['fx_sparkle'], 'coin_collect', false), float: true },
  SLOT_BOUGHT: row(null, [], 'ui_click', true),
  // PG-1..3: panel rewards; the toast names what arrived (the goals' own are in ui/goals/feedback.ts).
  RELIEF_CLAIMED: row(null, [], 'coin_collect', true),
  DECOR_BOUGHT: row(null, [], 'ui_click', true),
  DECOR_ARRANGED: row(null, [], 'ui_click', true),
  ITEM_BOUGHT: row(null, [], 'ui_click', true),
  PIG_RENAMED: row(null, [], 'ui_click', true),
  // GĐ6: a pet is a small joy (hearts rise); the purpose is a quiet choice.
  PIG_PETTED: row('happy', ['fx_heart'], 'ui_click', true),
  PIG_PURPOSE_SET: row(null, [], 'ui_click', true),
  // GĐ7: a hidden trait opens: a little celebration.
  PIG_TRAIT_REVEALED: row('happy', ['fx_heart', 'fx_sparkle'], 'birth_fanfare', true),
  // The toggle itself is the feedback (the button's ui_click; music starts / stops).
  SETTING_CHANGED: row(null, [], null, false),
  // Not in the §11.3 table: toast only, as before (DECISIONS R05B-1).
  PIG_HUNGRY_ZERO: row(null, [], null, true),
  // NH-1: care level warning, once per drop (never per tick); silent toast.
  PIG_NEED_DROPPED: row(null, [], null, true),
  ORDER_EXPIRED: row(null, [], null, true),
};

/** Rejected action (`ok: false`): error sound + toast with the reason. */
export const REJECT_ROW: FeedbackRow = row(null, [], 'ui_error', true);
