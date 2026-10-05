// Event + origin + reduceMotion → the concrete feedback steps (spec §11.3). Pure, unit tested;
// the director only executes the plan.
import type { AudioKey, FxId } from '../../../../core/config/assetIds';
import { FEEDBACK } from '../../../../core/config/feedback';
import type { GameEvent } from '../../../../core/events';
import type { EventOrigin } from '../../store';
import { formatInt, t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import { FEEDBACK_TABLE, type AnimationId } from './feedbackTable';

/** What a step plays on: a pig sprite, the trough, the order board, or the top of the scene. */
export type FeedbackTarget =
  | { kind: 'pig'; pigId: string }
  | { kind: 'gift'; giftId: string }
  | { kind: 'trough' }
  | { kind: 'board' }
  | { kind: 'top' };

export interface FeedbackPlan {
  animations: {
    animation: AnimationId;
    target: FeedbackTarget;
    delayMs: number;
    /** Start point of the animation (BIRTH: the newborn pops in at its mother). */
    from?: FeedbackTarget;
  }[];
  vfx: { fx: FxId; target: FeedbackTarget; delayMs: number }[];
  /** Text lines rising from the target (gift rewards, U06). */
  floats: { lines: string[]; target: FeedbackTarget; delayMs: number }[];
  sound: AudioKey | null;
  toast: boolean;
  /** Hand the event to the life simulation (PL-1); never for catch-up or reduceMotion. */
  life: boolean;
}

const pig = (pigId: string): FeedbackTarget => ({ kind: 'pig', pigId });

/** Where an event happens on the farm. */
export function eventTargets(e: GameEvent): FeedbackTarget[] {
  switch (e.type) {
    case 'PIG_CLEANED':
      return e.pigIds.map(pig);
    case 'BIRTH':
      return [pig(e.motherId)]; // the child waits in the nursery (BR-1)
    case 'BREEDING_STARTED':
      return [pig(e.motherId), pig(e.fatherId)];
    case 'TROUGH_FILLED':
    case 'TROUGH_EMPTY':
      return [{ kind: 'trough' }];
    case 'ORDER_NEW':
    case 'ORDER_FULFILLED':
    case 'ORDER_EXPIRED':
      return [{ kind: 'board' }];
    case 'GIFT_SPAWNED':
    case 'GIFT_OPENED':
      return [{ kind: 'gift', giftId: e.giftId }];
    case 'LEVEL_UP':
    case 'DISCOVERY':
    case 'SLOT_BOUGHT':
    case 'ITEM_BOUGHT':
      return [{ kind: 'top' }];
    default:
      return 'pigId' in e ? [pig(e.pigId)] : [];
  }
}

/** §11.3: coin_collect also plays for any event with gold > 0 that has no sound of its own. */
function soundOf(e: GameEvent, sound: AudioKey | null): AudioKey | null {
  if (sound) return sound;
  return 'gold' in e && e.gold > 0 ? 'coin_collect' : null;
}

const still = { animations: [], vfx: [], floats: [], life: false };

/** Reward lines of an event that floats (gift: gold and XP). */
function floatLines(e: GameEvent): string[] {
  if (e.type !== 'GIFT_OPENED') return [];
  return [t(vi.farm.giftGold, { n: formatInt(e.gold) }), t(vi.farm.giftXp, { n: formatInt(e.xp) })];
}

export function feedbackPlan(
  e: GameEvent,
  origin: EventOrigin,
  reduceMotion: boolean,
): FeedbackPlan {
  const row = FEEDBACK_TABLE[e.type];
  // Catch-up events are never replayed as presentation (§9.5): the toast stays until the away
  // summary exists (R11, DECISIONS R05B-1).
  // NH-1: care-level drops while away are not toasted one by one (the away summary covers them).
  if (origin === 'catchup') {
    return { ...still, sound: null, toast: row.toast && e.type !== 'PIG_NEED_DROPPED' };
  }
  const sound = soundOf(e, row.sound);
  if (reduceMotion) return { ...still, sound, toast: row.toast || !!row.float };
  const life = !!row.life;

  const targets = eventTargets(e);
  const delay = (i: number) => (row.stagger ? i * FEEDBACK.STAGGER_MS : 0);
  const animation = row.animation;
  return {
    animations: animation
      ? targets.map((target, i) => ({
          animation,
          target,
          delayMs: delay(i),
        }))
      : [],
    vfx: targets.flatMap((target, i) => row.vfx.map((fx) => ({ fx, target, delayMs: delay(i) }))),
    floats: row.float
      ? targets.map((target) => ({ lines: floatLines(e), target, delayMs: 0 }))
      : [],
    sound,
    toast: row.toast,
    life,
  };
}
