// Small helpers of a body's pose (battlePose.ts): easing, how long each reaction plays, a stable hash of a unit's id and the small idle
// movements that keep a standing body alive (ANIM-100). Pure.
import type { ReactionKind } from './battleMotion';

export interface Pt {
  x: number;
  y: number;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
export const easeIn = (t: number) => t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** How long each reaction plays (ms). */
export const REACT_MS: Readonly<Record<ReactionKind, number>> = { hit: 520, 'hit-heavy': 700, 'hit-crit': 780, heal: 620, buff: 560, debuff: 620, miss: 480, ko: 640 };

/** A bump that rises fast and settles (0 → 1 → 0 over t ∈ [0, 1]). */
export const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.18 ? easeOut(t / 0.18) : 1 - easeInOut((t - 0.18) / 0.82));

/**
 * The small life of a body that is just standing: its weight shifts side to side, now and then (every 4–7 s, its own rhythm) an ear or
 * a tail twitches for half a second, and one near death sways. Each unit has its own phase, so two neighbours are never in step.
 */
export function idleLife(id: string, now: number, low: boolean): { dx: number; rot: number } {
  const h = hash(id) >>> 0;
  const every = 4000 + (h % 3000);
  const into = (now + (h % every)) % every;
  const twitch = into < 500 ? Math.sin((into / 500) * Math.PI * 2) * 3 * (h % 2 === 0 ? 1 : -1) : 0;
  return { dx: Math.sin((now / 2600 + (h % 97) / 97) * Math.PI * 2) * 3, rot: twitch + (low ? Math.sin(now / 260) * 1.6 : 0) };
}
