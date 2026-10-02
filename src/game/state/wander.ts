// Wandering targets (spec §11, art standard §2.4): visual only, anywhere in the ellipse inscribed
// in layout.walkArea. Deterministic per (pig id, step) so tests and replays agree; never saved.
import { FARM_VIEW } from '../../core/config/farmView';
import { hashId, type FarmLayout } from '../view/pigView';

const unit = (pigId: string, step: number, salt: number) =>
  (hashId(`${pigId}:${step}:${salt}`) % 10007) / 10006;

/** The walk ellipse inscribed in layout.walkArea, in design px. */
export function walkEllipse(layout: FarmLayout) {
  const { width, height } = layout.designSize;
  const a = layout.walkArea;
  return {
    cx: (a.x + a.width / 2) * width,
    cy: (a.y + a.height / 2) * height,
    rx: (a.width / 2) * width,
    ry: (a.height / 2) * height,
  };
}

/** Point of the ellipse for unit square coordinates (u, v), area-uniform. */
export function ellipsePoint(layout: FarmLayout, u: number, v: number) {
  const e = walkEllipse(layout);
  const r = Math.sqrt(u);
  const t = v * Math.PI * 2;
  return { x: e.cx + Math.cos(t) * r * e.rx, y: e.cy + Math.sin(t) * r * e.ry };
}

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

/** Pause before the next stroll, ms: a short rest, or a long one when napping. */
export function restMs(pigId: string, step: number, nap = false): number {
  const w = FARM_VIEW.WANDER;
  const [min, max] = nap ? [w.napMinMs, w.napMaxMs] : [w.restMinMs, w.restMaxMs];
  return min + unit(pigId, step, 3) * (max - min);
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

/** Walk distance for a move: vertical moves count longer (slower, WANDER.ySpeed). */
export const walkDistance = (dx: number, dy: number): number =>
  Math.hypot(dx, dy / FARM_VIEW.WANDER.ySpeed);

/** Facing after moving from `fromX` to `toX`: left when the target is to the left. */
export const facesLeft = (fromX: number, toX: number, current: boolean): boolean =>
  toX === fromX ? current : toX < fromX;

/** `p` moved inside the walk ellipse (unchanged when already in). */
export function clampToEllipse(layout: FarmLayout, p: { x: number; y: number }) {
  const e = walkEllipse(layout);
  const nx = (p.x - e.cx) / e.rx;
  const ny = (p.y - e.cy) / e.ry;
  const d = Math.hypot(nx, ny);
  return d <= 1 ? p : { x: e.cx + (nx / d) * e.rx, y: e.cy + (ny / d) * e.ry };
}

/**
 * Gentle push between standing pigs closer than WANDER.minGapPx (names never stack): each one of a
 * pair moves half the overlap away, at most `maxStep` px. Coincident pigs split by id. Pure.
 */
export function separation(
  pigs: readonly { id: string; x: number; y: number }[],
  maxStep: number,
): Map<string, { dx: number; dy: number }> {
  const gap = FARM_VIEW.WANDER.minGapPx;
  const out = new Map<string, { dx: number; dy: number }>();
  const add = (id: string, dx: number, dy: number) => {
    const o = out.get(id) ?? { dx: 0, dy: 0 };
    out.set(id, { dx: o.dx + dx, dy: o.dy + dy });
  };
  for (let i = 0; i < pigs.length; i++) {
    for (let j = i + 1; j < pigs.length; j++) {
      const a = pigs[i]!;
      const b = pigs[j]!;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= gap) continue;
      if (d < 1e-6) {
        const t = (hashId(`${a.id}|${b.id}`) % 360) * (Math.PI / 180);
        dx = Math.cos(t);
        dy = Math.sin(t);
      } else {
        dx /= d;
        dy /= d;
      }
      const step = Math.min(maxStep, (gap - d) / 2);
      add(a.id, -dx * step, -dy * step);
      add(b.id, dx * step, dy * step);
    }
  }
  return out;
}
