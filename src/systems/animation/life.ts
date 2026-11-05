// The life under every clip (decision 050): breathing, blinking on a rhythm of its own (never two neighbours in step), and springs that
// let ears, tails, crests and shells lag behind the body and overshoot when it stops (overlap, follow-through). Deterministic: the blink
// schedule comes from a hash of the unit's seed, the springs integrate the dt they are given. Pure.
import type { RigData } from '../../../content/schemas/anim/rig';
import type { LocalPose } from './clip';
import { rest } from './clip';
import type { World } from './skeleton';

/** A stable 32-bit hash of a string (a unit's id → its own phases). */
export const hashOf = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;

/** A number in [0, 1) from a seed and an index (no Math.random: same unit, same life). */
export const noise = (seed: number, i: number) => {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Breathing: the breath bone swells and rises a little, on the rig's own rhythm, `amount` of it (a clip's `life`). */
export function breathe(rig: RigData, pose: LocalPose, nowMs: number, seed: number, amount: number) {
  if (amount <= 0) return;
  const b = rig.feel.breath;
  const phase = Math.sin(((nowMs / b.ms + noise(seed, 0)) % 1) * Math.PI * 2);
  const l = pose.get(b.bone) ?? rest();
  l.sy *= 1 + b.sy * phase * amount;
  l.sx *= 1 - b.sy * 0.35 * phase * amount;
  l.y += b.y * phase * amount;
  pose.set(b.bone, l);
}

/**
 * The eyes' picture from the blink schedule at `nowMs`: every `every[0]–every[1]` ms (its own spacing each time) a blink of ~150 ms
 * (half – closed – half), and one blink in four is a double. Null when the eyes are open.
 */
export function blinkAt(rig: RigData, nowMs: number, seed: number): string | null {
  const bl = rig.feel.blink;
  if (!bl) return null;
  const [lo, hi] = bl.every;
  // Walk the blinks from a fixed origin: each gap is its own length, so the rhythm never repeats exactly.
  const cycle = (lo + hi) / 2;
  const n = Math.floor(nowMs / cycle);
  for (let k = n - 1; k <= n; k++) {
    const start = k * cycle + noise(seed, k) * (hi - lo) * 0.5;
    const into = nowMs - start;
    const double = noise(seed, k + 7919) < 0.25;
    const len = double ? 380 : 150;
    if (into < 0 || into > len) continue;
    const local = double && into > 190 ? into - 190 : into;
    if (local > 150) return null;
    if (local < 40 || local > 110) return bl.half ?? bl.closed;
    return bl.closed;
  }
  return null;
}

export interface SpringState {
  angle: number;
  vel: number;
  lastX: number;
  lastY: number;
  lastVx: number;
  lastVy: number;
  primed: number;
}

/**
 * Steps the springs one frame and adds their swing (deg) to the pose. Each spring reads its bone's acceleration in the canvas (body and
 * root motion together: a dash, a landing, a knock-back) and swings against it, pulled back by `stiff`, calmed by `damp`.
 */
export function stepSprings(rig: RigData, states: Map<string, SpringState>, worlds: ReadonlyMap<string, World>, dtMs: number, pose: LocalPose) {
  const dt = Math.min(0.05, Math.max(0.001, dtMs / 1000));
  for (const s of rig.springs) {
    const w = worlds.get(s.bone);
    if (!w) continue;
    let st = states.get(s.bone);
    if (!st) {
      st = { angle: 0, vel: 0, lastX: w.x, lastY: w.y, lastVx: 0, lastVy: 0, primed: 0 };
      states.set(s.bone, st);
    }
    const vx = (w.x - st.lastX) / dt;
    const vy = (w.y - st.lastY) / dt;
    // The first two frames have no history: no kick from the jump onto the stage.
    const ax = st.primed >= 2 ? (vx - st.lastVx) / dt : 0;
    const ay = st.primed >= 2 ? (vy - st.lastVy) / dt : 0;
    st.primed++;
    st.lastX = w.x;
    st.lastY = w.y;
    st.lastVx = vx;
    st.lastVy = vy;
    // Under a steady acceleration the bone would settle `gain` deg per 1000 px/s² away from its pose; the spring chases that.
    const target = -(s.gain * ax + s.gainY * ay) / 1000;
    const accel = s.stiff * (target - st.angle) - s.damp * st.vel;
    st.vel += accel * dt;
    st.angle += st.vel * dt;
    if (st.angle > s.max) [st.angle, st.vel] = [s.max, Math.min(0, st.vel)];
    if (st.angle < -s.max) [st.angle, st.vel] = [-s.max, Math.max(0, st.vel)];
    const l = pose.get(s.bone) ?? rest();
    l.rot += st.angle;
    pose.set(s.bone, l);
  }
}
