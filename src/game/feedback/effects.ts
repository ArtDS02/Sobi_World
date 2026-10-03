// What the director asks of the farm scene. MainFarmScene implements it; until the scene runs,
// the no-op version is used so early events never throw.
import type { FxId } from '../../core/config/assetIds';
import type { GameEvent } from '../../core/events';
import type { FeedbackTarget } from './feedbackPlan';
import type { AnimationId } from './feedbackTable';

export interface FarmEffects {
  animate(
    animation: AnimationId,
    target: FeedbackTarget,
    delayMs: number,
    from?: FeedbackTarget,
  ): void;
  burst(fx: FxId, target: FeedbackTarget, delayMs: number): void;
  /** Text lines rising and fading from the target (gift rewards, U06). */
  float(lines: readonly string[], target: FeedbackTarget, delayMs: number): void;
  /** A world event the pigs' life simulation reacts to (PL-1: a pig walks over to eat). */
  life(event: GameEvent): void;
}

export const noEffects: FarmEffects = {
  animate: () => {},
  burst: () => {},
  float: () => {},
  life: () => {},
};
