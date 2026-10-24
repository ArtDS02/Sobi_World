// How a fighter's body moves on the battle stage (adventure-big-update-1 §5–§8): at any moment of a step, from the step's clock,
// where it is pushed, turned, squashed or stretched, how bright it is and how faded — its idle loop (breathing, or bobbing for the
// ones that fly, float or swim), its own beats (the magic circle's rise, a melee dash to its target and back, a slam, a cast's lean
// and thrust, a guard's crouch, a stunned wobble), its reactions (knocked back and flashing on a hit, leaning away on a miss, a hop
// on a buff, a shiver on a curse, the fall of a knock-out) and the flicker of coming in at the start of a battle. Pure arithmetic
// on the step and the anchors the stage measured; battleStage.ts applies it to the DOM every frame.
import { ENTER_MS, type PlayingStep } from './battleFxView';
import type { ReactionKind } from './battleMotion';
import { lookOf } from './fx/looks';
import { clamp01, easeIn, easeInOut, easeOut, lerp, type Pt } from './fx/fxEngine';
import { BODY, bodyOf } from './motionProfiles';

/** Where a unit stands on the stage, as the stage measured it (canvas px). */
export interface PoseAnchor {
  side: 'ally' | 'enemy';
  feet: Pt;
  width: number;
}

/** How long each reaction plays (ms). */
export const REACT_MS: Readonly<Record<ReactionKind, number>> = { hit: 520, 'hit-heavy': 700, heal: 620, buff: 560, debuff: 620, miss: 480, ko: 640 };

/** A bump that rises fast and settles (0 → 1 → 0 over t ∈ [0, 1]). */
const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.18 ? easeOut(t / 0.18) : 1 - easeInOut((t - 0.18) / 0.82));

export const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** The body of a unit at `t` ms into the step: where it is pushed, turned, squashed and how bright it is. */
export function poseOf(id: string, a: PoseAnchor, anchors: ReadonlyMap<string, PoseAnchor>, p: Readonly<PlayingStep>, t: number, now: number): { tf: string; filter: string; opacity: number; hurt: boolean } {
  const plan = bodyOf(id);
  const profile = BODY[plan];
  const dir = a.side === 'ally' ? 1 : -1;
  // The idle loop: breathing, or bobbing for the ones that fly or float.
  const phase = ((hash(id) >>> 0) % profile.idleMs) / profile.idleMs;
  const cyc = Math.sin(((now / profile.idleMs + phase) % 1) * Math.PI * 2);
  let dx = 0;
  let dy = plan === 'flyer' ? cyc * 7 : plan === 'floater' ? cyc * 5 : plan === 'aquatic' ? cyc * 3 : 0;
  let rot = plan === 'aquatic' ? cyc * 1.5 : 0;
  let sx = 1 - cyc * 0.012;
  let sy = 1 + cyc * (plan === 'heavy' ? 0.018 : 0.028);
  let bright = 1;
  let gray = 0;
  let opacity = 1;
  let glow = '';
  let hurt = false;
  for (const b of p.motion.beats) {
    if (b.actor !== id || !b.pose || t < b.start || t > b.end + 40) continue;
    const target = anchors.get(b.targets[0] ?? '');
    if (b.circle && t < b.cast) {
      const k = clamp01((t - b.start) / Math.max(1, b.cast - b.start));
      dy -= (b.pose === 'ultimate' ? 26 : 8) * easeOut(k);
      bright = Math.max(bright, 1 + 0.25 * Math.sin(k * Math.PI * 3) ** 2);
      glow = lookOf(b.element).glow;
    }
    const wind = clamp01((t - b.cast) / Math.max(1, b.release - b.cast));
    const go = clamp01((t - b.release) / Math.max(1, b.impact - b.release));
    const back = clamp01((t - b.impact - 60) / Math.max(1, b.end - b.impact - 60));
    if ((b.pose === 'attack' && b.delivery === 'melee') || (b.pose === 'ultimate' && b.delivery === 'melee')) {
      // Pull back, dash to the target, hit, come home.
      const reach = target ? target.feet.x - a.feet.x - dir * (a.width * 0.32 + target.width * 0.32) : dir * profile.lunge * 16;
      const lift = target ? (target.feet.y - a.feet.y) * 0.9 : 0;
      if (t < b.release) {
        dx += -dir * 22 * easeOut(wind);
        sx *= 1 + 0.06 * wind;
        sy *= 1 - 0.06 * wind;
        rot += -dir * 4 * wind;
      } else if (t < b.impact) {
        const e = easeIn(go);
        dx += lerp(-dir * 22, reach, e);
        dy += lift * e - Math.sin(go * Math.PI) * 26;
        sx *= 1.12 - 0.06 * go;
        sy *= 0.92 + 0.04 * go;
        rot += dir * 10 * go;
      } else {
        const e = easeInOut(back);
        dx += lerp(reach, 0, e);
        dy += lerp(lift, 0, e) - Math.sin(back * Math.PI) * 18;
        rot += dir * 10 * (1 - e);
      }
    } else if (b.delivery === 'slam') {
      // Jump up in place and come down on the impact.
      if (t < b.release) {
        sy *= 1 - 0.1 * wind;
        sx *= 1 + 0.08 * wind;
      } else if (t < b.impact) {
        dy += -Math.sin(go * Math.PI * 0.5) * 90 + go * go * 90;
        sy *= 1.08;
        sx *= 0.94;
      } else {
        const k = 1 - back;
        sy *= 1 - 0.12 * k * k;
        sx *= 1 + 0.1 * k * k;
      }
    } else if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate') {
      // Lean back while the power gathers, thrust forward as it leaves, settle.
      if (t >= b.cast && t < b.release) {
        rot += -dir * 5 * easeOut(wind);
        dx += -dir * 8 * wind;
        bright = Math.max(bright, 1 + 0.35 * wind);
        glow = lookOf(b.element).glow;
        if (b.pose === 'ultimate') {
          sx *= 1 + 0.08 * wind;
          sy *= 1 + 0.08 * wind;
        }
      } else if (t >= b.release) {
        const k = 1 - easeOut(clamp01((t - b.release) / Math.max(1, b.end - b.release)));
        rot += dir * 7 * k;
        dx += dir * 14 * k;
        dy -= 6 * k;
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
      rot += Math.sin((t - b.start) / 45) * 8;
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
      if (k < 0.15) bright = Math.max(bright, 2.2 - k * 8);
      continue;
    }
    if (k < 0 || k > 1) continue;
    const u = bump(k);
    switch (r.kind) {
      case 'hit':
      case 'hit-heavy': {
        const heavy = r.kind === 'hit-heavy';
        hurt = true;
        dx += -dir * (heavy ? 42 : 24) * u;
        rot += -dir * (heavy ? 17 : 10) * u;
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
        opacity = Math.min(opacity, 1 - 0.25 * u);
        break;
      case 'heal':
        dy -= 10 * u;
        bright = Math.max(bright, 1 + 0.3 * u);
        glow = '#9ef0c8';
        break;
      case 'buff':
        dy -= 14 * Math.sin(Math.min(1, k * 2) * Math.PI);
        bright = Math.max(bright, 1 + 0.25 * u);
        glow = '#bfe8ff';
        break;
      case 'debuff':
        dx += Math.sin(k * 50) * 4 * (1 - k);
        glow = '#9a6ad6';
        break;
    }
  }
  // Coming in at the start of a battle: the picture flickers in after its light.
  if (p.enter && t < 0) {
    const into = (t + ENTER_MS) / ENTER_MS - (a.side === 'ally' ? 0.1 : 0.32);
    if (into < 0) opacity = 0;
    else if (into < 0.45) opacity = Math.min(opacity, Math.sin(into * 70) > 0 ? 0.25 + into : 0.05);
    bright = Math.max(bright, into < 0.6 ? 1.8 - into : 1);
  }
  const filter = `${bright > 1.01 ? `brightness(${bright.toFixed(2)}) ` : ''}${gray > 0.01 ? `grayscale(${gray.toFixed(2)}) ` : ''}${glow ? `drop-shadow(0 0 10px ${glow})` : ''}`.trim();
  return { tf: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, filter, opacity, hurt };
}
