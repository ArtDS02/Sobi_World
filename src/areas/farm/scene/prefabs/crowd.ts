// Pigs on the farm as a crowd: where the others are (strolls keep clear) and the gentle push that
// separates pigs standing too close (names never stack). Visual only.
import { FARM_VIEW } from '../../../../core/config/farmView';
import { separation } from '../state/wander';
import type { PigSprite } from './PigSprite';

type Crowd = ReadonlyMap<string, Pick<PigSprite, 'dest' | 'stand' | 'nudge'>>;

/** Where every other pig stands or heads to. */
export const othersOf = (pigs: Crowd, pigId: string) =>
  [...pigs].filter(([id]) => id !== pigId).flatMap(([, p]) => p.dest() ?? []);

/** One frame of separation at WANDER.pushPx per second. */
export function spreadCrowd(pigs: Crowd, dtMs: number) {
  const at = [...pigs].flatMap(([id, p]) => {
    const f = p.stand();
    return f ? [{ id, x: f.x, y: f.y }] : [];
  });
  for (const [id, d] of separation(at, (FARM_VIEW.WANDER.pushPx * dtMs) / 1000)) {
    pigs.get(id)?.nudge(d.dx, d.dy);
  }
}
