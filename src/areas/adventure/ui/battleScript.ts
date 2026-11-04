// The scripts of battle_fx.json put on the step's clock (decision 044): a skill's own script, the general actions (the plain attack, a
// guard, a lost turn, an item, every hit, miss, heal, buff, curse, knock-out, revival, the entrance, a boss changing phase, the victory),
// what a status plays when it lands, the elemental reactions. Each act becomes either a cue the battle scene plays (a burst, a strip,
// a big object on its path, a beam, the backdrop tinted, the stage holding still…) or a move of a body that battlePose.ts adds to the
// unit's pose. Times are the content's × the step's speed, from the start of the beat (after its circle); the units of an act
// over several are staggered in order. Colours and refs of the look (`$color`, `$spark`…) are filled in here. Presentation only. Pure.
import type { Act, Paint } from '../../../../content/schemas/adventure/battleScript';
import type { ActionFx, BattleLook } from '../../../../content/schemas/adventure/battleFx';
import { BATTLE_FX } from '../logic/config/content';
import { ENTER_MS, type PlayingStep } from './battleFxView';
import type { MotionBeat } from './battleMotion';
import type { StatusId } from '../../../systems/combat/types';
import { lookOf, skillFx, timingOf } from './motionProfiles';

export type Side = 'ally' | 'enemy';

/** An act on one unit (null: the screen), with its time on the step's clock and colours as numbers. */
export interface ScriptCue {
  at: number;
  /** The act, its colours filled in (`$…` resolved), its `dur` / `hold` already × the step's speed. */
  act: Act;
  unit: string | null;
  /** Who acts (a beam starts there, a prop is thrown from there); the unit itself for a reaction. */
  from: string | null;
  look: BattleLook;
}

/** A move of a body (`move`, `pose`, `glow` acts) on the step's clock. */
export interface BodyMove {
  unit: string;
  at: number;
  dur: number;
  act: Extract<Act, { do: 'move' | 'pose' | 'glow' | 'track' }>;
  /** The unit it moves towards (a dash, a look), when it has one. */
  toward: string | null;
}

export interface StepScript {
  cues: ScriptCue[];
  moves: BodyMove[];
  /** Actors whose own body motion the script replaces (their beat's default lunge / cast lean is not played). */
  scripted: Set<string>;
}

const BODY_ACTS = new Set(['move', 'pose', 'glow', 'track']);

/** The spot in the middle of a side (`@ally`, `@enemy`): the battle scene measures it from the units standing there. */
export const sideSpot = (side: Side) => `@${side}`;

const fill = (v: Paint, look: BattleLook): number => (v === '$color' ? look.color : v === '$glow' ? look.glow : v);

/** The act with its look's colours and refs filled in and its lengths × `k`; null when it names the look's impact and there is none. */
function resolve(a: Act, look: BattleLook, k: number): Act | null {
  const out = { ...a } as Record<string, unknown>;
  for (const key of ['color', 'tint'] as const) {
    const v = out[key];
    if (typeof v === 'string' || typeof v === 'number') out[key] = fill(v as Paint, look);
    else if (Array.isArray(v)) out[key] = v.map((c) => fill(c as Paint, look));
  }
  for (const key of ['ref', 'img'] as const) {
    const v = out[key];
    if (v === '$spark') out[key] = look.spark ?? look.impact[0];
    else if (v === '$boom') {
      if (!look.boom) return null;
      out[key] = look.boom;
    }
  }
  if (typeof out.dur === 'number') out.dur = out.dur * k;
  if (typeof out.hold === 'number') out.hold = out.hold * k;
  return out as Act;
}

interface Ctx {
  sides: ReadonlyMap<string, Side>;
  out: StepScript;
}

/**
 * Plays `acts` from `start` (step ms) with times × `k`: `actor` is who the script is about, `targets` its targets in order, `stagger`
 * the default gap between units of an act over several.
 */
function run(c: Ctx, acts: readonly Act[], start: number, k: number, actor: string, targets: readonly string[], look: BattleLook, stagger = 0) {
  const side = c.sides.get(actor);
  const units = (who: Act['who']): (string | null)[] => {
    switch (who) {
      case 'actor':
        return [actor];
      case 'target':
        return targets.length > 0 ? [targets[0]!] : [];
      case 'targets':
        return [...targets];
      case 'allies':
        return [...c.sides].filter(([, s]) => s === side).map(([id]) => id);
      case 'foes':
        return [...c.sides].filter(([, s]) => s !== side).map(([id]) => id);
      case 'allyside':
        return [sideSpot(side ?? 'ally')];
      case 'foeside':
        return [sideSpot(side === 'enemy' ? 'ally' : 'enemy')];
      case 'field':
        return [null];
    }
  };
  for (const raw of acts) {
    const a = resolve(raw, look, k);
    if (!a) continue;
    const gap = (raw.stagger ?? stagger) * k;
    units(raw.who).forEach((unit, i) => {
      const at = start + raw.at * k + i * gap;
      if (BODY_ACTS.has(a.do)) {
        if (unit === null || unit.startsWith('@')) return;
        const move = a as BodyMove['act'];
        // A body moving towards someone: its first target, or (for the targets themselves) the actor.
        const toward = unit === actor ? (targets[0] ?? null) : actor;
        c.out.moves.push({ unit, at, dur: move.dur, act: move, toward });
        return;
      }
      c.out.cues.push({ at, act: a, unit, from: actor, look });
    });
  }
}

const actionScript = (id: ActionFx) => BATTLE_FX.actions[id] ?? [];

/** The script of a beat: its skill's own, or the general action the actor takes (the plain attack, a guard, a lost turn, an item). */
function beatScript(b: MotionBeat, skipReason: string | undefined): { acts: readonly Act[]; own: boolean } {
  const own = skillFx(b.skillId)?.script;
  if (own) return { acts: own, own: true };
  if (b.skillId === null && b.pose === 'attack') return { acts: actionScript('attack'), own: true };
  if (b.pose === 'guard') return { acts: actionScript('guard'), own: false };
  if (b.pose === 'stunned') return { acts: actionScript(skipReason === 'freeze' ? 'frozen' : 'stunned'), own: false };
  if (b.skillId === null && b.pose === 'support') return { acts: actionScript('item'), own: false };
  return { acts: [], own: false };
}

const cache = new WeakMap<object, StepScript>();

/** Everything the scripts of the step `p` play, on its clock; `sides` says where each unit stands. Cached per step. */
export function stepScript(p: Readonly<PlayingStep>, sides: ReadonlyMap<string, Side>): StepScript {
  const have = cache.get(p.motion);
  if (have) return have;
  const out: StepScript = { cues: [], moves: [], scripted: new Set() };
  const c: Ctx = { sides, out };
  const m = p.motion;
  const k = m.speed;
  for (const b of m.beats) {
    if (!b.actor) continue;
    const look = lookOf(b.element, b.skillId);
    const skip = m.marks.find((x) => x.kind === 'skip' && x.unit === b.actor && x.at >= b.start - 1 && x.at <= b.end)?.id;
    // A short signal that the turn has come (ANIM-080), at most 240 ms: a friend hops, a monster rears with red eyes.
    if (!skip) run(c, actionScript(sides.get(b.actor) === 'ally' ? 'turn_start_ally' : 'turn_start_enemy'), b.start, k, b.actor, [], look, 0);
    const { acts, own } = beatScript(b, skip);
    if (acts.length === 0) continue;
    // The content's beat starts after the circle; its impact lands where the motion put it (the step may be squeezed).
    const raw = b.delivery ? timingOf(b.pose, b.delivery, b.skillId).impact : 0;
    const kb = raw > 0 ? (b.impact - b.cast) / raw : k;
    run(c, acts, b.cast, kb, b.actor, b.targets, look, skillFx(b.skillId)?.stagger ?? 0);
    if (own && acts.some((a) => a.who === 'actor' && (a.do === 'move' || a.do === 'pose' || a.do === 'track'))) out.scripted.add(b.actor);
  }
  const neutral = lookOf(null);
  const lookOfUnit = (unit: string, at: number) => {
    const b = m.beats.find((x) => x.targets.includes(unit) && at >= x.start && at <= x.end + 40);
    return b ? lookOf(b.element, b.skillId) : neutral;
  };
  const statusAt = (unit: string, at: number) => m.marks.filter((x) => x.kind === 'status' && x.unit === unit && Math.abs(x.at - at) < 5);
  const tickAt = (unit: string, at: number) => m.marks.find((x) => x.kind === 'tick' && x.unit === unit && Math.abs(x.at - at) < 5)?.id;
  for (const r of m.reactions) {
    const look = lookOfUnit(r.unit, r.at);
    const tick = tickAt(r.unit, r.at);
    let id: ActionFx = r.kind === 'hit-heavy' ? 'heavy' : r.kind === 'hit-crit' ? 'crit' : r.kind;
    if (tick === 'poison') id = 'dot_poison';
    else if (tick === 'burn') id = 'dot_burn';
    else if (tick === 'regen') id = 'regen';
    // A status with its own tick look plays that instead of the generic damage-over-time action (ANIM-003).
    const ownTick = tick ? BATTLE_FX.statuses[tick as StatusId]?.tick : undefined;
    if (ownTick && ownTick.length > 0) {
      run(c, ownTick, r.at, k, r.unit, [], look);
      continue;
    }
    if (r.kind === 'buff' || r.kind === 'debuff') {
      // A status with its own look plays that instead of the generic arrows.
      const own = statusAt(r.unit, r.at).filter((s) => BATTLE_FX.statuses[s.id as StatusId]?.apply);
      if (own.length > 0) {
        own.forEach((s, i) => run(c, BATTLE_FX.statuses[s.id as StatusId]!.apply!, r.at + i * 120 * k, k, r.unit, s.from ? [s.from] : [], look));
        continue;
      }
    }
    run(c, actionScript(id), r.at, k, r.unit, [], look);
  }
  for (const mk of m.marks) {
    if (mk.kind === 'reaction') run(c, BATTLE_FX.elementReactions[mk.id] ?? [], mk.at, k, mk.unit, [], neutral);
    else if (mk.kind === 'phase') run(c, actionScript('boss_phase'), mk.at, k, mk.unit, [], neutral);
    else if (mk.kind === 'revive') run(c, actionScript('revive'), mk.at, k, mk.unit, [], neutral);
    else if (mk.kind === 'cleanse') run(c, actionScript('cleanse'), mk.at, k, mk.unit, [], neutral);
    else if (mk.kind === 'resist') run(c, actionScript('resist'), mk.at, k, mk.unit, [], neutral);
    else if (mk.kind === 'victory') {
      const side = sides.get(mk.unit);
      [...sides].filter(([, s]) => s === side).forEach(([id], i) => run(c, actionScript('victory'), mk.at + i * 120 * k, k, id, [], neutral));
      // The last blow of the battle is held for a breath and the camera leans in on the winner (ANIM-105).
      run(c, actionScript('victory_cam'), mk.at, k, mk.unit, [], neutral);
    }
  }
  if (p.enter) {
    let i = 0;
    for (const [id, side] of sides) {
      const acts = actionScript(side === 'ally' ? 'enter_ally' : 'enter_enemy');
      run(c, acts, -ENTER_MS + (side === 'ally' ? 0 : 300) + (i++ % 4) * (side === 'ally' ? 90 : 110), 1, id, [], neutral);
    }
  }
  out.cues.sort((x, y) => x.at - y.at);
  cache.set(p.motion, out);
  return out;
}

/**
 * The acts of a status' loop played on `unit` now (decision 044): cues with times from now (ms), the look neutral. Body moves of a
 * loop are left out (a loop only adds a little particle or a flash).
 */
export function loopCues(acts: readonly Act[], unit: string): ScriptCue[] {
  const look = lookOf(null);
  const out: ScriptCue[] = [];
  for (const raw of acts) {
    if (BODY_ACTS.has(raw.do) || raw.do === 'sound') continue;
    const a = resolve(raw, look, 1);
    if (a) out.push({ at: raw.at, act: a, unit: raw.who === 'field' ? null : unit, from: unit, look });
  }
  return out;
}
