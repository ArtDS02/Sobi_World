// The battle engine V2 (decision 037, spec §15): turn order by Speed, start-of-turn statuses, control, a chosen action, its cost, the
// hits (element chart, defence, guard, reactions, crit, spread), statuses, Rage from damage taken, KO and Auto-Revive, end of turn.
// Pure: the random draws of an action come from (seed, action counter), so a battle saved between two actions plays on to the same
// result, and a battle is the same in a test, in the game and in the Admin simulation.
import { cloneData } from '../../core/clone';
import { hashSeed, mulberry32 } from '../../core/rng';
import { planIntents } from './ai';
import { aimableFoes, alliesOf, current, find, foesOf, isAlive, levelOf, noSkills, skillMpCost, skipsTurn, stat, ultimateReady } from './rules';
import { gainRage, hurt, removeStatus, settleKo, spread, strike } from './resolve';
import { combatantOf } from './combatant';
export { combatantOf, emptyMods } from './combatant';
export { hitCategory } from './resolve';
import { elementMultiplier } from './rules';
import type {
  BattleAction,
  BattleEvent,
  BattleState,
  Combatant,
  CombatantInit,
  CombatContext,
  Effect,
  SkillDef,
  StatusId,
} from './types';

export type StepError = 'BATTLE_OVER' | 'BAD_TARGET' | 'SKILL_UNAVAILABLE' | 'SKILL_DISABLED' | 'NOT_ENOUGH_MP' | 'ON_COOLDOWN' | 'ULTIMATE_NOT_READY' | 'UNKNOWN_ITEM';

export type StepResult = { ok: true; state: BattleState; events: BattleEvent[] } | { ok: false; error: StepError };

function outcomeOf(s: BattleState): 'win' | 'lose' | null {
  if (!s.combatants.some((c) => c.side === 'enemy' && isAlive(c))) return 'win';
  if (!s.combatants.some((c) => c.side === 'ally' && isAlive(c))) return 'lose';
  return null;
}

// ---- Turns --------------------------------------------------------------------------------------------------------------

/** Opens a new round: everyone alive, fastest first (allies before enemies on a tie); the enemies say what they will do. */
function newRound(s: BattleState, ctx: CombatContext, events: BattleEvent[]) {
  s.round += 1;
  const index = new Map(s.combatants.map((c, i) => [c.id, i]));
  s.order = s.combatants
    .filter(isAlive)
    .sort((a, b) => stat(b, 'spd', ctx) - stat(a, 'spd', ctx) || (a.side === b.side ? 0 : a.side === 'ally' ? -1 : 1) || index.get(a.id)! - index.get(b.id)!)
    .map((c) => c.id);
  events.push({ type: 'round', round: s.round });
  planIntents(s, ctx);
}

/** The bearer's turn ends: immunities and statuses count down (Doom counts at the start of the turn instead). */
function endTurn(c: Combatant, ctx: CombatContext) {
  for (const id of Object.keys(c.immune) as StatusId[]) {
    const left = (c.immune[id] ?? 0) - 1;
    if (left > 0) c.immune[id] = left;
    else delete c.immune[id];
  }
  const expired: StatusId[] = [];
  for (const st of c.statuses) {
    if (st.id === 'doom') continue;
    st.turns -= 1;
    if (st.turns <= 0) expired.push(st.id);
  }
  for (const id of expired) removeStatus(c, id, ctx);
}

/** Start of a turn (§15.1 step 2): damage over time, regen, Doom, MP, cooldowns. False when the actor fell. */
function startTurn(actor: Combatant, ctx: CombatContext, events: BattleEvent[]): boolean {
  actor.guarding = false;
  for (const st of [...actor.statuses]) {
    const def = ctx.statuses[st.id];
    if (!def || def.kind !== 'dot' || !isAlive(actor)) continue;
    const fire = def.sourceElement && st.id === 'burn' ? elementMultiplier(ctx, def.sourceElement, actor) : 1;
    const amount = Math.max(1, Math.round(actor.stats.hp * def.tickPct * st.stacks * fire));
    const { toHp } = hurt(actor, amount);
    events.push({ type: 'tick', target: actor.id, status: st.id, amount });
    gainRage(actor, toHp, ctx, events);
    settleKo(actor, ctx, events);
  }
  if (!isAlive(actor)) return false;
  const regen = actor.statuses.find((st) => st.id === 'regen');
  if (regen) {
    const n = Math.min(actor.stats.hp - actor.hp, Math.max(1, Math.round(actor.stats.hp * (ctx.statuses.regen?.tickPct ?? 0))));
    if (n > 0) {
      actor.hp += n;
      events.push({ type: 'tick', target: actor.id, status: 'regen', amount: n });
    }
  }
  const doom = actor.statuses.find((st) => st.id === 'doom');
  if (doom) {
    doom.turns -= 1;
    events.push({ type: 'tick', target: actor.id, status: 'doom', amount: doom.turns });
    if (doom.turns <= 0) {
      actor.statuses = actor.statuses.filter((st) => st.id !== 'doom');
      actor.hp = 0;
      settleKo(actor, ctx, events);
      if (!isAlive(actor)) return false;
    }
  }
  actor.mp = Math.min(actor.stats.mp, actor.mp + Math.round(actor.stats.mp * ctx.rules.mpTurnPct));
  for (const id of Object.keys(actor.cooldowns)) actor.cooldowns[id] = Math.max(0, actor.cooldowns[id]! - 1);
  return true;
}

/** Brings the battle to the next actor that can act (statuses, skipped turns and defeats on the way). */
function begin(s: BattleState, ctx: CombatContext, events: BattleEvent[]) {
  while (!s.outcome) {
    if (s.order.length === 0) {
      if (s.round >= ctx.rules.maxRounds) {
        s.outcome = 'lose';
        break;
      }
      newRound(s, ctx, events);
    }
    const actor = find(s, s.order[0]!);
    if (!actor || !isAlive(actor)) {
      s.order.shift();
      continue;
    }
    events.push({ type: 'turn', actor: actor.id });
    if (!startTurn(actor, ctx, events)) {
      s.order.shift();
      s.outcome = outcomeOf(s);
      continue;
    }
    const skip = skipsTurn(actor, ctx);
    if (skip === 'stun' || skip === 'freeze') {
      events.push({ type: 'skip', actor: actor.id, reason: skip });
      endTurn(actor, ctx);
      s.order.shift();
      continue;
    }
    return;
  }
  if (s.outcome) events.push({ type: 'end', outcome: s.outcome });
}

/** A new battle, at the first action of the fastest fighter. */
export function startBattle(seed: number, fighters: readonly CombatantInit[], ctx: CombatContext): { state: BattleState; events: BattleEvent[] } {
  const state: BattleState = { seed, counter: 0, round: 0, order: [], combatants: fighters.map(combatantOf), outcome: null };
  state.outcome = outcomeOf(state);
  const events: BattleEvent[] = [];
  begin(state, ctx, events);
  return { state, events };
}

// ---- Actions --------------------------------------------------------------------------------------------------------------

type Resolved = { skill: SkillDef | null; level: number; effects: readonly Effect[]; targetKind: SkillDef['target'] | 'ally' | 'allAllies'; ultimate: boolean };

function resolve(actor: Combatant, action: BattleAction, ctx: CombatContext): Resolved | StepError {
  switch (action.kind) {
    case 'attack':
      return { skill: null, level: 1, effects: [], targetKind: 'enemy', ultimate: false };
    case 'guard':
      return { skill: null, level: 1, effects: [], targetKind: 'self', ultimate: false };
    case 'item': {
      const item = ctx.items[action.itemId];
      return item ? { skill: null, level: 1, effects: item.effects, targetKind: item.target, ultimate: false } : 'UNKNOWN_ITEM';
    }
    case 'ultimate': {
      const skill = actor.ultimate ? ctx.skills[actor.ultimate] : undefined;
      if (!skill || !ultimateReady(actor)) return 'ULTIMATE_NOT_READY';
      return { skill, level: 1, effects: skill.effects, targetKind: skill.target, ultimate: true };
    }
    case 'skill': {
      const skill = ctx.skills[action.skillId];
      if (!skill || !actor.skills.some((s) => s.id === skill.id)) return 'SKILL_UNAVAILABLE';
      if (noSkills(actor, ctx)) return 'SKILL_DISABLED';
      if ((actor.cooldowns[skill.id] ?? 0) > 0) return 'ON_COOLDOWN';
      const level = levelOf(actor, skill.id);
      if (actor.mp < skillMpCost(skill, level)) return 'NOT_ENOUGH_MP';
      return { skill, level, effects: skill.effects, targetKind: skill.target, ultimate: false };
    }
  }
}

/** The targets of an action, or null when the one chosen is not allowed. A Taunt pulls single-target attacks. */
function targetsOf(s: BattleState, actor: Combatant, kind: Resolved['targetKind'], chosen: string | undefined, revive: boolean): Combatant[] | null {
  switch (kind) {
    case 'self':
      return [actor];
    case 'allEnemies':
    case 'randomEnemies':
      return foesOf(s, actor.side);
    case 'allAllies':
      return alliesOf(s, actor.side);
    case 'all':
      return s.combatants.filter(isAlive);
    case 'enemy': {
      const aimable = aimableFoes(s, actor);
      const t = chosen ? find(s, chosen) : undefined;
      if (!t || !isAlive(t) || t.side === actor.side) return null;
      return [aimable.includes(t) ? t : aimable[0]!];
    }
    case 'ally': {
      const t = chosen ? find(s, chosen) : undefined;
      return t && t.side === actor.side && (isAlive(t) || revive) ? [t] : null;
    }
  }
}

/** Why the current actor cannot do `action` now, or null when it can. */
export function canAct(state: BattleState, action: BattleAction, ctx: CombatContext): StepError | null {
  const actor = current(state);
  if (!actor) return 'BATTLE_OVER';
  const r = resolve(actor, action, ctx);
  if (typeof r === 'string') return r;
  const revive = r.effects.some((e) => e.kind === 'revive');
  const target = 'target' in action ? action.target : undefined;
  return targetsOf(state, actor, r.targetKind, target, revive) ? null : 'BAD_TARGET';
}

/** The current actor does `action` (§15.1 steps 4–17); the battle then moves to the next actor. */
export function act(state: BattleState, action: BattleAction, ctx: CombatContext): StepResult {
  const actor0 = current(state);
  if (!actor0) return { ok: false, error: 'BATTLE_OVER' };
  const s = cloneData(state);
  const actor = find(s, actor0.id)!;
  const r = resolve(actor, action, ctx);
  if (typeof r === 'string') return { ok: false, error: r };
  const revive = r.effects.some((e) => e.kind === 'revive');
  const targets = targetsOf(s, actor, r.targetKind, 'target' in action ? action.target : undefined, revive);
  if (!targets) return { ok: false, error: 'BAD_TARGET' };
  const events: BattleEvent[] = [];
  const rng = mulberry32(hashSeed('combat', s.seed, s.counter));
  actor.intent = null;

  if (action.kind === 'guard') {
    actor.guarding = true;
    actor.mp = Math.min(actor.stats.mp, actor.mp + Math.round(actor.stats.mp * ctx.rules.mpGuardPct));
    events.push({ type: 'guard', actor: actor.id });
  } else if (action.kind === 'attack') {
    events.push({ type: 'use', actor: actor.id, skillId: null, ultimate: false });
    strike(rng, s, actor, targets[0]!, { skill: null, level: 1 }, ctx, events);
    actor.mp = Math.min(actor.stats.mp, actor.mp + Math.round(actor.stats.mp * ctx.rules.mpBasicPct));
  } else if (action.kind === 'item') {
    spread(rng, s, actor, targets, r.effects, null, 1, ctx, events);
  } else {
    const skill = r.skill!;
    if (r.ultimate) {
      actor.rage = 0;
      actor.ultimateUsed = true;
    } else {
      actor.mp -= skillMpCost(skill, r.level);
      if (skill.cooldown > 0) actor.cooldowns[skill.id] = skill.cooldown + 1;
    }
    events.push({ type: 'use', actor: actor.id, skillId: skill.id, ultimate: r.ultimate });
    const landed = new Set<string>();
    if (skill.power > 0) {
      if (skill.target === 'randomEnemies') {
        for (let h = 0; h < skill.hits; h += 1) {
          const pool = foesOf(s, actor.side);
          if (pool.length === 0) break;
          const t = pool[Math.floor(rng.next() * pool.length)]!;
          if (strike(rng, s, actor, t, r, ctx, events)) landed.add(t.id);
        }
      } else {
        for (const t of targets) for (let h = 0; h < skill.hits && isAlive(t); h += 1) if (strike(rng, s, actor, t, r, ctx, events)) landed.add(t.id);
      }
    }
    // A damage skill's statuses stick only where a hit landed; a skill without damage always applies them.
    const reached = skill.power > 0 ? (skill.target === 'randomEnemies' ? s.combatants.filter((c) => landed.has(c.id)) : targets.filter((t) => landed.has(t.id))) : targets;
    spread(rng, s, actor, reached, r.effects, skill, r.level, ctx, events);
  }

  s.counter += 1;
  s.outcome = outcomeOf(s);
  if (!s.outcome) {
    if (isAlive(actor)) endTurn(actor, ctx);
    s.order.shift();
    begin(s, ctx, events);
  } else events.push({ type: 'end', outcome: s.outcome });
  return { ok: true, state: s, events };
}
