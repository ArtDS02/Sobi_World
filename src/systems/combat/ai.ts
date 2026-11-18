// The AI of a battle (spec V2 §15.3–15.4): what the enemies — and the Auto mode for the player's side — choose. Each option is scored
// from what it would likely do (damage through the element chart and reactions, heals where they are needed, statuses that are not
// there yet, a cleanse against Doom, an Ultimate when it is full), and the pick is drawn among the better ones with a seeded rng.
// The enemies choose at the start of each round, so the screen can show their intent before they act. A combatant with an `iq` (the
// enemies; decision 062) plays worse or better by it: a low one picks near at random, ignores kills and forgets its support skills, a
// high one focuses the wounded and the healers, takes out the dangerous with control, buffs before it strikes and sets up reactions
// for its friends. No `iq` = the plain AI (Auto, the balance bot's allies). Pure.
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
  const iq = actor.iq;
  // A clumsy fighter undervalues support (heals, shields, cleanses, buffs); a clever one values buffs it can use at once a little more.
  const k = iq === undefined ? 1 : 0.3 + 0.9 * iq;
  let v = 0;
  for (const e of effects) {
    const to = 'to' in e ? e.to : undefined;
    const on = to === 'self' ? [actor] : to === 'allies' ? alliesOf(state, actor.side) : to === 'foes' ? foesOf(state, actor.side) : targets;
    if (e.kind === 'status') {
      const def = ctx.statuses[e.status];
      if (!def) continue;
      const fresh = on.filter((t) => !hasStatus(t, e.status) && !(t.immune[e.status] ?? 0) && !t.mods.statusImmune.includes(e.status));
      const weight = e.status === 'doom' ? 1.6 : def.kind === 'control' ? 0.9 : def.kind === 'recovery' ? 0.7 : 0.4;
      const sideK = def.positive ? k : iq !== undefined && iq >= 0.6 ? 1.3 : 0.7 + 0.3 * (iq ?? 1);
      v += fresh.length * weight * (e.chance ?? 1) * sideK * (iq !== undefined && iq >= 0.6 && def.kind === 'control' ? 1 + 0.4 * threatShare(on) : 1);
    } else if (e.kind === 'heal') {
      v += on.reduce((n, t) => n + Math.max(0, 0.75 - ratio(t)) * 3, 0) * k;
    } else if (e.kind === 'shield') {
      v += on.filter((t) => !hasStatus(t, 'shield')).length * 0.45 * k;
    } else if (e.kind === 'cleanse') {
      for (const t of on) {
        if (e.doom && hasStatus(t, 'doom')) v += 4 * k;
        v += t.statuses.filter((st) => isCleansable(ctx, st.id)).length * 0.6 * k;
      }
    } else if (e.kind === 'dispel') {
      v += on.reduce((n, t) => n + t.statuses.filter((st) => ctx.statuses[st.id]?.positive).length * 0.4, 0);
    } else if (e.kind === 'mp') {
      v += on.filter((t) => t.mp < t.stats.mp * 0.4).length * 0.5;
    } else if (e.kind === 'revive') {
      v += on.filter((t) => t.hp <= 0).length * 3 * k;
    }
  }
  return v;
}

/** How dangerous the strongest of `targets` is next to the rest of its side (0..1), for aiming control at the biggest threat. */
function threatShare(targets: readonly Combatant[]): number {
  const power = (c: Combatant) => c.stats.atk + c.stats.matk;
  const total = targets.reduce((n, c) => n + power(c), 0);
  return total > 0 ? Math.max(...targets.map(power)) / total : 0;
}

/** Whether `c` can heal or revive (a target a clever enemy goes for first). */
const isHealer = (c: Combatant, ctx: CombatContext): boolean =>
  c.skills.some((s) => ctx.skills[s.id]?.effects.some((e) => e.kind === 'heal' || e.kind === 'revive'));

/**
 * A clever enemy sets its friends up: a status that a reaction needs on the target, when a friend has a ready skill of that reaction's
 * element, is worth more than the status alone.
 */
function comboBonus(state: BattleState, actor: Combatant, skill: SkillDef, ctx: CombatContext): number {
  const applies = skill.effects.filter((e): e is Extract<Effect, { kind: 'status' }> => e.kind === 'status').map((e) => e.status);
  if (applies.length === 0) return 0;
  const friends = alliesOf(state, actor.side);
  for (const r of ctx.reactions) {
    if (!r.requiresStatus || !applies.includes(r.requiresStatus)) continue;
    const ready = friends.some((f) =>
      f.skills.some((s) => {
        const sk = ctx.skills[s.id];
        const el = sk ? skillElement(sk, f) : null;
        return !!sk && sk.power > 0 && el !== null && (f.cooldowns[sk.id] ?? 0) === 0 && f.mp >= skillMpCost(sk, s.level) && r.elements.includes(el);
      }),
    );
    if (ready) return 0.9;
  }
  return 0;
}

/** Where a clever enemy aims: the wounded (focus fire) and the ones that heal. Nothing for the plain AI or a clumsy fighter. */
function targetBias(actor: Combatant, target: Combatant, ctx: CombatContext): number {
  const iq = actor.iq;
  if (iq === undefined || iq < 0.6) return 0;
  return ((1 - ratio(target)) * 0.5 + (isHealer(target, ctx) ? 0.5 : 0)) * iq;
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
  const bonus = (ultimate ? 2.5 : 0) + (actor.iq !== undefined && actor.iq >= 0.6 ? comboBonus(state, actor, skill, ctx) * actor.iq : 0);
  switch (skill.target) {
    case 'enemy': {
      let best: Option | null = null;
      for (const t of aimable) {
        const dmg = skill.power > 0 ? estimate(actor, t, skill, ctx) / basic : 0;
        const kill = skill.power > 0 && estimate(actor, t, skill, ctx) >= t.hp && (actor.iq === undefined || actor.iq >= 0.35) ? 0.8 : 0;
        const score = dmg + kill + effectValue(state, skill.effects, [t], actor, ctx) + targetBias(actor, t, ctx) + bonus - cost * 0.6;
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
  const iq = actor.iq;
  // A clumsy fighter does not see a kill coming and aims with a lot of noise; a clever one adds focus fire and healers.
  const noise = iq === undefined ? 0 : (1 - iq) * 4;
  const jitter = new Map(foes.map((c) => [c.id, noise > 0 ? (rng.next() - 0.5) * noise : 0]));
  const attackTarget = [...foes].sort((a, b) => {
    const s = (c: Combatant) => (basicOn(c) >= c.hp && (iq === undefined || iq >= 0.35) ? -10 : 0) - basicOn(c) / basic + ratio(c) - targetBias(actor, c, ctx) + (jitter.get(c.id) ?? 0);
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
  // The plain AI draws among options within 15% of the best; a clumsy fighter among a wider spread, now and then at random from them
  // all; a clever one among the very best.
  if (iq !== undefined && rng.next() < (1 - iq) * 0.5) return options[Math.floor(rng.next() * options.length)]!.action;
  const best = Math.max(...options.map((o) => o.score));
  const keep = iq === undefined ? 0.85 : 0.6 + 0.35 * iq;
  const good = options.filter((o) => o.score >= best * keep);
  return good[Math.floor(rng.next() * good.length)]!.action;
}

/** At the start of a round every enemy picks what it will do (its intent, §15.4). */
export function planIntents(state: BattleState, ctx: CombatContext): void {
  state.combatants.forEach((c, i) => {
    if (c.side !== 'enemy' || c.hp <= 0) return;
    c.intent = chooseAction(state, ctx, c.id, hashSeed('intent', state.seed, state.round, i));
  });
}
