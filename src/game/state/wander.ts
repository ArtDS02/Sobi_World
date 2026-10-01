// Wandering targets (spec §11, art standard §2.4): visual only, inside layout.walkArea, near the
// pig's home spot. Deterministic per (pig id, step) so tests and replays agree; never saved.
import { FARM_VIEW } from '../../core/config/farmView';
import { hashId, type FarmLayout } from '../view/pigView';

const unit = (pigId: string, step: number, salt: number) =>
  (hashId(`${pigId}:${step}:${salt}`) % 10007) / 10006;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Next stroll target in design px: within WANDER.radius of home, clamped to the walk area. */
export function wanderTarget(
  pigId: string,
  step: number,
  home: { x: number; y: number },
  layout: FarmLayout,
): { x: number; y: number } {
  const { width, height } = layout.designSize;
  const a = layout.walkArea;
  const r = FARM_VIEW.WANDER.radius;
  const nx = home.x / width + (unit(pigId, step, 1) * 2 - 1) * r;
  const ny = home.y / height + (unit(pigId, step, 2) * 2 - 1) * r * FARM_VIEW.WANDER.yRatio;
  return {
    x: clamp(nx, a.x, a.x + a.width) * width,
    y: clamp(ny, a.y, a.y + a.height) * height,
  };
}

/** Pause before the next stroll, ms. */
export function restMs(pigId: string, step: number): number {
  const w = FARM_VIEW.WANDER;
  return w.restMinMs + unit(pigId, step, 3) * (w.restMaxMs - w.restMinMs);
}

/**
 * Whether the rest after stroll `step` is a nap (sleep state, DECISIONS R09B-1): visual only,
 * the spec has no data rule for sleeping.
 */
export const napsDuring = (pigId: string, step: number): boolean =>
  unit(pigId, step, 4) < FARM_VIEW.WANDER.napChance;

/** Time to walk `distancePx` at WANDER.speedPx, never shorter than one squash cycle. */
export const walkMs = (distancePx: number): number =>
  Math.max(FARM_VIEW.WANDER.minWalkMs, (distancePx / FARM_VIEW.WANDER.speedPx) * 1000);

/** Facing after moving from `fromX` to `toX`: left when the target is to the left. */
export const facesLeft = (fromX: number, toX: number, current: boolean): boolean =>
  toX === fromX ? current : toX < fromX;
