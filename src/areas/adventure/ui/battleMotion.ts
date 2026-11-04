// The motion of one battle step (GĐ14 vertical slice, docs/animation/): a step holds the ally's action and every enemy turn that
// followed it, so it is cut into beats, one per turn, played one after another. Each beat says who acts and how (pose), how its effect
// reaches the targets (delivery, element, the skill's own look) and when it lands; every event of the step gets the time it plays at,
// so the numbers, the hit reactions and the banner land on the impact of the action that caused them. The whole step is squeezed under
// STEP_MAX_MS. Presentation only: it reads the step's events and never touches the battle. Pure.
import type { BattleEvent, BattleState, Element } from '../../../systems/combat/types';
import { SKILLS } from '../logic/config/content';
import { BEAT_GAP_MS, CIRCLE_MS, FAST_SHARE, QUIET_MS, STEP_MAX_MS, skillFx, timingOf, type Delivery, type Pose, type Timing } from './motionProfiles';

export interface MotionBeat {
  /** Who acts (null: a beat of damage over time only). */
  actor: string | null;
  pose: Pose | null;
  delivery: Delivery | null;
  element: Element | null;
  skillId: string | null;
  /** The units its effect reaches, in order. */
  targets: string[];
  /** A skill is cast inside a magic circle first (adventure-big-update-1 §6): the circle shows from `start` to `cast`. */
  circle: boolean;
  /** Times from the start of the step (ms): the circle ends at `cast` (= `start` without one), the wind-up at `release`. */
  start: number;
  cast: number;
  release: number;
  impact: number;
  end: number;
}

export type ReactionKind = 'hit' | 'hit-heavy' | 'hit-crit' | 'heal' | 'buff' | 'debuff' | 'miss' | 'ko';

export interface ReactionCue {
  unit: string;
  kind: ReactionKind;
  at: number;
}

/**
 * Something the step says about a unit besides a hit or a heal (decision 044): a status put on, an elemental reaction, a boss changing
 * phase, a unit standing up again, damage over time, a lost turn and why, the battle won (`victory`, on every unit of `unit`'s side).
 */
export interface StepMark {
  unit: string;
  kind: 'status' | 'reaction' | 'phase' | 'revive' | 'tick' | 'skip' | 'cleanse' | 'resist' | 'victory';
  /** The status, the reaction, the reason of a lost turn, the new phase… */
  id: string;
  at: number;
  /** Who caused it (a status), when known. */
  from: string | null;
}

export interface StepMotion {
  beats: MotionBeat[];
  reactions: ReactionCue[];
  marks: StepMark[];
  /** When each event of the step plays (ms from the start of the step), by its index in the log. */
  eventAt: number[];
  /** When the last beat is over. */
  total: number;
  /** The step's times are the content's × this (x2, and squeezed under STEP_MAX_MS). */
  speed: number;
}

const EMPTY: StepMotion = { beats: [], reactions: [], marks: [], eventAt: [], total: 0, speed: 1 };

/** How a skill (null: the plain attack) moves its user and reaches its targets. */
export function deliveryOf(skillId: string | null, ultimate: boolean): { pose: Pose; delivery: Delivery } {
  if (skillId === null) return { pose: 'attack', delivery: 'melee' };
  const skill = SKILLS[skillId];
  const own = skillFx(skillId)?.delivery;
  const many = !!skill && (skill.target === 'allEnemies' || skill.target === 'randomEnemies' || skill.target === 'all');
  if (ultimate) return { pose: 'ultimate', delivery: own ?? (skill?.category === 'support' ? 'aura' : 'burst') };
  if (!skill) return { pose: 'cast', delivery: own ?? 'burst' };
  if (skill.category === 'support') return { pose: 'support', delivery: own ?? 'aura' };
  if (skill.category === 'physical') return { pose: 'attack', delivery: own ?? (many ? 'slam' : 'melee') };
  return { pose: 'cast', delivery: own ?? (many ? 'burst' : 'projectile') };
}

interface Draft {
  actor: string | null;
  pose: Pose | null;
  delivery: Delivery | null;
  element: Element | null;
  skillId: string | null;
  targets: string[];
  events: number[];
}

/** Cuts the step into beats, one per turn (events before the first turn belong to a beat of their own). */
function draftBeats(events: readonly BattleEvent[], battle: BattleState): Draft[] {
  const out: Draft[] = [];
  let cur: Draft | null = null;
  const open = (actor: string | null): Draft => {
    const d: Draft = { actor, pose: null, delivery: null, element: null, skillId: null, targets: [], events: [] };
    out.push(d);
    return d;
  };
  const aim = (d: Draft, target: string) => {
    if (!d.targets.includes(target)) d.targets.push(target);
  };
  events.forEach((e, i) => {
    if (e.type === 'turn') {
      cur = open(e.actor);
      cur.events.push(i);
      return;
    }
    const d: Draft = cur ?? (cur = open(null));
    d.events.push(i);
    switch (e.type) {
      case 'use': {
        const how = deliveryOf(e.skillId, e.ultimate);
        d.actor ??= e.actor;
        d.pose = how.pose;
        d.delivery = how.delivery;
        d.skillId = e.skillId;
        // A class skill takes its user's element (decision 044: its colours and particles are the user's).
        const own = e.skillId ? SKILLS[e.skillId]?.element : null;
        d.element = own === 'SELF' ? (battle.combatants.find((c) => c.id === e.actor)?.element ?? null) : ((own as Element | null | undefined) ?? null);
        break;
      }
      case 'guard':
        d.pose = 'guard';
        break;
      case 'skip':
        d.pose = 'stunned';
        break;
      case 'damage':
        d.element ??= e.element;
        if (d.actor === e.actor) aim(d, e.target);
        break;
      case 'miss':
      case 'heal':
      case 'status':
        if (d.actor === e.actor) aim(d, e.target);
        break;
      default:
        break;
    }
    // An item works like a support skill: no `use` event, but it heals or changes a status from the actor.
    if (d.pose === null && (e.type === 'heal' || e.type === 'status') && d.actor !== null && e.actor === d.actor) {
      d.pose = 'support';
      d.delivery = 'aura';
    }
  });
  return out;
}

const scaleTiming = (t: Timing, k: number): Timing => ({ release: t.release * k, impact: t.impact * k, end: t.end * k });

/**
 * A skill (not the plain attack, not an item) is cast inside a magic circle first; an Ultimate's circle is longer. Every non-physical
 * skill (cast / support / ultimate pose) opens with the circle whether or not it has a script (ANIM-001: scripts used to switch the
 * circle off, so every skill started at once); a skill's `circle` flag overrides either way, and a physical blow has none by default.
 */
function circleOf(d: Pick<Draft, 'pose' | 'skillId'>): number {
  if (d.skillId === null || d.pose === null || d.pose === 'guard' || d.pose === 'stunned') return 0;
  const own = skillFx(d.skillId);
  if (!(own?.circle ?? d.pose !== 'attack')) return 0;
  return d.pose === 'ultimate' ? CIRCLE_MS.ultimate : CIRCLE_MS.skill;
}

/** Between two targets of the skill (ms, normal speed): each lands a little after the one before (decision 044 stagger). */
const staggerOf = (skillId: string | null) => skillFx(skillId)?.stagger ?? 0;

/** The motion of the step that produced `log` in `battle`; `fast` is the battle's x2. */
export function stepMotion(battle: BattleState | null, log: readonly { type: string }[], fast = false): StepMotion {
  const events = log as readonly BattleEvent[];
  if (!battle || events.length === 0) return EMPTY;
  const drafts = draftBeats(events, battle).filter((d) => d.events.some((i) => events[i]!.type !== 'turn' && events[i]!.type !== 'round' && events[i]!.type !== 'ready'));
  const timings = drafts.map((d): Timing => {
    const base = d.delivery ? timingOf(d.pose, d.delivery, d.skillId) : { release: 0, impact: 0, end: QUIET_MS };
    const c = circleOf(d);
    // The last of the staggered targets still needs its reaction played out.
    const end = d.delivery ? Math.max(base.end, base.impact + staggerOf(d.skillId) * Math.max(0, d.targets.length - 1) + 320) : base.end;
    return { release: base.release + c, impact: base.impact + c, end: end + c };
  });
  const circles = drafts.map(circleOf);
  const raw = timings.reduce((sum, t) => sum + t.end, 0) + BEAT_GAP_MS * Math.max(0, drafts.length - 1);
  const k = (fast ? FAST_SHARE : 1) * Math.min(1, STEP_MAX_MS / Math.max(1, raw));
  const eventAt: number[] = events.map(() => 0);
  const reactions: ReactionCue[] = [];
  const marks: StepMark[] = [];
  const beats: MotionBeat[] = [];
  let clock = 0;
  drafts.forEach((d, b) => {
    const t = scaleTiming(timings[b]!, k);
    const c = circles[b]! * k;
    const beat: MotionBeat = { actor: d.actor, pose: d.pose, delivery: d.delivery, element: d.element, skillId: d.skillId, targets: d.targets, circle: c > 0, start: clock, cast: clock + c, release: clock + t.release, impact: clock + t.impact, end: clock + t.end };
    beats.push(beat);
    const stagger = staggerOf(d.skillId) * k;
    const landsOn = (target: string) => beat.impact + Math.max(0, d.targets.indexOf(target)) * stagger;
    for (const i of d.events) {
      const e = events[i]!;
      // What the action does lands on its impact (each target in its turn); what happens before it (a turn, a status ticking) at the
      // start of the beat.
      const before = e.type === 'turn' || e.type === 'use' || e.type === 'guard' || e.type === 'skip' || (e.type === 'tick' && d.delivery !== null);
      const at = before ? beat.start : 'target' in e && typeof e.target === 'string' ? landsOn(e.target) : beat.impact;
      eventAt[i] = at;
      const cue = (unit: string, kind: ReactionKind) => reactions.push({ unit, kind, at });
      const mark = (unit: string, kind: StepMark['kind'], id: string, from: string | null = null) => marks.push({ unit, kind, id, at, from });
      switch (e.type) {
        case 'damage':
          if (e.amount > 0) cue(e.target, e.crit ? 'hit-crit' : e.mult > 1 ? 'hit-heavy' : 'hit');
          break;
        case 'tick':
          cue(e.target, e.status === 'regen' ? 'heal' : 'hit');
          mark(e.target, 'tick', e.status);
          break;
        case 'heal':
          cue(e.target, 'heal');
          break;
        case 'revive':
          cue(e.target, 'heal');
          mark(e.target, 'revive', 'revive');
          break;
        case 'miss':
          cue(e.target, 'miss');
          break;
        case 'status':
          cue(e.target, battle.combatants.find((c) => c.id === e.target)?.side === battle.combatants.find((c) => c.id === e.actor)?.side ? 'buff' : 'debuff');
          mark(e.target, 'status', e.status, e.actor);
          break;
        case 'reaction':
          mark(e.target, 'reaction', e.reaction);
          break;
        case 'phase':
          mark(e.target, 'phase', String(e.phase));
          break;
        case 'skip':
          mark(e.actor, 'skip', e.reason);
          break;
        case 'resist':
          mark(e.target, 'resist', e.status);
          break;
        case 'cleanse':
          mark(e.target, 'cleanse', e.statuses.join(','));
          break;
        case 'end':
          if (e.outcome === 'win') {
            const ally = battle.combatants.find((c) => c.side === 'ally');
            if (ally) marks.push({ unit: ally.id, kind: 'victory', id: 'win', at: beat.end, from: null });
          }
          break;
        case 'defeat':
          // A knock-out follows the blow that caused it.
          eventAt[i] = landsOn(e.target) + 120 * k;
          reactions.push({ unit: e.target, kind: 'ko', at: eventAt[i] });
          break;
        default:
          break;
      }
    }
    clock = beat.end + BEAT_GAP_MS * k;
  });
  return { beats, reactions, marks, eventAt, total: beats.length > 0 ? beats[beats.length - 1]!.end : 0, speed: k };
}
