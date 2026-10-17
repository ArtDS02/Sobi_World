// Resolving what an action does (spec §15.1 steps 7–16): statuses on and off (an Up and a Down cancel, immunity after control), damage
// through the shield, Rage from damage taken, KO and Auto-Revive, boss phases, one hit of an attack (hit roll, element chart, defence,
// guard, reaction, crit, spread, gear), the side effects of a reaction, and the effects of a skill or item on whom they reach. Pure.
import type { Rng } from '../../core/rng';
import { alliesOf, elementMultiplier, foesOf, hasStatus, isAlive, isCleansable, skillChanceBonus, skillElement, skillHealBonus, skillPower, stat } from './rules';
import type { BattleEvent, BattleState, Category, Combatant, CombatContext, Effect, EffectTo, Element, ReactionDef, SkillDef, StatusId } from './types';

// ---- Statuses ---------------------------------------------------------------------------------------------------------

const OPPOSITE = (id: StatusId): StatusId | null =>
  id.endsWith('Up') ? (`${id.slice(0, -2)}Down` as StatusId) : id.endsWith('Down') ? (`${id.slice(0, -4)}Up` as StatusId) : null;

export function removeStatus(c: Combatant, id: StatusId, ctx: CombatContext) {
  if (!c.statuses.some((s) => s.id === id)) return;
  c.statuses = c.statuses.filter((s) => s.id !== id);
  const after = ctx.statuses[id]?.immunityAfter ?? 0;
  if (after > 0) c.immune[id] = after;
}

/** Puts a status on `target` (an Up and a Down of the same stat cancel out); false when it could not stick. */
export function addStatus(target: Combatant, id: StatusId, turns: number, amount: number, source: Element | null, ctx: CombatContext): boolean {
  const def = ctx.statuses[id];
  if (!def || !isAlive(target)) return false;
  if ((target.immune[id] ?? 0) > 0 || target.mods.statusImmune.includes(id)) return false;
  const opposite = OPPOSITE(id);
  if (opposite && hasStatus(target, opposite)) {
    target.statuses = target.statuses.filter((s) => s.id !== opposite);
    return true;
  }
  const existing = target.statuses.find((s) => s.id === id);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns);
    existing.stacks = Math.min(def.maxStacks, existing.stacks + 1);
    existing.amount = Math.max(existing.amount, amount);
    existing.source = source ?? existing.source;
  } else target.statuses.push({ id, turns, amount, stacks: 1, source: source ?? def.sourceElement });
  return true;
}

// ---- Damage, KO, Rage -------------------------------------------------------------------------------------------------

/** Lowers HP through the shield first: what the shield took and what reached the HP. */
export function hurt(c: Combatant, amount: number): { absorbed: number; toHp: number } {
  let left = amount;
  let absorbed = 0;
  const shield = c.statuses.find((x) => x.id === 'shield');
  if (shield && shield.amount > 0) {
    absorbed = Math.min(shield.amount, left);
    shield.amount -= absorbed;
    left -= absorbed;
    if (shield.amount <= 0) c.statuses = c.statuses.filter((x) => x.id !== 'shield');
  }
  const toHp = Math.min(c.hp, left);
  c.hp -= toHp;
  return { absorbed, toHp };
}

/** Rage from damage that reached the HP (§8.3), after every mitigation. */
export function gainRage(c: Combatant, toHp: number, ctx: CombatContext, events: BattleEvent[]) {
  if (c.rageMax <= 0 || toHp <= 0 || !isAlive(c)) return;
  const was = c.rage;
  c.rage = Math.min(c.rageMax, c.rage + Math.round(c.rageMax * (toHp / c.stats.hp) * ctx.rules.rageK));
  if (was < c.rageMax && c.rage >= c.rageMax && c.ultimate && !c.ultimateUsed) events.push({ type: 'ready', actor: c.id });
}

/** A combatant at 0 HP: an Auto-Revive brings it back, else it is down (§15.1 step 16). */
export function settleKo(c: Combatant, ctx: CombatContext, events: BattleEvent[]) {
  if (c.hp > 0) return;
  const revive = c.statuses.find((s) => s.id === 'autoRevive');
  if (revive) {
    c.hp = Math.max(1, Math.round(c.stats.hp * (ctx.statuses.autoRevive?.revivePct ?? 0.3)));
    c.statuses = [];
    events.push({ type: 'revive', target: c.id, amount: c.hp });
    return;
  }
  c.statuses = [];
  c.guarding = false;
  c.intent = null;
  events.push({ type: 'defeat', target: c.id });
}

/** A boss passes into its next phase when its HP falls under the mark (§14). */
function checkPhase(c: Combatant, ctx: CombatContext, events: BattleEvent[]) {
  const next = c.phases[c.phase];
  if (!next || !isAlive(c) || c.hp / c.stats.hp >= next.hpBelow) return;
  c.phase += 1;
  for (const id of next.addSkills) if (!c.skills.some((s) => s.id === id)) c.skills.push({ id, level: 1 });
  for (const st of next.statuses) addStatus(c, st.status, st.turns, 0, null, ctx);
  if (next.element) c.element = next.element;
  events.push({ type: 'phase', target: c.id, phase: c.phase });
}

/** A hybrid skill hits as physical or magical, whichever attack of the caster is higher. */
export function hitCategory(actor: Combatant, skill: SkillDef | null, ctx: CombatContext): Category {
  if (!skill) return 'physical';
  if (skill.category !== 'hybrid') return skill.category;
  return stat(actor, 'atk', ctx) >= stat(actor, 'matk', ctx) ? 'physical' : 'magical';
}

function reactionFor(target: Combatant, element: Element | null, category: Category, ctx: CombatContext): ReactionDef | null {
  let best: ReactionDef | null = null;
  for (const r of ctx.reactions) {
    const byElement = element !== null && r.elements.includes(element);
    const byCategory = r.categories.includes(category);
    if (!byElement && !byCategory) continue;
    if (r.requiresStatus && !hasStatus(target, r.requiresStatus)) continue;
    if (r.requiresSourceElement && !target.statuses.some((s) => s.source === r.requiresSourceElement && !ctx.statuses[s.id]?.positive)) continue;
    if (r.requiresTag && !target.tags.includes(r.requiresTag)) continue;
    if (!best || r.priority > best.priority) best = r;
  }
  return best;
}

interface HitInput {
  skill: SkillDef | null;
  level: number;
}

/** One hit of an attack or skill on `target` (§15.1 steps 7–16); false when it missed. */
export function strike(rng: Rng, s: BattleState, actor: Combatant, target: Combatant, hit: HitInput, ctx: CombatContext, events: BattleEvent[]): boolean {
  const { rules } = ctx;
  const { skill, level } = hit;
  const element = skillElement(skill, actor);
  const category = hitCategory(actor, skill, ctx);
  const accuracy = skill ? skill.accuracy : rules.basicAccuracy;
  const chance = Math.min(1, Math.max(rules.hitMin, (accuracy / 100) * (stat(actor, 'acc', ctx) / 100) * (1 - stat(target, 'eva', ctx) / 100)));
  if (rng.next() >= chance) {
    events.push({ type: 'miss', actor: actor.id, target: target.id, skillId: skill?.id ?? null });
    return false;
  }
  const physical = category === 'physical';
  const off = stat(actor, physical ? 'atk' : 'matk', ctx);
  const def = stat(target, physical ? 'def' : 'mdef', ctx);
  const power = skill ? skillPower(skill, level) : rules.basicPower;
  const mult = element ? elementMultiplier(ctx, element, target) : 1;
  const resist = element ? 1 - Math.min(rules.resistCap, target.mods.elementResist[element] ?? 0) : 1;
  const guard = target.guarding ? rules.guardTaken : 1;
  const reaction = reactionFor(target, element, category, ctx);
  const reactionMult = reaction ? reaction.damageMult + reaction.voidBonus : 1;
  const crit = rng.next() * 100 < stat(actor, 'crit', ctx) + (skill?.critBonus ?? 0);
  const spread = 1 + (rng.next() * 2 - 1) * rules.variance;
  const amp = 1 + (element ? Math.min(rules.elementDamageCap, actor.mods.elementDamage[element] ?? 0) : 0) + (actor.mods.categoryDamage[category] ?? 0) + actor.mods.damage;
  const raw = ((off * power * rules.defenseK) / (rules.defenseK + def)) * mult * resist * guard * reactionMult * (crit ? rules.critMultiplier : 1) * spread * amp;
  const amount = mult * resist > 0 ? Math.max(1, Math.round(raw)) : 0;
  const { absorbed, toHp } = hurt(target, amount);
  events.push({ type: 'damage', actor: actor.id, target: target.id, amount, crit, mult, skillId: skill?.id ?? null, absorbed, element });
  if (reaction) applyReaction(rng, s, actor, target, reaction, ctx, events);
  gainRage(target, toHp, ctx, events);
  checkPhase(target, ctx, events);
  settleKo(target, ctx, events);
  return true;
}

/** The side effects of a reaction (§11, step 13): its status, the status it uses up, buffs it strips. */
function applyReaction(rng: Rng, s: BattleState, actor: Combatant, target: Combatant, r: ReactionDef, ctx: CombatContext, events: BattleEvent[]) {
  events.push({ type: 'reaction', target: target.id, reaction: r.id });
  if (r.consume) {
    if (r.requiresStatus) removeStatus(target, r.requiresStatus, ctx);
    if (r.requiresSourceElement) target.statuses = target.statuses.filter((st) => st.source !== r.requiresSourceElement || ctx.statuses[st.id]?.positive);
  }
  if (r.dispel > 0) dispel(target, r.dispel, ctx, events);
  if (r.applyStatus) {
    const a = r.applyStatus;
    const victims = a.allFoes ? foesOf(s, actor.side) : [target];
    for (const v of victims) {
      if (!isAlive(v) || rng.next() >= a.chance) continue;
      if (addStatus(v, a.status, a.turns, 0, null, ctx)) events.push({ type: 'status', actor: actor.id, target: v.id, status: a.status, skillId: null });
    }
  }
}

function dispel(target: Combatant, count: number | undefined, ctx: CombatContext, events: BattleEvent[]) {
  const good = target.statuses.filter((st) => ctx.statuses[st.id]?.positive).map((st) => st.id);
  const gone = count === undefined || count <= 0 ? good : good.slice(0, count);
  if (gone.length === 0) return;
  target.statuses = target.statuses.filter((st) => !gone.includes(st.id));
  events.push({ type: 'cleanse', target: target.id, statuses: gone });
}

function cleanse(target: Combatant, count: number | undefined, doom: boolean, ctx: CombatContext, events: BattleEvent[]) {
  const bad = target.statuses.filter((st) => isCleansable(ctx, st.id) || (doom && st.id === 'doom')).map((st) => st.id);
  const gone = count === undefined || count <= 0 ? bad : bad.slice(0, count);
  if (gone.length === 0) return;
  for (const id of gone) removeStatus(target, id, ctx);
  events.push({ type: 'cleanse', target: target.id, statuses: gone });
}

function healTo(actor: Combatant, target: Combatant, amount: number, skillId: string | null, events: BattleEvent[]) {
  const n = Math.min(target.stats.hp - target.hp, Math.max(1, Math.round(amount)));
  if (n <= 0) return;
  target.hp += n;
  events.push({ type: 'heal', actor: actor.id, target: target.id, amount: n, skillId });
}

/** The effects of a skill, item or Ultimate on one target (§15.1 steps 11–12). */
function applyEffects(rng: Rng, actor: Combatant, target: Combatant, effects: readonly Effect[], skill: SkillDef | null, level: number, ctx: CombatContext, events: BattleEvent[]) {
  const skillId = skill?.id ?? null;
  for (const e of effects) {
    const who = toOf(e) === 'self' ? actor : target;
    if (e.kind !== 'revive' && !isAlive(who)) continue;
    switch (e.kind) {
      case 'heal':
        healTo(actor, who, who.stats.hp * (e.pct + skillHealBonus(skill, level)), skillId, events);
        break;
      case 'shield': {
        const amount = Math.round(actor.stats.hp * (e.pct + skillHealBonus(skill, level)));
        if (addStatus(who, 'shield', ctx.statuses.shield?.turns ?? 3, amount, null, ctx)) events.push({ type: 'status', actor: actor.id, target: who.id, status: 'shield', skillId });
        break;
      }
      case 'status': {
        const def = ctx.statuses[e.status];
        if (!def) break;
        const base = e.chance ?? 1;
        const hostile = who.side !== actor.side;
        let chance = base + skillChanceBonus(skill, level);
        if (hostile) chance += Math.min(ctx.rules.statusChanceBonusCap, actor.mods.statusChance[e.status] ?? 0) - Math.min(ctx.rules.resistCap, who.mods.statusResist[e.status] ?? 0);
        if (base < 1) chance = Math.min(ctx.rules.statusChanceCap, chance);
        if (rng.next() >= chance) {
          if (hostile) events.push({ type: 'resist', target: who.id, status: e.status });
          break;
        }
        // A status cast on the one acting counts its own turn, so it lasts the turns the skill says.
        const turns = (e.turns ?? def.turns) + (who === actor ? 1 : 0);
        const source = skill ? skillElement(skill, actor) : null;
        if (addStatus(who, e.status, turns, 0, source, ctx)) events.push({ type: 'status', actor: actor.id, target: who.id, status: e.status, skillId });
        else events.push({ type: 'resist', target: who.id, status: e.status });
        break;
      }
      case 'cleanse':
        cleanse(who, e.count, e.doom ?? false, ctx, events);
        break;
      case 'dispel':
        dispel(who, e.count, ctx, events);
        break;
      case 'clearAll': {
        const gone = who.statuses.filter((st) => st.id !== 'doom').map((st) => st.id);
        if (gone.length > 0) {
          who.statuses = who.statuses.filter((st) => st.id === 'doom');
          events.push({ type: 'cleanse', target: who.id, statuses: gone });
        }
        break;
      }
      case 'mp':
        who.mp = Math.max(0, Math.min(who.stats.mp, who.mp + e.amount));
        break;
      case 'rage':
        who.rage = Math.max(0, Math.min(who.rageMax, who.rage + e.amount));
        break;
      case 'revive':
        if (!isAlive(who) && who.side === actor.side) {
          who.hp = Math.max(1, Math.round(who.stats.hp * e.pct));
          events.push({ type: 'revive', target: who.id, amount: who.hp });
        }
        break;
    }
  }
}

const toOf = (e: Effect): EffectTo | null => ('to' in e && e.to ? e.to : null);

/** Hands each effect to whom it reaches: the targets, the caster, every ally or every foe still standing. */
export function spread(rng: Rng, s: BattleState, actor: Combatant, targets: readonly Combatant[], effects: readonly Effect[], skill: SkillDef | null, level: number, ctx: CombatContext, events: BattleEvent[]) {
  const on = (to: EffectTo | null) => effects.filter((e) => toOf(e) === to);
  for (const t of targets) applyEffects(rng, actor, t, on(null), skill, level, ctx, events);
  if (on('self').length > 0) applyEffects(rng, actor, actor, on('self'), skill, level, ctx, events);
  if (on('allies').length > 0) for (const t of alliesOf(s, actor.side)) applyEffects(rng, actor, t, on('allies'), skill, level, ctx, events);
  if (on('foes').length > 0) for (const t of foesOf(s, actor.side)) applyEffects(rng, actor, t, on('foes'), skill, level, ctx, events);
}

