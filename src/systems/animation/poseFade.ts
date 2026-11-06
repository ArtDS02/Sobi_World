// How a pose-to-pose skin crossfades from one approved drawing to the next (decision 050, 2026-11-06 (5)). The first change of
// drawing right after a clip starts (stand → fly, run → stand, rest → the hurt drawing) is the biggest jump, so it takes the clip's
// own crossfade time; a change inside a clip takes the clip's `poseFade` (a drawn move cycle: short) or the skin's. The weight eases
// in and out (smoothstep) so the new drawing does not pop at the start or snap at the end.
import type { RigData } from '../../../content/schemas/anim/rig';

/** Crossfade (ms) for a change of drawing that happens `sinceStart` ms after clip `clipName` started. */
export function poseFadeMs(rig: RigData, clipName: string, sinceStart: number): number {
  const clip = rig.clips[clipName];
  const inside = clip?.poseFade ?? rig.skin?.poseFade ?? 0;
  if (!clip || sinceStart >= clip.fade) return inside;
  return Math.max(inside, clip.fade);
}

/** Opacity of the incoming drawing `elapsed` ms into a crossfade of `ms` (0 → 1, eased; 1 when there is no fade). */
export function fadeWeight(elapsed: number, ms: number): number {
  if (ms <= 0) return 1;
  const k = Math.min(1, Math.max(0, elapsed / ms));
  return k * k * (3 - 2 * k);
}

/** The order three drawn in-between frames loop in (the battle move clip, the Aquarium swim, the Cloud bird's wings): 1 → 2 → 3 → 2. */
export const LOOP_FRAME_ORDER = [0, 1, 2, 1] as const;

/** One of the three drawn loop frames (0 = move 1). */
export type LoopFrame = (typeof LOOP_FRAME_ORDER)[number];

/**
 * Which of three looping drawn frames shows at `phase` (one cycle = 2π walks 1 → 2 → 3 → 2): `from` holds, then over the last
 * `fade` share of its quarter `to` dissolves in over it with eased weight `w` (0 = only `from`).
 */
export function loopFrameAt(phase: number, fade: number): { from: LoopFrame; to: LoopFrame; w: number } {
  const turn = phase / (Math.PI * 2);
  const q = (turn - Math.floor(turn)) * 4;
  const i = Math.min(3, Math.floor(q));
  const k = fade <= 0 ? 0 : Math.min(1, Math.max(0, (q - i - (1 - fade)) / fade));
  return { from: LOOP_FRAME_ORDER[i]!, to: LOOP_FRAME_ORDER[(i + 1) % 4]!, w: k * k * (3 - 2 * k) };
}
