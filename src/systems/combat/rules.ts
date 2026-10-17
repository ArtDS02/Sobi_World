// The small rules every part of a battle reads (spec V2 §9–§10): effective stats under statuses, the element chart, status queries,
// skill numbers at a level, who a skill may reach. Pure; shared by the engine and the AI so both read the battle the same way.
import type { BattleState, Combatant, CombatContext, Element, Interaction, SkillDef, StatKey, StatusId } from './types';

export const isAlive = (c: Combatant): boolean => c.hp > 0;
export const hasStatus = (c: Combatant, id: StatusId): boolean => c.statuses.some((s) => s.id === id);
export const statusOf = (c: Combatant, id: StatusId) => c.statuses.find((s) => s.id === id);
export const find = (s: BattleState, id: string): Combatant | undefined => s.combatants.find((c) => c.id === id);

export const current = (s: BattleState): Combatant | null => (s.outcome ? null : (find(s, s.order[0] ?? '') ?? null));
export const alliesOf = (s: BattleState, side: Combatant['side']): Combatant[] => s.combatants.filter((c) => c.side === side && isAlive(c));
export const foesOf = (s: BattleState, side: Combatant['side']): Combatant[] => s.combatants.filter((c) => c.side !== side && isAlive(c));

/** A stat with its statuses applied (multipliers first, then points); a frozen combatant cannot dodge. */
export function stat(c: Combatant, key: StatKey, ctx: Pick<CombatContext, 'statuses'>): number {
  let mult = 1;
  let add = 0;
  for (const s of c.statuses) {
    const def = ctx.statuses[s.id];
    if (!def?.stat || def.stat.key !== key) continue;
    mult *= def.stat.mult ?? 1;
    add += def.stat.add ?? 0;
  }
  const value = c.stats[key] * mult + add;
  if (key === 'eva' && hasStatus(c, 'freeze')) return 0;
  return Math.max(0, value);
}

export const interactionOf = (ctx: Pick<CombatContext, 'elements'>, attack: Element, defender: Element): Interaction =>
  ctx.elements.chart[attack]?.[defender] ?? 'NEUTRAL';

/** Damage multiplier of an attack of `attack` on `target` (§9.3): both of its elements, its overrides, bounded. */
export function elementMultiplier(ctx: Pick<CombatContext, 'elements'>, attack: Element, target: Pick<Combatant, 'element' | 'element2' | 'mods'>): number {
  const forced = target.mods.elementOverrides[attack];
  if (forced) return ctx.elements.multipliers[forced];
  const m = ctx.elements.multipliers;
  const first = m[interactionOf(ctx, attack, target.element)];
  if (!target.element2) return first;
  const product = first * m[interactionOf(ctx, attack, target.element2)];
  return Math.min(ctx.elements.dualMax, Math.max(ctx.elements.dualMin, product));
}

/** The element a skill hits with (`SELF` = the caster's own); null = no damage element. */
export const skillElement = (skill: Pick<SkillDef, 'element'> | null, actor: Pick<Combatant, 'element'>): Element | null =>
  skill === null || skill.element === 'SELF' ? actor.element : skill.element;

export const levelOf = (c: Combatant, skillId: string): number => c.skills.find((s) => s.id === skillId)?.level ?? 1;

export const skillPower = (skill: SkillDef, level: number): number => skill.power * (1 + (skill.perLevel.power ?? 0) * (level - 1));
export const skillMpCost = (skill: SkillDef, level: number): number => Math.max(0, Math.round(skill.mpCost + (skill.perLevel.mpCost ?? 0) * (level - 1)));
export const skillHealBonus = (skill: SkillDef | null, level: number): number => (skill ? (skill.perLevel.heal ?? 0) * (level - 1) : 0);
export const skillChanceBonus = (skill: SkillDef | null, level: number): number => (skill ? (skill.perLevel.chance ?? 0) * (level - 1) : 0);

/** Statuses that stop skills (disable) or the whole turn (stun, freeze). */
export const noSkills = (c: Combatant, ctx: Pick<CombatContext, 'statuses'>): boolean => c.statuses.some((s) => ctx.statuses[s.id]?.noSkills);
export const skipsTurn = (c: Combatant, ctx: Pick<CombatContext, 'statuses'>): StatusId | null => c.statuses.find((s) => ctx.statuses[s.id]?.skipTurn)?.id ?? null;

export const ultimateReady = (c: Combatant): boolean => c.ultimate !== null && c.rageMax > 0 && c.rage >= c.rageMax && !c.ultimateUsed;

/** The foes a single-target attack may aim at: a foe with Taunt draws every single-target attack (§10.2). */
export function aimableFoes(s: BattleState, actor: Combatant): Combatant[] {
  const foes = foesOf(s, actor.side);
  const taunters = foes.filter((f) => hasStatus(f, 'taunt'));
  return taunters.length > 0 ? taunters : foes;
}

/** Bad statuses a cleanse may take off. */
export const isCleansable = (ctx: Pick<CombatContext, 'statuses'>, id: StatusId): boolean => {
  const def = ctx.statuses[id];
  return !!def && !def.positive && def.cleansable;
};
