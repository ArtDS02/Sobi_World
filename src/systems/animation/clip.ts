// Sampling a clip (decision 050): keyframes per bone channel, eased per segment, faces held until their next key. A local pose is an
// offset from the rest pose (rot deg, x / y px of the rig canvas) and a scale (sx, sy); bones a clip does not name stay at rest.
// Pure; time is passed in.
import type { Channel, ClipData, Ease } from '../../../content/schemas/anim/rig';

export interface Local {
  rot: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
}

export type LocalPose = Map<string, Local>;

export const REST: Readonly<Local> = Object.freeze({ rot: 0, x: 0, y: 0, sx: 1, sy: 1 });
export const rest = (): Local => ({ rot: 0, x: 0, y: 0, sx: 1, sy: 1 });

const c1 = 1.70158;
export const EASE: Readonly<Record<Ease, (t: number) => number>> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  outBack: (t) => 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2,
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1),
  hold: (t) => (t < 1 ? 0 : 1),
};

type Key = readonly [number, number] | readonly [number, number, Ease];

/** The value of a track at `t` ms: before the first key its value, after the last key its value; between, eased by the left key. */
export function sampleTrack(keys: readonly Key[], t: number): number {
  const first = keys[0]!;
  if (t <= first[0]) return first[1];
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]!;
    if (t > b[0]) continue;
    const a = keys[i - 1]!;
    const span = b[0] - a[0];
    const k = span <= 0 ? 1 : (t - a[0]) / span;
    return a[1] + (b[1] - a[1]) * EASE[a[2] ?? 'inOut'](k);
  }
  return keys[keys.length - 1]![1];
}

/** Where `t` falls inside a clip: looped clips wrap, the others hold their last frame. */
export const clipTime = (clip: Pick<ClipData, 'len' | 'loop'>, t: number) => (clip.loop ? ((t % clip.len) + clip.len) % clip.len : Math.min(Math.max(0, t), clip.len));

const DEFAULT: Readonly<Record<Channel, number>> = { rot: 0, x: 0, y: 0, sx: 1, sy: 1 };

/** The local pose of every bone the clip names at clip time `t` (already wrapped / clamped). */
export function sampleClip(clip: ClipData, t: number, into: LocalPose = new Map()): LocalPose {
  into.clear();
  for (const [bone, chans] of Object.entries(clip.tracks)) {
    const l = rest();
    for (const ch of Object.keys(chans) as Channel[]) {
      const keys = chans[ch];
      l[ch] = keys ? sampleTrack(keys, t) : DEFAULT[ch];
    }
    into.set(bone, l);
  }
  return into;
}

/** The picture of each face slot at clip time `t` (the last key at or before it; before the first key, none). */
export function sampleFaces(clip: ClipData, t: number): Map<string, string> {
  const out = new Map<string, string>();
  for (const [slot, keys] of Object.entries(clip.faces)) {
    let pic: string | null = null;
    for (const [at, name] of keys) if (at <= t) pic = name;
    if (pic) out.set(slot, pic);
  }
  return out;
}

/** a → b by k (rotations and offsets linearly, scales too). */
export function mixLocal(a: Readonly<Local>, b: Readonly<Local>, k: number, into: Local = rest()): Local {
  into.rot = a.rot + (b.rot - a.rot) * k;
  into.x = a.x + (b.x - a.x) * k;
  into.y = a.y + (b.y - a.y) * k;
  into.sx = a.sx + (b.sx - a.sx) * k;
  into.sy = a.sy + (b.sy - a.sy) * k;
  return into;
}

/** Two local poses mixed (a bone missing on one side counts as rest there). */
export function mixPose(a: LocalPose, b: LocalPose, k: number, into: LocalPose = new Map()): LocalPose {
  const ids = new Set([...a.keys(), ...b.keys()]);
  const out = new Map<string, Local>();
  for (const id of ids) out.set(id, mixLocal(a.get(id) ?? REST, b.get(id) ?? REST, k));
  into.clear();
  for (const [k2, v] of out) into.set(k2, v);
  return into;
}
