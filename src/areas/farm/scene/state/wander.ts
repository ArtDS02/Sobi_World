// Wandering targets (spec §11, art standard §2.4): visual only, anywhere in the ellipse inscribed
// in layout.walkArea. Deterministic per (pig id, step) so tests and replays agree; never saved.
import {
  clampToEllipse as clampTo,
  ellipsePoint as pointOn,
  insideEllipse as inside,
  separation as separate,
  walkEllipse as areaEllipse,
} from '../../../../systems/layout/walkArea';
import { FARM_VIEW } from '../config/farmView';
import { hashId, type FarmLayout } from '../view/pigView';

const unit = (pigId: string, step: number, salt: number) =>
  (hashId(`${pigId}:${step}:${salt}`) % 10007) / 10006;

/** The walk ellipse inscribed in layout.walkArea, in design px (systems/layout). */
export const walkEllipse = (layout: FarmLayout) => areaEllipse(layout.designSize, layout.walkArea);

/** Point of the ellipse for unit square coordinates (u, v), area-uniform. */
export const ellipsePoint = (layout: FarmLayout, u: number, v: number) => pointOn(walkEllipse(layout), u, v);

/**
 * Next stroll target in design px: anywhere in the walk ellipse, re-rolled (up to WANDER.tries)
 * while it lands within WANDER.minGapPx of another pig, so pigs and their names spread out.
 */
export function wanderTarget(
  pigId: string,
  step: number,
  layout: FarmLayout,
  others: readonly { x: number; y: number }[] = [],
): { x: number; y: number } {
  const w = FARM_VIEW.WANDER;
  let best = { x: 0, y: 0 };
  let bestGap = -1;
  for (let i = 0; i < w.tries; i++) {
    const p = ellipsePoint(layout, unit(pigId, step, 10 + i * 2), unit(pigId, step, 11 + i * 2));
    const gap = Math.min(Infinity, ...others.map((o) => Math.hypot(o.x - p.x, o.y - p.y)));
    if (gap >= w.minGapPx) return p;
    if (gap > bestGap) {
      best = p;
      bestGap = gap;
    }
  }
  return best;
}

/** Time to walk `distancePx` at WANDER.speedPx, never shorter than one squash cycle. */
export const walkMs = (distancePx: number): number =>
  Math.max(FARM_VIEW.WANDER.minWalkMs, (distancePx / FARM_VIEW.WANDER.speedPx) * 1000);

/** Walk distance for a move: vertical moves count longer (slower, WANDER.ySpeed). */
export const walkDistance = (dx: number, dy: number): number =>
  Math.hypot(dx, dy / FARM_VIEW.WANDER.ySpeed);

/** Facing after moving from `fromX` to `toX`: left when the target is to the left. */
export const facesLeft = (fromX: number, toX: number, current: boolean): boolean =>
  toX === fromX ? current : toX < fromX;

/** Whether `p` lies inside the walk ellipse (the trough and the house stand outside it). */
export const insideEllipse = (layout: FarmLayout, p: { x: number; y: number }): boolean =>
  inside(walkEllipse(layout), p);

/** `p` moved inside the walk ellipse (unchanged when already in). */
export const clampToEllipse = (layout: FarmLayout, p: { x: number; y: number }) => clampTo(walkEllipse(layout), p);

/**
 * Gentle push between standing pigs closer than WANDER.minGapPx (names never stack): each one of a
 * pair moves half the overlap away, at most `maxStep` px. Coincident pigs split by id. Pure.
 */
export const separation = (
  pigs: readonly { id: string; x: number; y: number }[],
  maxStep: number,
): Map<string, { dx: number; dy: number }> => separate(pigs, FARM_VIEW.WANDER.minGapPx, maxStep, hashId);
