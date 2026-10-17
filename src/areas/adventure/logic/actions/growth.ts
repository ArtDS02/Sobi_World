// How a fighter grows outside battle (spec §7): opening and upgrading nodes of its class tree with SP, the class skills it carries, the
// temple (changing class gives every SP back; a tree reset is free the first time), Skill Scrolls; and the camp's own settings:
// formations and the leader on the map. Tree and loadout may change while the party walks (not during a battle); the members of the
// trip then carry the new skills at once. Changing class or resetting waits for the camp.
import type { RosterEntry } from '../../../../core/area-registry/registry';
import type { ErrorCode } from '../../../../core/config/errors';
import type { WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../../../../core/types';
import { AB, CLASSES, NODES, SKILL_SCROLL, SKILLS, identityOf, type ClassId } from '../config/content';
import { classOf, uniqueSkills } from '../fighters';
import type { AdventureState, Fighter } from '../state';
import { classLoadout, spSpent, stepCost, whyNotLoadout, whyNotStep } from '../tree';
import { fighterOf } from './camp';
import { put, runAdventure, spend, take, type AdventureResult, type Body } from './kit';

type Roster = { roster: readonly RosterEntry[] };

/** The fighter, its identity and its class, or the error. */
function who(a: AdventureState, key: string, roster: readonly RosterEntry[], now: number) {
  const entry = roster.find((r) => r.key === key);
  const identity = entry ? identityOf(entry) : undefined;
  if (!entry || !identity) return null;
  const f = fighterOf(a, key, now);
  return { entry, identity, f, classId: classOf(f, identity) };
}

/** The slice with the fighter changed, and its trip member's skills refreshed when it is walking. */
function withFighter(a: AdventureState, key: string, f: Fighter, classId: ClassId): AdventureState {
  let run = a.run;
  if (run && run.phase === 'explore' && run.team.some((m) => m.key === key)) {
    run = {
      ...run,
      team: run.team.map((m) => (m.key === key ? { ...m, skills: [...m.skills.filter((s) => SKILLS[s.id]?.type === 'unique'), ...classLoadout(f, classId)] } : m)),
    };
  }
  return { ...a, fighters: { ...a.fighters, [key]: f }, run };
}

function noBattle(a: AdventureState): ErrorCode | null {
  return a.run?.phase === 'battle' ? 'IN_BATTLE' : null;
}

/** Opens a node of the fighter's class tree, or raises its level (§7.2–7.3). */
export function stepNode(world: WorldSave, args: Roster & { key: string; nodeId: string }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    const busy = noBattle(a);
    if (busy) return { ok: false, error: busy };
    const it = who(a, args.key, args.roster, ctx.now);
    if (!it) return { ok: false, error: 'NOT_A_FIGHTER' };
    const error = whyNotStep(it.f, it.classId, args.nodeId);
    if (error) return { ok: false, error };
    const node = NODES[args.nodeId]!;
    const cost = stepCost(it.f, node)!;
    const level = Math.max(it.f.tree[node.id] ?? 0, node.starter ? 1 : 0) + 1;
    const f: Fighter = { ...it.f, sp: it.f.sp - cost, tree: { ...it.f.tree, [node.id]: level } };
    return { ok: true, world: put(w, withFighter(a, args.key, f, it.classId)), events: [{ type: 'ADVENTURE_NODE_OPENED', key: args.key, nodeId: node.id, level }] };
  });
}

/** The class skills the fighter carries into battle (§7.4). */
export function setLoadout(world: WorldSave, args: Roster & { key: string; skills: string[] }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    const busy = noBattle(a);
    if (busy) return { ok: false, error: busy };
    const it = who(a, args.key, args.roster, ctx.now);
    if (!it) return { ok: false, error: 'NOT_A_FIGHTER' };
    const error = whyNotLoadout(it.f, it.classId, args.skills);
    if (error) return { ok: false, error };
    const f: Fighter = { ...it.f, skills: [...args.skills] };
    return { ok: true, world: put(w, withFighter(a, args.key, f, it.classId)), events: [{ type: 'ADVENTURE_LOADOUT_SET', key: args.key }] };
  });
}

/** Coins the temple asks to change class / to reset the tree now. */
export const classChangeCost = (f: Pick<Fighter, 'level'>): number => AB.temple.classChangePerLevel * f.level;
export const resetCost = (f: Pick<Fighter, 'level' | 'resets'>): number => (f.resets === 0 ? 0 : AB.temple.respecPerLevel * f.level);

/** At the temple: another class; every SP comes back, the tree and the loadout start over (§5). Not during a trip. */
export function changeClass(world: WorldSave, args: Roster & { key: string; classId: ClassId }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const it = who(a, args.key, args.roster, ctx.now);
    if (!it) return { ok: false, error: 'NOT_A_FIGHTER' };
    if (!CLASSES[args.classId]) return { ok: false, error: 'INVALID_REQUEST' };
    if (args.classId === it.classId) return { ok: false, error: 'SAME_CLASS' };
    const paid = spend(w, 'coins', classChangeCost(it.f), 'ADVENTURE_TEMPLE', ctx, `class:${args.classId}`);
    if (!paid.ok) return paid;
    const f: Fighter = { ...it.f, classId: args.classId, sp: it.f.sp + spSpent(it.f, it.classId), tree: {}, skills: null };
    return { ok: true, world: put(paid.world, { ...a, fighters: { ...a.fighters, [args.key]: f } }), events: [{ type: 'ADVENTURE_CLASS_CHANGED', key: args.key, classId: args.classId }] };
  });
}

/** At the temple: the tree starts over with every SP back (the first time free). Not during a trip. */
export function resetTree(world: WorldSave, args: Roster & { key: string }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    if (a.run) return { ok: false, error: 'RUN_ACTIVE' };
    const it = who(a, args.key, args.roster, ctx.now);
    if (!it) return { ok: false, error: 'NOT_A_FIGHTER' };
    const back = spSpent(it.f, it.classId);
    if (back === 0 && Object.keys(it.f.tree).length === 0) return { ok: false, error: 'NOTHING_TO_DO' };
    const paid = spend(w, 'coins', resetCost(it.f), 'ADVENTURE_TEMPLE', ctx, 'reset');
    if (!paid.ok) return paid;
    const f: Fighter = { ...it.f, sp: it.f.sp + back, tree: {}, skills: null, resets: it.f.resets + 1 };
    return { ok: true, world: put(paid.world, { ...a, fighters: { ...a.fighters, [args.key]: f } }), events: [{ type: 'ADVENTURE_TREE_RESET', key: args.key }] };
  });
}

/** A Skill Scroll from the bag gives SP to one fighter. */
export function useScroll(world: WorldSave, args: Roster & { key: string }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    const busy = noBattle(a);
    if (busy) return { ok: false, error: busy };
    const it = who(a, args.key, args.roster, ctx.now);
    if (!it) return { ok: false, error: 'NOT_A_FIGHTER' };
    const taken = take(w, SKILL_SCROLL, 1);
    if (!taken.ok) return taken;
    const f: Fighter = { ...it.f, sp: it.f.sp + AB.sp.scroll };
    return {
      ok: true,
      world: put(taken.world, { ...a, fighters: { ...a.fighters, [args.key]: f } }),
      events: [
        { type: 'ADVENTURE_ITEM_USED', itemId: SKILL_SCROLL },
        { type: 'ADVENTURE_SP_GAINED', key: args.key, amount: AB.sp.scroll, why: 'scroll' },
      ],
    };
  });
}

/** Saves the chosen party as formation `index` (an empty list clears it). */
export function saveFormation(world: WorldSave, args: { index: number; keys: string[] }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    if (!Number.isInteger(args.index) || args.index < 0 || args.index >= AB.team.formations) return { ok: false, error: 'INVALID_REQUEST' };
    if (args.keys.length > AB.team.max || new Set(args.keys).size !== args.keys.length) return { ok: false, error: 'TEAM_INVALID' };
    const formations = Array.from({ length: AB.team.formations }, (_, i) => a.formations[i] ?? { keys: [] });
    formations[args.index] = { keys: [...args.keys] };
    return { ok: true, world: put(w, { ...a, formations }), events: [{ type: 'ADVENTURE_FORMATION_SAVED', index: args.index }] };
  });
}

/** Who walks at the head of the party: So or Bi. */
export function setLeader(world: WorldSave, args: { leader: 'so' | 'bi' }, ctx: ActionContext): AdventureResult {
  return runAdventure(world, ctx, (w, a): Body => {
    if (args.leader !== 'so' && args.leader !== 'bi') return { ok: false, error: 'INVALID_REQUEST' };
    if (a.leader === args.leader) return { ok: false, error: 'NOTHING_TO_DO' };
    return { ok: true, world: put(w, { ...a, leader: args.leader }), events: [{ type: 'ADVENTURE_LEADER_SET', leader: args.leader }] };
  });
}

/** The skills a fighter takes into battle now (for the screens). */
export const battleSkillsOf = (a: AdventureState, entry: RosterEntry, now: number) => {
  const identity = identityOf(entry);
  if (!identity) return [];
  const f = fighterOf(a, entry.key, now);
  return [...uniqueSkills(f, identity), ...classLoadout(f, classOf(f, identity))];
};
