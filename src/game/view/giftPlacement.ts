// Where a gift box sits (U06). Pure: seed → candidate points inside the walk area; a point is
// valid when it is clear of world objects, pig homes and other gifts. Limited retries, then the
// candidate with the most room wins. The save keeps only the seed, so a box stays put on reload.
import { FARM_VIEW } from '../../core/config/farmView';
import { mulberry32 } from '../../core/rng';
import type { FarmLayout } from './pigView';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface GiftSurroundings {
  obstacles: readonly Rect[];
  pigHomes: readonly Point[];
  gifts: readonly Point[];
}

/** Distance from p to the nearest edge of r (0 inside). */
function rectDistance(p: Point, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.width));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.height));
  return Math.hypot(dx, dy);
}

/** How much room `p` has: the smallest margin over every rule (negative = rule broken). */
function room(p: Point, around: GiftSurroundings): number {
  const S = FARM_VIEW.GIFT_SPOT;
  const margins = [
    ...around.obstacles.map((r) => rectDistance(p, r) - S.clearPx),
    ...around.pigHomes.map((h) => Math.hypot(h.x - p.x, h.y - p.y) - S.pigHomePx),
    ...around.gifts.map((g) => Math.hypot(g.x - p.x, g.y - p.y) - S.giftPx),
  ];
  return margins.length === 0 ? Infinity : Math.min(...margins);
}

export function giftSpot(seed: number, layout: FarmLayout, around: GiftSurroundings): Point {
  const S = FARM_VIEW.GIFT_SPOT;
  const { width, height } = layout.designSize;
  const w = layout.walkArea;
  const left = w.x * width + S.marginPx;
  const top = w.y * height + S.marginPx;
  const spanX = Math.max(0, w.width * width - 2 * S.marginPx);
  const spanY = Math.max(0, w.height * height - 2 * S.marginPx);
  const rng = mulberry32(seed);
  let best: Point = { x: left + spanX / 2, y: top + spanY / 2 };
  let bestRoom = -Infinity;
  for (let i = 0; i < S.tries; i += 1) {
    const p = { x: left + rng.next() * spanX, y: top + rng.next() * spanY };
    const r = room(p, around);
    if (r >= 0) return p;
    if (r > bestRoom) {
      best = p;
      bestRoom = r;
    }
  }
  return best;
}
