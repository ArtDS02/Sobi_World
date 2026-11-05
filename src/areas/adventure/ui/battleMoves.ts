// The moves the battle scripts give a body (decision 044 actor_moves): a dash to the target and back, a dash through it, a roll, a
// hop, a jump, being lifted or knocked back, a spin, vanishing and appearing, flying off the top and diving down, a wiggle, puffing up,
// a squash, a shake, a sideways walk, rearing, sinking, floating, a tilt, a look towards someone, a bounce; a key pose held, a glow.
// Pure arithmetic on the step's clock; battlePose.ts adds them to the body's own motion.
import type { PoseArt } from '../../../../content/schemas/adventure/battleFx';
import type { BodyMove } from './battleScript';
import type { PoseAnchor } from './battlePose';
import { CAST_TRACKS, trackFor, type CastPreset } from './castTracks';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Runs past 1 a little and comes back (a coil that over-winds before it lets go). */
export const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
/** A damped spring: 0 → 1 with a small overshoot that rings out (a landing, a recoil coming home). */
export const settle = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-5.5 * t) * Math.cos(t * Math.PI * 2.2));
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
/** How long (ms) a landing squash rings out after a jump or a dash has ended. */
const LAND_MS = 170;

/** A bump that rises fast and settles (0 → 1 → 0 over t ∈ [0, 1]). */
const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.18 ? easeOut(t / 0.18) : 1 - easeInOut((t - 0.18) / 0.82));

/** Rises over the first 15 %, holds, falls over the last 15 % (0 → 1 → 0). */
const held = (k: number) => (k <= 0 || k >= 1 ? 0 : k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1);

/** What the moves of the scripts (decision 044) add to a body at `t`. */
export interface MoveAcc {
  dx: number;
  dy: number;
  rot: number;
  sx: number;
  sy: number;
  bright: number;
  opacity: number;
  glow: number | null;
  tint: number | null;
  posture: PoseArt | null;
  /** How high the body is off the ground (px): the scripts' lifts and arcs add to it, so the shadow can stay down. */
  air: number;
}

/** Adds the moves of the step's scripts that play on `id` at `t` to `acc` (actor_moves, decision 044). */
export function addMoves(id: string, a: PoseAnchor, anchors: ReadonlyMap<string, PoseAnchor>, moves: readonly BodyMove[], t: number, acc: MoveAcc) {
  const dir = a.side === 'ally' ? 1 : -1;
  let gone: number | null = null;
  let up: number | null = null;
  for (const m of moves) {
    if (m.unit !== id) continue;
    const k = (t - m.at) / Math.max(1, m.dur);
    const act = m.act;
    if (act.do === 'move' && (act.move === 'vanish' || act.move === 'exit_top') && k >= 1) {
      if (act.move === 'vanish') gone = Math.max(gone ?? -Infinity, m.at + m.dur);
      else up = Math.max(up ?? -Infinity, m.at + m.dur);
    }
    if (act.do === 'move' && act.move === 'appear' && k < 0 && (gone === null || t >= gone)) acc.opacity = 0;
    // A jump or a dash lands with a squash that rings out after the move itself has ended (follow-through).
    if (act.do === 'move' && (act.move === 'jump' || act.move === 'dash') && k > 1) {
      const ring = (t - m.at - m.dur) / LAND_MS;
      if (ring < 1) {
        const v = 1 - settle(ring);
        acc.sy *= 1 - 0.12 * v;
        acc.sx *= 1 + 0.1 * v;
      }
    }
    if (k < 0 || k > 1) continue;
    if (act.do === 'pose') {
      acc.posture = act.pose;
      continue;
    }
    // A puppet's body plays the skill's gesture clip itself (decision 050): the whole-body cast tracks would only push it around.
    if (a.rigged && (act.do === 'track' || (act.do === 'move' && act.move.startsWith('cast_')))) continue;
    if (act.do === 'track' || (act.do === 'move' && act.move.startsWith('cast_'))) {
      // Keyframes, written or named (ANIM-005); a track that ends in a full turn is back at rest, so the rest of its turns is dropped.
      const keys = act.do === 'track' ? act.keys : CAST_TRACKS[act.move as CastPreset];
      const p = trackFor(keys, k, a.width, dir);
      acc.dx += p.dx;
      acc.dy += p.dy;
      acc.rot += p.rot;
      acc.sx *= p.sx;
      acc.sy *= p.sy;
      acc.air += Math.max(0, -p.dy);
      continue;
    }
    if (act.do === 'glow') {
      const h = held(k);
      acc.glow = act.color as number;
      acc.bright = Math.max(acc.bright, 1 + ((act.bright ?? 1.35) - 1) * h);
      if (act.tint && h > 0.3) acc.tint = act.color as number;
      continue;
    }
    const to = m.toward ? anchors.get(m.toward) : undefined;
    const reach = to ? to.feet.x - a.feet.x - dir * (a.width * 0.32 + to.width * 0.32) : dir * 60;
    const lift = to ? to.feet.y - a.feet.y : 0;
    const u = bump(k);
    const n = act.n ?? 1;
    if (act.do !== 'move') continue;
    switch (act.move) {
      case 'dash':
      case 'spin_roll': {
        // Out (low, fast, stretched), a punch on arrival that squashes, home with a skid past rest in a low arc.
        const out = clamp01(k / 0.45);
        const back = clamp01((k - 0.55) / 0.45);
        const go = k < 0.45 ? out * out * (0.55 + 0.45 * out) : k < 0.55 ? 1 : 1 - settle(back);
        acc.dx += reach * go;
        const arc = k > 0.55 ? Math.sin(back * Math.PI) * 16 : Math.sin(go * Math.PI) * 8;
        acc.dy += lift * go - arc;
        acc.air += arc;
        if (act.move === 'spin_roll') acc.rot += dir * 720 * easeInOut(k);
        else if (k < 0.45) {
          acc.sx *= 1 + 0.14 * out;
          acc.sy *= 1 - 0.1 * out;
        } else if (k < 0.55) {
          const punch = 1 - (k - 0.45) / 0.1;
          acc.sx *= 1 + 0.18 * punch;
          acc.sy *= 1 - 0.16 * punch;
        }
        break;
      }
      case 'dash_through': {
        const beyond = to ? to.feet.x - a.feet.x + dir * to.width * 0.9 : dir * 200;
        if (k < 0.55) {
          acc.dx += beyond * easeIn(k / 0.55);
          acc.dy += lift * easeIn(k / 0.55);
        } else if (k < 0.7) {
          acc.dx += beyond;
          acc.dy += lift;
          acc.opacity *= 1 - (k - 0.55) / 0.15;
        } else {
          const e = (k - 0.7) / 0.3;
          acc.dx += -dir * 40 * (1 - e);
          acc.opacity *= e;
        }
        break;
      }
      case 'lunge':
        acc.dx += dir * (act.x ?? 30) * u;
        break;
      case 'recoil': {
        // Over-wound, then released towards whatever comes next (the dash that follows starts from home).
        const coil = k < 0.6 ? easeOutBack(k / 0.6) : 1 - easeIn((k - 0.6) / 0.4);
        acc.dx -= dir * (act.x ?? 12) * coil;
        break;
      }
      case 'hop':
        acc.dy -= (act.y ?? 20) * Math.abs(Math.sin(Math.PI * k * n));
        acc.air += (act.y ?? 20) * Math.abs(Math.sin(Math.PI * k * n));
        break;
      case 'jump': {
        // Crouches to push off, rises, falls, and the landing squash rings out after the move (above).
        const h = (act.y ?? 90) * (k < 0.6 ? easeOut(k / 0.6) : 1 - easeIn((k - 0.6) / 0.4));
        acc.dy -= h;
        acc.air += h;
        if (k < 0.12) {
          acc.sy *= 1 - 0.1 * easeOut(k / 0.12);
          acc.sx *= 1 + 0.08 * easeOut(k / 0.12);
        } else if (k < 0.5) {
          acc.sy *= 1.06;
          acc.sx *= 0.96;
        }
        break;
      }
      case 'lift':
        acc.dy -= (act.y ?? 30) * held(k);
        acc.air += (act.y ?? 30) * held(k);
        acc.rot += dir * (act.deg ?? 0) * held(k);
        break;
      case 'knock': {
        // Thrown back fast, then it springs home past rest and rings out.
        const recoil = k < 0.16 ? easeOut(k / 0.16) : 1 - settle((k - 0.16) / 0.84);
        acc.dx -= dir * (act.x ?? 30) * recoil;
        acc.rot -= dir * (act.deg ?? 12) * recoil;
        break;
      }
      case 'spin':
        acc.rot += dir * 360 * n * easeInOut(k);
        break;
      case 'vanish':
        acc.opacity *= 1 - k;
        acc.sx *= 1 - 0.3 * k;
        break;
      case 'appear':
        acc.opacity *= k;
        acc.dx += (act.x ?? 0) * dir * (1 - easeOut(k));
        acc.dy += (act.y ?? 0) * (1 - easeOut(k));
        acc.sx *= act.scale ? lerp(act.scale, 1, easeOut(k)) : 1;
        acc.sy *= act.scale ? lerp(act.scale, 1, easeOut(k)) : 1;
        break;
      case 'exit_top':
        acc.dy -= 760 * easeIn(k);
        acc.air += 760 * easeIn(k);
        break;
      case 'dive': {
        // From above the screen down on the target, then home.
        const down = k < 0.5 ? easeIn(k / 0.5) : 1;
        const home = k > 0.6 ? easeInOut((k - 0.6) / 0.4) : 0;
        acc.dx += reach * down * (1 - home);
        acc.dy += (-760 * (1 - down) + lift * down) * (1 - home);
        acc.air += 760 * (1 - down) * (1 - home);
        acc.rot += dir * 20 * (1 - down);
        break;
      }
      case 'wiggle':
        acc.rot += Math.sin(k * Math.PI * 2 * (act.n ?? 3)) * (act.deg ?? 8) * held(k);
        acc.dx += Math.sin(k * Math.PI * 2 * (act.n ?? 3)) * 4 * held(k);
        break;
      case 'puff_up': {
        const s2 = (act.scale ?? 1.25) - 1;
        acc.sx *= 1 + s2 * held(k);
        acc.sy *= 1 + s2 * held(k);
        break;
      }
      case 'squash': {
        const s2 = 1 - (act.scale ?? 0.85);
        acc.sy *= 1 - s2 * u;
        acc.sx *= 1 + s2 * 0.8 * u;
        break;
      }
      case 'shake':
        acc.dx += Math.sin(k * (act.n ?? 8) * Math.PI * 2) * (act.x ?? 4) * (1 - k);
        break;
      case 'walk_sideways':
        acc.dx += dir * (act.x ?? 40) * Math.sin(Math.PI * k);
        acc.dy -= Math.abs(Math.sin(k * Math.PI * 6)) * 4;
        break;
      case 'rear':
        acc.rot -= dir * (act.deg ?? 12) * held(k);
        acc.dy -= (act.y ?? 10) * held(k);
        acc.air += (act.y ?? 10) * held(k);
        break;
      case 'sink':
        acc.dy += (act.y ?? 12) * held(k);
        break;
      case 'float':
        acc.dy -= (act.y ?? 14) * held(k);
        acc.air += (act.y ?? 14) * held(k);
        break;
      case 'tilt':
        acc.rot += dir * (act.deg ?? 8) * held(k);
        break;
      case 'look': {
        const toward = to ? Math.sign(to.feet.x - a.feet.x) || dir : dir;
        acc.rot += toward * (act.deg ?? 5) * held(k);
        break;
      }
      case 'bounce':
        acc.dy -= (act.y ?? 14) * Math.abs(Math.sin(k * Math.PI * n)) * (1 - k * 0.5);
        acc.air += (act.y ?? 14) * Math.abs(Math.sin(k * Math.PI * n)) * (1 - k * 0.5);
        break;
    }
  }
  // Gone (vanished, or flown off the top) until a later move brings it back.
  if (gone !== null && !moves.some((m) => m.unit === id && m.act.do === 'move' && m.act.move === 'appear' && m.at >= gone! && t >= m.at)) acc.opacity = 0;
  if (up !== null && !moves.some((m) => m.unit === id && m.act.do === 'move' && (m.act.move === 'dive' || m.act.move === 'appear') && m.at >= up! && t >= m.at)) acc.dy -= 760;
}
