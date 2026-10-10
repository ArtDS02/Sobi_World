// The battle engine (spec V2 §8.5): turn order by Speed, a basic attack, skills (energy and cooldown), items, element
// advantage, critical hits, a few statuses. Pure: the random draws of an action come from (seed, action counter), so a
// battle saved between two actions plays on to the same result, and a battle is the same in a test and in the game.
import { cloneData } from '../../core/clone';
import { hashSeed, mulberry32, type Rng } from '../../core/rng';
import type {
  BattleAction,
  BattleEvent,
  BattleItemDef,
  BattleState,
  Combatant,
  CombatantInit,
  CombatRules,
  Element,
  SkillDef,
  SkillStatus,
  StatusId,
} from './types';
import { ELEMENTS } from './types';

export interface CombatContext {
  skills: Readonly<Record<string, SkillDef>>;
  items: Readonly<Record<string, BattleItemDef>>;
  rules: CombatRules;
}

export type StepResult =
  | { ok: true; state: BattleState; events: BattleEvent[] }
  | { ok: false; error: 'BATTLE_OVER' | 'BAD_TARGET' | 'SKILL_UNAVAILABLE' | 'NOT_ENOUGH_ENERGY' | 'ON_COOLDOWN' | 'UNKNOWN_ITEM' };

const isAlive = (c: Combatant) => c.hp > 0;
const hasStatus = (c: Combatant, id: StatusId) => c.statuses.some((s) => s.id === id);
const find = (s: BattleState, id: string) => s.combatants.find((c) => c.id === id);

/** Does `a` beat `b`? Fire > Wind > Earth > Water > Fire. */
export const beats = (a: Element, b: Element): boolean => (ELEMENTS.indexOf(a) + 1) % ELEMENTS.length === ELEMENTS.indexOf(b);

/** Damage multiplier of an attack of `attack` on a target of `defender`. */
export const elementMultiplier = (attack: Element, defender: Element, rules: Pick<CombatRules, 'counter' | 'resisted'>): number =>
  beats(attack, defender) ? rules.counter : beats(defender, attack) ? rules.resisted : 1;

export const effectiveSpeed = (c: Combatant, rules: Pick<CombatRules, 'slowFactor' | 'hasteFactor'>): number =>
  c.spd * (hasStatus(c, 'haste') ? rules.hasteFactor : 1) * (hasStatus(c, 'slow') ? rules.slowFactor : 1);

export const combatantOf = (init: CombatantInit, rules: Pick<CombatRules, 'energyStart'>): Combatant => ({
  id: init.id,
  side: init.side,
  name: init.name,
  element: init.element,
  maxHp: Math.max(1, Math.round(init.stats.hp)),
  hp: Math.max(0, Math.min(Math.round(init.stats.hp), Math.round(init.hp ?? init.stats.hp))),
  atk: init.stats.atk,
  def: init.stats.def,
  spd: init.stats.spd,
  crit: init.stats.crit,
  energy: rules.energyStart,
  skills: [...init.skills],
  cooldowns: {},
  statuses: [],
});

export const current = (s: BattleState): Combatant | null => (s.outcome ? null : (find(s, s.order[0] ?? '') ?? null));
export const alliesOf = (s: BattleState, side: Combatant['side']) => s.combatants.filter((c) => c.side === side && isAlive(c));
export const foesOf = (s: BattleState, side: Combatant['side']) => s.combatants.filter((c) => c.side !== side && isAlive(c));

function outcomeOf(s: BattleState): 'win' | 'lose' | null {
  if (!s.combatants.some((c) => c.side === 'enemy' && isAlive(c))) return 'win';
  if (!s.combatants.some((c) => c.side === 'ally' && isAlive(c))) return 'lose';
  return null;
}

/** Lowers HP through the shield first; returns what the shield took. */
function hurt(c: Combatant, amount: number): number {
  let left = amount;
  let absorbed = 0;
  const shield = c.statuses.find((x) => x.id === 'shield');
  if (shield && shield.amount > 0) {
    absorbed = Math.min(shield.amount, left);
    shield.amount -= absorbed;
    left -= absorbed;
    if (shield.amount <= 0) c.statuses = c.statuses.filter((x) => x.id !== 'shield');
  }
  c.hp = Math.max(0, c.hp - left);
  return absorbed;
}

function addStatus(target: Combatant, status: SkillStatus, rules: CombatRules) {
  const existing = target.statuses.find((x) => x.id === status.status);
  const amount = status.status === 'shield' ? Math.round(target.maxHp * rules.shieldPct) : 0;
  if (existing) {
    existing.turns = Math.max(existing.turns, status.turns);
    existing.amount = Math.max(existing.amount, amount);
  } else target.statuses.push({ id: status.status, turns: status.turns, amount });
}

/** Opens a new round: everyone alive, fastest first (allies before enemies on a tie). */
function newRound(s: BattleState, rules: CombatRules, events: BattleEvent[]) {
  s.round += 1;
  s.order = s.combatants
    .filter(isAlive)
    .sort((a, b) => effectiveSpeed(b, rules) - effectiveSpeed(a, rules) || (a.side === b.side ? 0 : a.side === 'ally' ? -1 : 1) || a.id.localeCompare(b.id))
    .map((c) => c.id);
  events.push({ type: 'round', round: s.round });
}

/** Brings the battle to the next actor that can act (burns, skipped stuns and defeats on the way). */
function begin(s: BattleState, ctx: CombatContext, events: BattleEvent[]) {
  const { rules } = ctx;
  while (!s.outcome) {
    if (s.order.length === 0) {
      if (s.round >= rules.maxRounds) {
        s.outcome = 'lose';
        break;
      }
      newRound(s, rules, events);
    }
    const actor = find(s, s.order[0]!);
    if (!actor || !isAlive(actor)) {
      s.order.shift();
      continue;
    }
    events.push({ type: 'turn', actor: actor.id });
    for (const id of Object.keys(actor.cooldowns)) actor.cooldowns[id] = Math.max(0, actor.cooldowns[id]! - 1);
    actor.energy = Math.min(rules.energyMax, actor.energy + rules.energyPerTurn);
    if (hasStatus(actor, 'burn')) {
      const amount = Math.max(1, Math.round(actor.maxHp * rules.burnPct));
      hurt(actor, amount);
      events.push({ type: 'burn', target: actor.id, amount });
      if (!isAlive(actor)) {
        events.push({ type: 'defeat', target: actor.id });
        s.order.shift();
        s.outcome = outcomeOf(s);
        continue;
      }
    }
    if (hasStatus(actor, 'stun')) {
      events.push({ type: 'skip', actor: actor.id });
      endTurn(actor);
      s.order.shift();
      continue;
    }
    return;
  }
  if (s.outcome) events.push({ type: 'end', outcome: s.outcome });
}

/** A turn ends: every status of the actor has one turn less (a spent one goes away). */
function endTurn(actor: Combatant) {
  for (const st of actor.statuses) st.turns -= 1;
  actor.statuses = actor.statuses.filter((st) => st.turns > 0);
}

/** A new battle, at the first action of the fastest fighter. */
export function startBattle(seed: number, fighters: readonly CombatantInit[], ctx: CombatContext): { state: BattleState; events: BattleEvent[] } {
  const state: BattleState = { seed, counter: 0, round: 0, order: [], combatants: fighters.map((f) => combatantOf(f, ctx.rules)), outcome: null };
  state.outcome = outcomeOf(state);
  const events: BattleEvent[] = [];
  begin(state, ctx, events);
  return { state, events };
}

function damageTo(rng: Rng, actor: Combatant, target: Combatant, power: number, element: Element, critBonus: number, ctx: CombatContext, skillId: string | null, events: BattleEvent[]) {
  const { rules } = ctx;
  const atk = actor.atk * (hasStatus(actor, 'atkUp') ? rules.atkUpFactor : 1);
  const def = target.def * (hasStatus(target, 'defUp') ? rules.defUpFactor : 1);
  const mult = elementMultiplier(element, target.element, rules);
  const crit = rng.next() * 100 < actor.crit + critBonus;
  const spread = 1 + (rng.next() * 2 - 1) * rules.variance;
  const amount = Math.max(1, Math.round(((atk * power * rules.defenseK) / (rules.defenseK + def)) * mult * spread * (crit ? rules.critMultiplier : 1)));
  const absorbed = hurt(target, amount);
  events.push({ type: 'damage', actor: actor.id, target: target.id, amount, crit, mult, skillId, absorbed });
  if (!isAlive(target)) events.push({ type: 'defeat', target: target.id });
}

function healTo(actor: Combatant, target: Combatant, pct: number, skillId: string | null, events: BattleEvent[]) {
  const amount = Math.min(target.maxHp - target.hp, Math.max(1, Math.round(target.maxHp * pct)));
  target.hp += amount;
  events.push({ type: 'heal', actor: actor.id, target: target.id, amount, skillId });
}

function statusesTo(rng: Rng, actor: Combatant, target: Combatant, statuses: readonly SkillStatus[], skillId: string | null, ctx: CombatContext, events: BattleEvent[]) {
  for (const st of statuses) {
    if (st.chance !== undefined && st.chance < 1 && rng.next() >= st.chance) continue;
    // Self buffs count the turn they are cast in, so they last for the turns the skill says.
    addStatus(target, st, ctx.rules);
    events.push({ type: 'status', actor: actor.id, target: target.id, status: st.status, skillId });
  }
}

/** The targets a skill or item reaches, or null when the one chosen is not allowed. */
function targetsOf(s: BattleState, actor: Combatant, kind: SkillDef['target'] | BattleItemDef['target'], chosen: string | undefined): Combatant[] | null {
  switch (kind) {
    case 'self':
      return [actor];
    case 'allEnemies':
      return foesOf(s, actor.side);
    case 'allAllies':
      return alliesOf(s, actor.side);
    case 'enemy': {
      const t = chosen ? find(s, chosen) : undefined;
      return t && isAlive(t) && t.side !== actor.side ? [t] : null;
    }
    case 'ally': {
      const t = chosen ? find(s, chosen) : undefined;
      return t && isAlive(t) && t.side === actor.side ? [t] : null;
    }
  }
}

/** The current actor does `action`; the battle then moves to the next actor. */
export function act(state: BattleState, action: BattleAction, ctx: CombatContext): StepResult {
  const actor0 = current(state);
  if (!actor0) return { ok: false, error: 'BATTLE_OVER' };
  const s = cloneData(state);
  const actor = find(s, actor0.id)!;
  const events: BattleEvent[] = [];
  const rng = mulberry32(hashSeed('combat', s.seed, s.counter));

  if (action.kind === 'attack') {
    const targets = targetsOf(s, actor, 'enemy', action.target);
    if (!targets) return { ok: false, error: 'BAD_TARGET' };
    damageTo(rng, actor, targets[0]!, 1, actor.element, 0, ctx, null, events);
    actor.energy = Math.min(ctx.rules.energyMax, actor.energy + ctx.rules.basicEnergyGain);
  } else if (action.kind === 'skill') {
    const skill = ctx.skills[action.skillId];
    if (!skill || !actor.skills.includes(skill.id)) return { ok: false, error: 'SKILL_UNAVAILABLE' };
    if ((actor.cooldowns[skill.id] ?? 0) > 0) return { ok: false, error: 'ON_COOLDOWN' };
    if (actor.energy < skill.cost) return { ok: false, error: 'NOT_ENOUGH_ENERGY' };
    const targets = targetsOf(s, actor, skill.target, action.target);
    if (!targets) return { ok: false, error: 'BAD_TARGET' };
    actor.energy -= skill.cost;
    if (skill.cooldown > 0) actor.cooldowns[skill.id] = skill.cooldown + 1;
    for (const target of targets) {
      if (!isAlive(target)) continue;
      if (skill.power > 0) damageTo(rng, actor, target, skill.power, skill.element, skill.critBonus ?? 0, ctx, skill.id, events);
      if (skill.healPct > 0) healTo(actor, target, skill.healPct, skill.id, events);
      if (isAlive(target)) statusesTo(rng, actor, target, skill.statuses, skill.id, ctx, events);
    }
  } else {
    const item = ctx.items[action.itemId];
    if (!item) return { ok: false, error: 'UNKNOWN_ITEM' };
    const targets = targetsOf(s, actor, item.target, action.target);
    if (!targets) return { ok: false, error: 'BAD_TARGET' };
    for (const target of targets) {
      if (item.healPct > 0) healTo(actor, target, item.healPct, null, events);
      statusesTo(rng, actor, target, item.statuses, null, ctx, events);
    }
  }

  s.counter += 1;
  s.outcome = outcomeOf(s);
  if (!s.outcome) {
    endTurn(actor);
    s.order.shift();
    begin(s, ctx, events);
  } else events.push({ type: 'end', outcome: s.outcome });
  return { ok: true, state: s, events };
}
