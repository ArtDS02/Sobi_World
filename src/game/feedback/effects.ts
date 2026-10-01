// What the director asks of the farm scene. MainFarmScene implements it; until the scene runs,
// the no-op version is used so early events never throw.
import type { FxId } from '../../core/config/assetIds';
import type { FeedbackTarget } from './feedbackPlan';
import type { AnimationId } from './feedbackTable';

export interface FarmEffects {
  animate(animation: AnimationId, target: FeedbackTarget, delayMs: number): void;
  burst(fx: FxId, target: FeedbackTarget, delayMs: number): void;
}

export const noEffects: FarmEffects = { animate: () => {}, burst: () => {} };
