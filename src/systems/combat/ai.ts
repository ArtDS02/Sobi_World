// The AI of a battle (spec V2 §15.3–15.4): what the enemies — and the Auto mode for the player's side — choose. Each option is scored
// from what it would likely do (damage through the element chart and reactions, heals where they are needed, statuses that are not
// there yet, a cleanse against Doom, an Ultimate when it is full), and the pick is drawn among the better ones with a seeded rng.
// The enemies choose at the start of each round, so the screen can show their intent before they act. Pure.
import { hashSeed, mulberry32 } from '../../core/rng';
import {
  aimableFoes,
  alliesOf,
  elementMultiplier,
  find,
  foesOf,
  hasStatus,
  isCleansable,
  levelOf,
  noSkills,
  skillElement,
  skillMpCost,
  skillPower,
  stat,
  ultimateReady,
} from './rules';
import type { BattleAction, BattleState, Combatant, CombatContext, Effect, SkillDef } from './types';

const ratio = (c: Combatant) => c.hp / c.stats.hp;

/** Rough damage of one hit of `skill` (null = basic attack) on `target`. */
function estimate(actor: Combatant, target: Combatant, skill: SkillDef | null, ctx: CombatContext): number {
  const physical = !skill || skill.category === 'physical' || (skill.category === 'hybrid' && stat(actor, 'atk', ctx) >= stat(actor, 'matk', ctx));
  const off = stat(actor, physical ? 'atk' : 'matk', ctx);
  const def = stat(target, physical ? 'def' : 'mdef', ctx);
  const power = skill ? skillPower(skill, levelOf(actor, skill.id)) * skill.hits : ctx.rules.basicPower;
  const element = skillElement(skill, actor);
  const mult = element ? elementMultiplier(ctx, element, target) : 1;
  const reacts = ctx.reactions.some(
    (r) => element !== null && r.elements.includes(element) && ((r.requiresStatus && hasStatus(target, r.requiresStatus)) || (r.requiresTag && target.tags.includes(r.requiresTag))),
  );
  return ((off * power * ctx.rules.defenseK) / (ctx.rules.defenseK + def)) * mult * (reacts ? 1.3 : 1) * (target.guarding ? ctx.rules.guardTaken : 1);
}

/** The value of the statuses / effects a skill puts on its targets. */
function effectValue(state: BattleState, effects: readonly Effect[], targets: readonly Combatant[], actor: Combatant, ctx: CombatContext): number {
  let v = 0;
  for (const e of effects) {
    const to = 'to' in e ? e.to : undefined;
    const on = to === 'self' ? [actor] : to === 'allies' ? alliesOf(state, actor.side) : to === 'foes' ? foesOf(state, actor.side) : targets;
    if (e.kind === 'status') {
      const def = ctx.statuses[e.status];
      if (!def) continue;
      const fresh = on.filter((t) => !hasStatus(t, e.status) && !(t.immune[e.status] ?? 0) && !t.mods.statusImmune.includes(e.status));
      const weight = e.status === 'doom' ? 1.6 : def.kind === 'control' ? 0.9 : def.kind === 'recovery' ? 0.7 : 0.4;
      v += fresh.length * weight * (e.chance ?? 1);
    } else if (e.kind === 'heal') {
      v += on.reduce((n, t) => n + Math.max(0, 0.75 - ratio(t)) * 3, 0);
    } else if (e.kind === 'shield') {
      v += on.filter((t) => !hasStatus(t, 'shield')).length * 0.45;
    } else if (e.kind === 'cleanse') {
      for (const t of on) {
        if (e.doom && hasStatus(t, 'doom')) v += 4;
        v += t.statuses.filter((st) => isCleansable(ctx, st.id)).length * 0.6;
      }
    } else if (e.kind === 'dispel') {
      v += on.reduce((n, t) => n + t.statuses.filter((st) => ctx.statuses[st.id]?.positive).length * 0.4, 0);
    } else if (e.kind === 'mp') {
      v += on.filter((t) => t.mp < t.stats.mp * 0.4).length * 0.5;
    } else if (e.kind === 'revive') {
      v += on.filter((t) => t.hp <= 0).length * 3;
    }
  }
  return v;
}

interface Option {
  score: number;
  action: BattleAction;
}

function skillOption(state: BattleState, actor: Combatant, skill: SkillDef, ctx: CombatContext, ultimate: boolean, basic: number): Option | null {
  const foes = foesOf(state, actor.side);
  const friends = alliesOf(state, actor.side);
  const aimable = aimableFoes(state, actor);
  const make = (target?: string): BattleAction => (ultimate ? { kind: 'ultimate', ...(target ? { target } : {}) } : { kind: 'skill', skillId: skill.id, ...(target ? { target } : {}) });
  const cost = ultimate ? 0 : skillMpCost(skill, levelOf(actor, skill.id)) / Math.max(20, actor.stats.mp);
  const bonus = ultimate ? 2.5 : 0;
  switch (skill.target) {
    case 'enemy': {
      let best: Option | null = null;
      for (const t of aimable) {
        const dmg = skill.power > 0 ? estimate(actor, t, skill, ctx) / basic : 0;
        const kill = skill.power > 0 && estimate(actor, t, skill, ctx) >= t.hp ? 0.8 : 0;
        const score = dmg + kill + effectValue(state, skill.effects, [t], actor, ctx) + bonus - cost * 0.6;
        if (!best || score > best.score) best = { score, action: make(t.id) };
      }
      return best;
    }
    case 'allEnemies':
    case 'randomEnemies': {
      const dmg = skill.power > 0 ? foes.reduce((n, t) => n + estimate(actor, t, skill, ctx), 0) / basic / (skill.target === 'randomEnemies' ? Math.max(1, foes.length) : 1) : 0;
      return { score: dmg * 0.9 + effectValue(state, skill.effects, foes, actor, ctx) + bonus - cost * 0.6, action: make() };
    }
    case 'ally': {
      const revive = skill.effects.some((e) => e.kind === 'revive');
      const pool = revive ? state.combatants.filter((c) => c.side === actor.side) : friends;
      let best: Option | null = null;
      for (const t of pool) {
        const v = effectValue(state, skill.effects, [t], actor, ctx);
        if (v <= 0) continue;
        const score = 0.4 + v + bonus - cost * 0.6;
        if (!best || score > best.score) best = { score, action: make(t.id) };
      }
      return best;
    }
    case 'allAllies':
    case 'self': {
      const on = skill.target === 'self' ? [actor] : friends;
      const v = effectValue(state, skill.effects, on, actor, ctx);
      return v > 0 ? { score: 0.4 + v + bonus - cost * 0.6, action: make() } : null;
    }
    case 'all': {
      const mine = friends.reduce((n, t) => n + t.statuses.filter((st) => isCleansable(ctx, st.id)).length, 0);
      const theirs = foes.reduce((n, t) => n + t.statuses.filter((st) => ctx.statuses[st.id]?.positive).length, 0);
      const v = (mine + theirs) * 0.5 - friends.reduce((n, t) => n + t.statuses.filter((st) => ctx.statuses[st.id]?.positive).length, 0) * 0.4;
      return v > 0.3 ? { score: 0.4 + v + bonus - cost * 0.6, action: make() } : null;
    }
  }
}

/** The action the AI picks for `actorId` (default: the one whose turn it is), drawn among the better options. */
export function chooseAction(state: BattleState, ctx: CombatContext, actorId?: string, seed?: number): BattleAction | null {
  const actor = actorId ? find(state, actorId) : find(state, state.order[0] ?? '');
  if (!actor || actor.hp <= 0 || state.outcome) return null;
  const foes = aimableFoes(state, actor);
  if (foes.length === 0) return null;
  const rng = mulberry32(seed ?? hashSeed('ai', state.seed, state.counter));
  const basicOn = (t: Combatant) => estimate(actor, t, null, ctx);
  const basic = Math.max(1, Math.max(...foes.map(basicOn)));
  const attackTarget = [...foes].sort((a, b) => {
    const s = (c: Combatant) => (basicOn(c) >= c.hp ? -10 : 0) - basicOn(c) / basic + ratio(c);
    return s(a) - s(b);
  })[0]!;
  const options: Option[] = [{ score: 1 + (basicOn(attackTarget) >= attackTarget.hp ? 0.8 : 0), action: { kind: 'attack', target: attackTarget.id } }];
  if (ultimateReady(actor)) {
    const ult = ctx.skills[actor.ultimate!];
    const o = ult ? skillOption(state, actor, ult, ctx, true, basic) : null;
    if (o) options.push(o);
  }
  if (!noSkills(actor, ctx)) {
    for (const slot of actor.skills) {
      const skill = ctx.skills[slot.id];
      if (!skill || (actor.cooldowns[skill.id] ?? 0) > 0 || actor.mp < skillMpCost(skill, slot.level)) continue;
      const o = skillOption(state, actor, skill, ctx, false, basic);
      if (o) options.push(o);
    }
  }
  if (ratio(actor) < 0.3) options.push({ score: 0.9, action: { kind: 'guard' } });
  const best = Math.max(...options.map((o) => o.score));
  const good = options.filter((o) => o.score >= best * 0.85);
  return good[Math.floor(rng.next() * good.length)]!.action;
}

/** At the start of a round every enemy picks what it will do (its intent, §15.4). */
export function planIntents(state: BattleState, ctx: CombatContext): void {
  state.combatants.forEach((c, i) => {
    if (c.side !== 'enemy' || c.hp <= 0) return;
    c.intent = chooseAction(state, ctx, c.id, hashSeed('intent', state.seed, state.round, i));
  });
}
