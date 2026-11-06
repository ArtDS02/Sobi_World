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
