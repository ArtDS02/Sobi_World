// The AI of the battle (spec V2 §8.5): what the enemies — and the Auto mode for the player's side — choose each turn: a scored
// pick among the basic attack and the usable skills, drawn from the better ones with a seeded rng. Pure.
import { hashSeed, mulberry32 } from '../../core/rng';
import { act, alliesOf, current, elementMultiplier, foesOf, type CombatContext } from './engine';
import type { BattleAction, BattleState, Combatant, Element, SkillDef, StatusId } from './types';

const hasStatus = (c: Combatant, id: StatusId) => c.statuses.some((s) => s.id === id);

/** What `actor` may do now: skills it can pay and use, with their legal targets. */
export function usableSkills(actor: Combatant, ctx: CombatContext): SkillDef[] {
  return actor.skills.map((id) => ctx.skills[id]).filter((sk): sk is SkillDef => !!sk && (actor.cooldowns[sk.id] ?? 0) <= 0 && actor.energy >= sk.cost);
}

const ratio = (c: Combatant) => c.hp / c.maxHp;

/** The AI of the enemies and of auto-play: a scored choice among attack, usable skills, drawn from the better ones. */
export function chooseAction(state: BattleState, ctx: CombatContext): BattleAction | null {
  const actor = current(state);
  if (!actor) return null;
  const foes = foesOf(state, actor.side);
  const friends = alliesOf(state, actor.side);
  if (foes.length === 0) return null;
  const rng = mulberry32(hashSeed('ai', state.seed, state.counter));
  /** The foe worth hitting: one it can finish, then the weakest to its element, then the lowest HP. */
  const pick = (element: Element, power: number) =>
    [...foes].sort((a, b) => {
      const score = (c: Combatant) => (c.hp <= actor.atk * power * 0.8 ? -10 : 0) - elementMultiplier(element, c.element, ctx.rules) * 2 + ratio(c);
      return score(a) - score(b);
    })[0]!;

  const options: { score: number; action: BattleAction }[] = [{ score: 1, action: { kind: 'attack', target: pick(actor.element, 1).id } }];
  for (const skill of usableSkills(actor, ctx)) {
    const hurtFriends = friends.filter((f) => ratio(f) < 0.6);
    if (skill.power > 0) {
      const target = skill.target === 'allEnemies' ? null : pick(skill.element, skill.power);
      const reach = skill.target === 'allEnemies' ? foes.length : 1;
      const mult = target ? elementMultiplier(skill.element, target.element, ctx.rules) : 1;
      options.push({ score: skill.power * mult * Math.min(reach, 2.2) * 1.15 + (skill.statuses.length > 0 ? 0.2 : 0), action: target ? { kind: 'skill', skillId: skill.id, target: target.id } : { kind: 'skill', skillId: skill.id } });
    } else if (skill.healPct > 0) {
      if (hurtFriends.length === 0) continue;
      const weakest = [...hurtFriends].sort((a, b) => ratio(a) - ratio(b))[0]!;
      const reach = skill.target === 'allAllies' ? hurtFriends.length : 1;
      options.push({ score: 0.8 + (1 - ratio(weakest)) * 2.2 * Math.min(reach, 2), action: skill.target === 'ally' ? { kind: 'skill', skillId: skill.id, target: weakest.id } : { kind: 'skill', skillId: skill.id } });
    } else {
      // A buff or a debuff: worth it when the target does not carry it yet.
      const targets = skill.target === 'enemy' ? [pick(skill.element, 1)] : skill.target === 'allEnemies' ? foes : skill.target === 'self' ? [actor] : friends;
      const fresh = targets.filter((t) => skill.statuses.some((st) => !hasStatus(t, st.status)));
      if (fresh.length === 0) continue;
      const first = fresh[0]!;
      options.push({ score: 1.1 + 0.2 * Math.min(fresh.length, 3), action: skill.target === 'enemy' || skill.target === 'ally' ? { kind: 'skill', skillId: skill.id, target: first.id } : { kind: 'skill', skillId: skill.id } });
    }
  }
  const best = Math.max(...options.map((o) => o.score));
  const good = options.filter((o) => o.score >= best * 0.85);
  return good[Math.floor(rng.next() * good.length)]!.action;
}

/** Plays the battle to its end with the AI on both sides (the Admin simulation and "auto"). Stops at `limit` actions. */
export function autoPlay(state: BattleState, ctx: CombatContext, limit = 400): BattleState {
  let s = state;
  for (let i = 0; i < limit && !s.outcome; i += 1) {
    const action = chooseAction(s, ctx);
    if (!action) break;
    const r = act(s, action, ctx);
    if (!r.ok) break;
    s = r.state;
  }
  return s;
}
