// What a puppet (decision 050) performs on the battle stage at a moment of the step: the action (attack, cast, hurt…) and, when the step
// times it, how far into it it is and when its marks fall — so the rig's clip is warped onto the beat (the tusk lands when the number
// pops) instead of playing at its own pace. Read from the same beats and reactions the pose (battlePose.ts) reads; the pose still moves
// the whole body (the dash to the target, the knock-back), the puppet moves its parts. Pure.
import type { ActionTiming, Want } from '../../../systems/animation';
import type { PlayingStep } from './battleFxView';
import { REACT_MS } from './poseKit';
import type { PoseArt } from '../../../../content/schemas/adventure/battleFx';
import type { Gesture } from '../../../../content/schemas/adventure/battlePoses';
import { BATTLE_FX } from '../logic/config/content';
import type { MotionBeat } from './battleMotion';

/** How long a cast keeps settling after its release (the same as battlePose.ts). */
const CAST_SETTLE_MS = 360;

const REACTION_ACTION: Readonly<Record<string, string>> = {
  hit: 'hurt',
  'hit-heavy': 'hurt_heavy',
  'hit-crit': 'hurt_crit',
  miss: 'dodge',
  heal: 'heal',
  buff: 'buff',
  debuff: 'debuff',
  ko: 'ko',
};

/** A posture a script forced (decision 044 `pose` acts, victory) played on the puppet's own clock. */
const POSTURE_ACTION: Readonly<Record<PoseArt, string>> = { idle: 'idle', attack: 'attack', cast: 'cast', hurt: 'hurt', ko: 'ko', victory: 'victory' };

/** What each whole-body cast preset of the scripts (castTracks.ts) means as a gesture of the body. */
const CAST_GESTURE: Readonly<Record<string, Gesture>> = {
  cast_charge: 'charge',
  cast_raise: 'summon_sky',
  cast_roar: 'roar',
  cast_stomp: 'summon_ground',
  cast_spin: 'lash',
  cast_hover: 'channel',
  cast_sprout: 'summon_ground',
  cast_coil: 'shoot',
  cast_bow: 'channel',
  cast_wing: 'summon_sky',
};

/**
 * The body gesture of a beat's skill (decision 050): the skill's own `gesture` in battle_fx.json, else one read from how it is
 * delivered — a shot is shot, a burst rises from the ground, an aura on friends is channelled, a slam is a slam, a strike a charge.
 */
export function gestureOf(b: Pick<MotionBeat, 'skillId' | 'pose' | 'delivery'>): Gesture | null {
  const skill = b.skillId ? BATTLE_FX.skills[b.skillId] : undefined;
  if (skill?.gesture) return skill.gesture;
  if (!b.skillId) return null;
  // The whole-body cast its script was written with says what the body was meant to do.
  const cast = skill?.script?.find((a) => a.do === 'move' && (a.who ?? 'actor') === 'actor' && a.move.startsWith('cast_'));
  if (cast && cast.do === 'move') {
    const g = CAST_GESTURE[cast.move];
    if (g) return g;
  }
  switch (b.delivery) {
    case 'projectile':
      return 'shoot';
    case 'burst':
      return 'summon_ground';
    case 'slam':
      return 'slam';
    case 'melee':
      return 'charge';
    case 'aura':
      return b.pose === 'support' ? 'channel' : 'roar';
    default:
      return null;
  }
}

/** A gesture a rig has no clip for is played as the nearest one it may have (a brace as a channel, a slam as a stomp). */
const GESTURE_FALLBACK: Readonly<Partial<Record<Gesture, Gesture>>> = { brace: 'channel', slam: 'summon_ground', breath: 'roar', summon_sky: 'channel', lash: 'shoot', roar: 'summon_sky' };

/** The clips a puppet tries for a beat, most particular first: the skill's own clip, an ultimate's, its gesture's (then its fallbacks). */
export function altOf(b: Pick<MotionBeat, 'skillId' | 'pose' | 'delivery'>): string[] {
  const out: string[] = [...(b.skillId ? [b.skillId] : []), ...(b.pose === 'ultimate' ? ['ultimate'] : [])];
  for (let g = gestureOf(b), i = 0; g && i < 4; g = GESTURE_FALLBACK[g] ?? null, i++) if (!out.includes(`g_${g}`)) out.push(`g_${g}`);
  return out;
}

/**
 * The puppet's want for unit `id` at `t` ms into the step. `posture` is the key pose the pose picked (a script may force one),
 * `down` that the unit is already out. Reactions win over the unit's own beat (a counter-hit mid-swing), the latest one first.
 */
export function perfOf(id: string, p: Readonly<PlayingStep>, t: number, posture: PoseArt, down: boolean): Want {
  if (down) return { action: 'ko', key: 'down', timing: { t: 10_000 } };
  let best: { at: number; want: Want } | null = null;
  for (const r of p.motion.reactions) {
    if (r.unit !== id || t < r.at) continue;
    const len = REACT_MS[r.kind];
    if (r.kind !== 'ko' && t > r.at + len) continue;
    if (best && best.at > r.at) continue;
    const timing: ActionTiming = { t: t - r.at, marks: { end: r.kind === 'ko' ? undefined : len } };
    best = { at: r.at, want: { action: REACTION_ACTION[r.kind] ?? 'hurt', key: `${p.key}:r${r.at}`, timing } };
  }
  if (best) return best.want;
  for (const b of p.motion.beats) {
    if (b.actor !== id || !b.pose || t < b.cast || t > b.end + 40) continue;
    const key = `${p.key}:b${b.start}`;
    const into = t - b.cast;
    if (b.pose === 'attack' || b.delivery === 'melee' || b.delivery === 'slam') {
      return { action: 'attack', alt: altOf(b), key, timing: { t: into, marks: { release: b.release - b.cast, contact: b.impact - b.cast, end: b.end - b.cast } } };
    }
    if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate') {
      const end = b.release + Math.min(CAST_SETTLE_MS, Math.max(1, b.end - b.release));
      // A skill that lands on its targets lines its contact up too (a slam's crash, a lash's crack).
      return { action: b.pose === 'ultimate' ? 'ultimate' : b.pose === 'support' ? 'support' : 'cast', alt: altOf(b), key, timing: { t: into, marks: { release: b.release - b.cast, contact: b.impact - b.cast, end: Math.max(end, b.impact + 1) - b.cast } } };
    }
    if (b.pose === 'guard') return { action: 'guard', key, timing: { t: t - b.start } };
    if (b.pose === 'stunned') return { action: 'stunned', key };
  }
  // A posture a script holds (a victory, a forced pose) plays on the puppet's own clock.
  if (posture !== 'idle') return { action: POSTURE_ACTION[posture], key: `${p.key}:${posture}` };
  if (p.motion.marks.some((m) => m.kind === 'victory' && m.unit === id && t >= m.at)) return { action: 'victory', key: `${p.key}:win` };
  return { action: 'idle' };
}
