// The DOM side of the battle's motion (GĐ14 vertical slice, docs/animation/): the CSS animations each unit plays in this step (its pose
// when it acts, its reaction when it is reached, its knock-out) and the effects drawn over the field (charge, projectile, impact). Every
// animation is timed from when the step first showed, so a redraw in the middle resumes it where it was; an animation already over is
// left out. Effects use their manifest art when it exists and a CSS shape otherwise. What plays when comes from battleMotion.ts.
import type { Element } from '../../../systems/combat/types';
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import type { MotionBeat, ReactionKind, StepMotion } from './battleMotion';
import { BODY, ELEMENT_LOOK, NEUTRAL_LOOK, SKILL_MOTION, bodyOf, vfxArt, type Pose } from './motionProfiles';

/** Where a unit stands on the field (% of the field, its feet). */
export interface Spot {
  x: number;
  y: number;
}

/** How long a reaction plays (ms). */
const REACTION_MS: Readonly<Record<ReactionKind, number>> = { hit: 360, 'hit-heavy': 520, heal: 560, buff: 520, debuff: 560, miss: 420, ko: 520 };
/** How long an impact's effect stays (ms). */
const IMPACT_MS = 460;
/** The body's centre above its feet (% of the field). */
const CHEST = 12;

const ms = (n: number) => `${Math.round(n)}ms`;

/** One CSS animation, or nothing when it is already over. */
function anim(name: string, duration: number, startsIn: number, easing = 'ease-in-out'): string | null {
  if (startsIn + duration <= 0 || duration <= 0) return null;
  return `${name} ${ms(duration)} ${easing} ${ms(startsIn)} 1 normal none`;
}

export interface UnitMotion {
  /** The style of the body (its pose and reactions, after one another). */
  body: string;
  /** The style of the idle loop. */
  idle: string;
  /** The knock-out has not played yet: the unit stands until its blow lands. */
  falling: { style: string } | null;
}

/** The animations of one unit at `elapsed` ms into the step. */
export function unitMotion(id: string, side: 'ally' | 'enemy', motion: StepMotion, elapsed: number, down: boolean): UnitMotion {
  const plan = bodyOf(id);
  const profile = BODY[plan];
  const parts: string[] = [];
  for (const b of motion.beats) {
    if (b.actor !== id || !b.pose) continue;
    const a = anim(`adventure-pose-${b.pose}`, b.end - b.start, b.start - elapsed);
    if (a) parts.push(a);
  }
  let ko: number | null = null;
  for (const r of motion.reactions) {
    if (r.unit !== id) continue;
    if (r.kind === 'ko') {
      ko = r.at;
      continue;
    }
    const a = anim(`adventure-react-${r.kind}`, REACTION_MS[r.kind], r.at - elapsed, 'ease-out');
    if (a) parts.push(a);
  }
  // A unit with the same body would breathe in step with its neighbours: start each one at its own point of the loop.
  const phase = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7) % profile.idleMs;
  const vars = `--dir:${side === 'ally' ? 1 : -1};--lunge:${profile.lunge}rem`;
  const fall = down && ko !== null && ko + REACTION_MS.ko > elapsed ? anim('adventure-ko-fall', REACTION_MS.ko, ko - elapsed, 'ease-in') : null;
  return {
    body: `${vars}${parts.length > 0 ? `;animation:${parts.join(', ')}` : ''}`,
    idle: down ? '' : `animation:adventure-idle-${plan} ${profile.idleMs}ms ease-in-out ${-phase}ms infinite`,
    falling: fall ? { style: `animation:${fall.replace(' none', ' forwards')}` } : null,
  };
}

const lookOf = (beat: MotionBeat) => {
  const look = beat.element ? ELEMENT_LOOK[beat.element] : NEUTRAL_LOOK;
  const shape = (beat.skillId ? SKILL_MOTION[beat.skillId]?.shape : undefined) ?? look.shape;
  return { ...look, shape };
};

/** An effect element: its picture from the manifest when there is one, else the CSS shape. */
function vfx(kind: string, beat: MotionBeat, phase: 'projectile' | 'impact', style: string, extra = ''): HTMLElement {
  const look = lookOf(beat);
  const picture = vfxArt(beat.skillId, beat.element as Element | null, phase)
    .map((id) => art(id, 'adventure-vfx__art'))
    .find((x) => x !== null);
  return el(
    'span',
    {
      class: `adventure-vfx is-${kind} is-shape-${look.shape}${picture ? ' has-art' : ''}${extra}`,
      attrs: { style: `--vfx-color:${look.color};--vfx-glow:${look.glow};${style}`, 'aria-hidden': 'true', 'data-skill': beat.skillId ?? '' },
    },
    picture ?? null,
  );
}

/** The effects of the step over the field at `elapsed` ms: charge on the actor, projectiles, impacts on the targets. */
export function fieldEffects(motion: StepMotion, spots: ReadonlyMap<string, Spot>, elapsed: number): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const b of motion.beats) {
    if (!b.delivery || !b.actor || b.end + IMPACT_MS <= elapsed) continue;
    const from = spots.get(b.actor);
    if (!from) continue;
    const pose: Pose | null = b.pose;
    const at = (s: Spot) => `left:${s.x}%;top:${s.y - CHEST}%`;
    if (pose === 'cast' || pose === 'support' || pose === 'ultimate') {
      const a = anim('adventure-vfx-charge', b.release - b.start, b.start - elapsed, 'ease-in');
      if (a) out.push(vfx('charge', b, 'impact', `${at(from)};animation:${a}`, pose === 'ultimate' ? ' is-big' : ''));
    }
    b.targets.forEach((target, i) => {
      const to = spots.get(target);
      if (!to) return;
      if (b.delivery === 'projectile') {
        const fly = anim('adventure-vfx-fly', b.impact - b.release, b.release - elapsed, 'cubic-bezier(.3,.1,.6,1)');
        if (fly) out.push(vfx('projectile', b, 'projectile', `--x0:${from.x}%;--y0:${from.y - CHEST}%;--x1:${to.x}%;--y1:${to.y - CHEST}%;--turn:${to.x >= from.x ? 0 : 180}deg;animation:${fly}`));
      }
      const kind = b.delivery === 'aura' ? 'aura' : b.delivery === 'slam' ? 'slam' : b.delivery === 'melee' ? 'slash' : 'impact';
      const hit = anim(`adventure-vfx-${kind}`, IMPACT_MS, b.impact + i * 40 - elapsed, 'ease-out');
      if (hit) out.push(vfx(kind, b, 'impact', `${at(to)};animation:${hit}`, pose === 'ultimate' ? ' is-big' : ''));
    });
  }
  return out;
}
