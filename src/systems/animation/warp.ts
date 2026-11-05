// Lining a clip up with a beat (decision 050): a battle beat says when its action winds up, lets go, lands and is over (step ms); the
// clip says the same moments in its own ms (`marks`). The clip time is a piecewise-linear warp of the beat time through those pairs, so
// the tusk meets the wolf exactly when the number pops, however long the battle made the beat. Pure.
import type { ClipData, Mark } from '../../../content/schemas/anim/rig';
import { MARK_VALUES } from '../../../content/schemas/anim/rig';

/** An action as a battle (or any caller) times it: ms since it started and, optionally, when its marks fall (ms since its start). */
export interface ActionTiming {
  t: number;
  marks?: Partial<Record<Mark | 'end', number>> | undefined;
}

/** The pairs [action ms, clip ms] both sides know, in order (start and end always; a mark only when both have it). */
export function warpPairs(clip: Pick<ClipData, 'len' | 'marks'>, marks: ActionTiming['marks']): [number, number][] {
  const pairs: [number, number][] = [[0, 0]];
  if (marks) {
    for (const m of MARK_VALUES) {
      const a = marks[m];
      const c = clip.marks[m];
      if (a === undefined || c === undefined) continue;
      const last = pairs[pairs.length - 1]!;
      if (a > last[0] && c > last[1]) pairs.push([a, c]);
    }
    const end = marks.end;
    const last = pairs[pairs.length - 1]!;
    if (end !== undefined && end > last[0] && clip.len > last[1]) pairs.push([end, clip.len]);
  }
  return pairs;
}

/**
 * The clip time for an action time. Past the last pair the clip plays on at its own speed (a clip with no marks plays as authored).
 * `tempo` speeds the clip up where nothing pins it (a quick species runs its idle and its recoveries faster).
 */
export function warpTime(clip: Pick<ClipData, 'len' | 'marks'>, a: ActionTiming, tempo = 1): number {
  const pairs = warpPairs(clip, a.marks);
  if (pairs.length === 1) return a.t * tempo;
  for (let i = 1; i < pairs.length; i++) {
    const [a1, c1] = pairs[i]!;
    if (a.t > a1) continue;
    const [a0, c0] = pairs[i - 1]!;
    return c0 + ((a.t - a0) / (a1 - a0)) * (c1 - c0);
  }
  const [aN, cN] = pairs[pairs.length - 1]!;
  return cN + (a.t - aN) * tempo;
}
