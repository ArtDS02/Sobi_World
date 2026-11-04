// How a fighter's body moves on the battle stage (adventure-big-update-1 §5–§8): at any moment of a step, from the step's clock,
// where it is pushed, turned, squashed or stretched, how bright it is and how faded — its idle loop (breathing, or bobbing for the
// ones that fly, float or swim), its own beats (the magic circle's rise, a melee dash to its target and back, a slam, a cast's lean
// and thrust, a guard's crouch, a stunned wobble), its reactions (knocked back and flashing on a hit, leaning away on a miss, a hop
// on a buff, a shiver on a curse, the fall of a knock-out) and the flicker of coming in at the start of a battle. Pure arithmetic
// on the step and the anchors the stage measured; the battle scene (scene/battle/) applies it to the unit's sprite every frame, and
// picks the key pose (`posture`) whose picture is shown: idle, attack, cast, hurt, ko (decision 042).
import type { PoseArt } from '../../../../content/schemas/adventure/battleFx';
import { ENTER_MS, type PlayingStep } from './battleFxView';
import type { ReactionKind } from './battleMotion';
import { addMoves, easeOutBack, settle, type MoveAcc } from './battleMoves';
import { stepScript, type Side } from './battleScript';
import { BODY, bodyOf, lookOf } from './motionProfiles';

export interface Pt {
  x: number;
  y: number;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
export const easeIn = (t: number) => t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export { easeOutBack, settle };

/** Where a unit stands on the stage, as the stage measured it (px), and its picture (which says how its body moves). */
export interface PoseAnchor {
  side: 'ally' | 'enemy';
  art: string;
  feet: Pt;
  width: number;
  /** A status holds the body still (Freeze `freezeBody`): no breathing or bobbing. */
  frozen?: boolean;
}

/** A body at one moment: pushed (px), turned (deg), squashed, how bright (1 = as drawn), how grey and faded, its glow (0xRRGGBB). */
export interface BodyPose {
  dx: number;
  dy: number;
  rot: number;
  sx: number;
  sy: number;
  bright: number;
  gray: number;
  opacity: number;
  glow: number | null;
  /** The picture coloured (multiplied) in this colour (a status, a script's `glow` with `tint`). */
  tint: number | null;
  posture: PoseArt;
  /** How high the body is off the ground (px, ≥ 0): its shadow shrinks and fades with it, and stays on the ground. */
  air: number;
}

/** How long each reaction plays (ms). */
export const REACT_MS: Readonly<Record<ReactionKind, number>> = { hit: 520, 'hit-heavy': 700, heal: 620, buff: 560, debuff: 620, miss: 480, ko: 640 };

/** A bump that rises fast and settles (0 → 1 → 0 over t ∈ [0, 1]). */
const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.18 ? easeOut(t / 0.18) : 1 - easeInOut((t - 0.18) / 0.82));

export const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** The body of a unit at `t` ms into the step: where it is pushed, turned, squashed and how bright it is. */
export function poseOf(id: string, a: PoseAnchor, anchors: ReadonlyMap<string, PoseAnchor>, p: Readonly<PlayingStep>, t: number, now: number, sidesIn?: ReadonlyMap<string, Side>): BodyPose {
  const plan = bodyOf(a.art);
  const profile = BODY[plan];
  const dir = a.side === 'ally' ? 1 : -1;
  // The idle loop: breathing, or bobbing for the ones that fly or float.
  const phase = ((hash(id) >>> 0) % profile.idleMs) / profile.idleMs;
  const cyc = Math.sin(((now / profile.idleMs + phase) % 1) * Math.PI * 2);
  let dx = 0;
  let dy = cyc * profile.bob;
  let rot = plan === 'aquatic' ? cyc * 1.5 : 0;
  let sx = 1 - cyc * 0.012;
  let sy = 1 + cyc * profile.breathe;
  let bright = 1;
  let gray = 0;
  let opacity = 1;
  let glow: number | null = null;
  let tint: number | null = null;
  let posture: PoseArt = 'idle';
  // Bodies that fly or float hover over their shadow; the rest stand on it.
  let air = profile.bob * (1 - cyc);
  if (a.frozen) {
    dy = 0;
    rot = 0;
    sx = 1;
    sy = 1;
    air = profile.bob;
  }
  // `sidesIn` is built once per frame by the caller (ANIM-107: no Map per unit per frame); tests may omit it.
  const sides = sidesIn ?? new Map<string, Side>([...anchors].map(([k2, v]) => [k2, v.side]));
  const script = stepScript(p, sides);
  for (const b of p.motion.beats) {
    if (b.actor !== id || !b.pose || t < b.start || t > b.end + 40) continue;
    // A script that moves its actor plays instead of the default motion of the beat.
    if (script.scripted.has(id) && t >= b.cast) continue;
    const target = anchors.get(b.targets[0] ?? '');
    if (b.pose === 'attack' || b.delivery === 'melee' || b.delivery === 'slam') posture = t >= b.cast && t <= b.impact + 120 ? 'attack' : posture;
    else if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate') posture = t <= b.release + 160 ? 'cast' : posture;
    if (b.circle && t < b.cast) {
      const k = clamp01((t - b.start) / Math.max(1, b.cast - b.start));
      dy -= (b.pose === 'ultimate' ? 26 : 8) * easeOut(k);
      air += (b.pose === 'ultimate' ? 26 : 8) * easeOut(k);
      bright = Math.max(bright, 1 + 0.25 * Math.sin(k * Math.PI * 3) ** 2);
      glow = lookOf(b.element, b.skillId).glow;
    }
    const wind = clamp01((t - b.cast) / Math.max(1, b.release - b.cast));
    const go = clamp01((t - b.release) / Math.max(1, b.impact - b.release));
    const back = clamp01((t - b.impact - 60) / Math.max(1, b.end - b.impact - 60));
    if ((b.pose === 'attack' && b.delivery === 'melee') || (b.pose === 'ultimate' && b.delivery === 'melee')) {
      // Coil (anticipation), dash to the target, hit and stay a beat, come home with a skid that rings out (follow-through).
      const reach = target ? target.feet.x - a.feet.x - dir * (a.width * 0.32 + target.width * 0.32) : dir * profile.lunge * 16;
      const lift = target ? (target.feet.y - a.feet.y) * 0.9 : 0;
      const sinceHit = clamp01((t - b.impact) / 160);
      if (t < b.release) {
        const coil = easeOutBack(wind);
        dx += -dir * 26 * coil;
        dy += 5 * easeOut(wind);
        sx *= 1 + 0.1 * coil;
        sy *= 1 - 0.11 * coil;
        rot += -dir * 5 * coil;
      } else if (t < b.impact) {
        const e = easeIn(go) * (0.55 + 0.45 * go);
        dx += lerp(-dir * 26, reach, e);
        dy += lift * e - Math.sin(go * Math.PI) * 26 + 5 * (1 - go);
        air += Math.sin(go * Math.PI) * 26;
        // Stretched along the dash, longer the faster it goes.
        sx *= 1.05 + 0.15 * go;
        sy *= 0.97 - 0.1 * go;
        rot += dir * 10 * go;
      } else {
        const e = settle(back);
        // On arrival: a squash that springs back, a push into the target while it holds.
        const punch = (1 - settle(sinceHit)) * (1 - back);
        dx += lerp(reach, 0, e) + dir * 7 * punch * clamp01((t - b.impact) / 30);
        dy += lerp(lift, 0, e) - Math.sin(back * Math.PI) * 18;
        air += Math.sin(back * Math.PI) * 18;
        sx *= 1 + 0.2 * punch;
        sy *= 1 - 0.18 * punch;
        rot += dir * 10 * (1 - e);
        // Landing back home: a small squash that rings out.
        const lx = clamp01((back - 0.8) / 0.2);
        const land = back > 0.8 ? Math.sin(clamp01(lx * 5) * Math.PI * 0.5) * (1 - settle(lx)) : 0;
        sy *= 1 - 0.08 * land;
        sx *= 1 + 0.06 * land;
      }
    } else if (b.delivery === 'slam') {
      // Jump up in place and come down on the impact.
      if (t < b.release) {
        sy *= 1 - 0.1 * wind;
        sx *= 1 + 0.08 * wind;
      } else if (t < b.impact) {
        dy += -Math.sin(go * Math.PI * 0.5) * 90 + go * go * 90;
        air += Math.sin(go * Math.PI * 0.5) * 90 - go * go * 90;
        sy *= 1.08;
        sx *= 0.94;
      } else {
        // The landing squash rings out: it springs past rest and settles.
        const k = 1 - settle(back);
        sy *= 1 - 0.14 * k;
        sx *= 1 + 0.12 * k;
      }
    } else if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate') {
      // Lean back while the power gathers, thrust forward as it leaves, settle.
      if (t >= b.cast && t < b.release) {
        rot += -dir * 5 * easeOut(wind);
        dx += -dir * 8 * wind;
        sy *= 1 - 0.06 * easeOut(wind);
        sx *= 1 + 0.04 * easeOut(wind);
        bright = Math.max(bright, 1 + 0.35 * wind);
        glow = lookOf(b.element, b.skillId).glow;
        if (b.pose === 'ultimate') {
          sx *= 1 + 0.08 * wind;
          sy *= 1 + 0.08 * wind;
        }
      } else if (t >= b.release) {
        // Thrown out with a spring: it leans past rest and rings out instead of just easing back.
        const k = 1 - settle(clamp01((t - b.release) / Math.max(1, b.end - b.release)));
        rot += dir * 7 * k;
        dx += dir * 14 * k;
        dy -= 6 * k;
        air += 6 * Math.max(0, k);
        sy *= 1 + 0.07 * k;
        sx *= 1 - 0.05 * k;
      }
      if (b.pose === 'ultimate' && t < b.cast) {
        sx *= 1.1;
        sy *= 1.1;
      }
    } else if (b.pose === 'guard') {
      const k = Math.sin(clamp01((t - b.start) / Math.max(1, b.end - b.start)) * Math.PI);
      sy *= 1 - 0.08 * k;
      sx *= 1 + 0.06 * k;
      dx += -dir * 6 * k;
    } else if (b.pose === 'stunned') {
      // A frozen unit is held still in its ice (ANIM-051): no wobble, no breathing; a stunned one reels.
      const frozen = p.motion.marks.some((m) => m.kind === 'skip' && m.id === 'freeze' && m.unit === id && m.at >= b.start - 1 && m.at <= b.end);
      if (frozen) {
        dy = 0;
        air = profile.bob;
        rot = 0;
        sx = 1;
        sy = 1;
      } else rot += Math.sin((t - b.start) / 45) * 8;
    }
  }
  for (const r of p.motion.reactions) {
    if (r.unit !== id) continue;
    const len = REACT_MS[r.kind];
    const k = (t - r.at) / len;
    if (r.kind === 'ko') {
      if (k < 0) continue;
      const e = easeOut(clamp01(k));
      rot += -dir * 14 * e;
      sy *= 1 - 0.14 * e;
      dy += 10 * e;
      gray = Math.max(gray, e);
      opacity = Math.min(opacity, 1 - 0.6 * e);
      if (k > 0.2) posture = 'ko';
      if (k < 0.15) bright = Math.max(bright, 2.2 - k * 8);
      continue;
    }
    if (k < 0 || k > 1) continue;
    const u = bump(k);
    // A recoil: knocked back fast, then it springs home past rest and rings out.
    const recoil = k < 0.16 ? easeOut(k / 0.16) : 1 - settle((k - 0.16) / 0.84);
    switch (r.kind) {
      case 'hit':
      case 'hit-heavy': {
        const heavy = r.kind === 'hit-heavy';
        posture = 'hurt';
        dx += -dir * (heavy ? 42 : 24) * recoil;
        rot += -dir * (heavy ? 17 : 10) * recoil;
        air += heavy ? 10 * Math.max(0, recoil) * (1 - k) : 0;
        dy -= heavy ? 10 * Math.max(0, recoil) * (1 - k) : 0;
        sx *= 1 + 0.05 * u;
        sy *= 1 - 0.07 * u;
        dx += Math.sin(k * 60) * 3 * (1 - k);
        if (k < 0.16) bright = Math.max(bright, 2.4 - k * 8);
        break;
      }
      case 'miss':
        dx += -dir * 40 * u;
        rot += -dir * 9 * u;
        dy -= 6 * u;
        air += 6 * u;
        opacity = Math.min(opacity, 1 - 0.25 * u);
        break;
      case 'heal':
        dy -= 10 * u;
        air += 10 * u;
        bright = Math.max(bright, 1 + 0.3 * u);
        glow = 0x9ef0c8;
        break;
      case 'buff':
        dy -= 14 * Math.sin(Math.min(1, k * 2) * Math.PI);
        air += 14 * Math.sin(Math.min(1, k * 2) * Math.PI);
        bright = Math.max(bright, 1 + 0.25 * u);
        glow = 0xbfe8ff;
        break;
      case 'debuff':
        dx += Math.sin(k * 50) * 4 * (1 - k);
        glow = 0x9a6ad6;
        break;
    }
  }
  const acc: MoveAcc = { dx, dy, rot, sx, sy, bright, opacity, glow, tint, posture: null, air };
  addMoves(id, a, anchors, script.moves, t, acc);
  ({ dx, dy, rot, sx, sy, bright, opacity, glow, tint, air } = acc);
  if (acc.posture) posture = acc.posture;
  // Coming in at the start of a battle: the picture flickers in after its light (unless the entrance has a script of its own).
  if (p.enter && t < 0 && !script.moves.some((m) => m.unit === id && m.at < 0)) {
    const into = (t + ENTER_MS) / ENTER_MS - (a.side === 'ally' ? 0.1 : 0.32);
    if (into < 0) opacity = 0;
    else if (into < 0.45) opacity = Math.min(opacity, Math.sin(into * 70) > 0 ? 0.25 + into : 0.05);
    bright = Math.max(bright, into < 0.6 ? 1.8 - into : 1);
  }
  return { dx, dy, rot, sx, sy, bright, gray, opacity, glow, tint, posture, air: Math.max(0, air) };
}
