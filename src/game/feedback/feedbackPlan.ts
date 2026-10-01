// Event + origin + reduceMotion → the concrete feedback steps (spec §11.3). Pure, unit tested;
// the director only executes the plan.
import type { AudioKey, FxId } from '../../core/config/assetIds';
import { FEEDBACK } from '../../core/config/feedback';
import type { GameEvent } from '../../core/events';
import type { EventOrigin } from '../../store/gameStore';
import { FEEDBACK_TABLE, type AnimationId } from './feedbackTable';

/** What a step plays on: a pig sprite, the trough, the order board, or the top of the scene. */
export type FeedbackTarget =
  { kind: 'pig'; pigId: string } | { kind: 'trough' } | { kind: 'board' } | { kind: 'top' };

export interface FeedbackPlan {
  animations: {
    animation: AnimationId;
    target: FeedbackTarget;
    delayMs: number;
    /** Start point of the animation (BIRTH: the newborn pops in at its mother). */
    from?: FeedbackTarget;
  }[];
  vfx: { fx: FxId; target: FeedbackTarget; delayMs: number }[];
  sound: AudioKey | null;
  toast: boolean;
}

const pig = (pigId: string): FeedbackTarget => ({ kind: 'pig', pigId });

/** Where an event happens on the farm. */
export function eventTargets(e: GameEvent): FeedbackTarget[] {
  switch (e.type) {
    case 'PIG_CLEANED':
      return e.pigIds.map(pig);
    case 'BIRTH':
      return [pig(e.childId)];
    case 'BREEDING_STARTED':
      return [pig(e.motherId), pig(e.fatherId)];
    case 'TROUGH_FILLED':
    case 'TROUGH_EMPTY':
      return [{ kind: 'trough' }];
    case 'ORDER_NEW':
    case 'ORDER_FULFILLED':
    case 'ORDER_EXPIRED':
      return [{ kind: 'board' }];
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

export function feedbackPlan(
  e: GameEvent,
  origin: EventOrigin,
  reduceMotion: boolean,
): FeedbackPlan {
  const row = FEEDBACK_TABLE[e.type];
  // Catch-up events are never replayed as presentation (§9.5): the toast stays until the away
  // summary exists (R11, DECISIONS R05B-1).
  if (origin === 'catchup') return { animations: [], vfx: [], sound: null, toast: row.toast };
  const sound = soundOf(e, row.sound);
  if (reduceMotion) return { animations: [], vfx: [], sound, toast: row.toast };

  const targets = eventTargets(e);
  const delay = (i: number) => (row.stagger ? i * FEEDBACK.STAGGER_MS : 0);
  const animation = row.animation;
  return {
    animations: animation
      ? targets.map((target, i) => ({
          animation,
          target,
          delayMs: delay(i),
          ...(e.type === 'BIRTH' ? { from: pig(e.motherId) } : {}),
        }))
      : [],
    vfx: targets.flatMap((target, i) => row.vfx.map((fx) => ({ fx, target, delayMs: delay(i) }))),
    sound,
    toast: row.toast,
  };
}
