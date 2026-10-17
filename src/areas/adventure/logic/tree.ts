// The class skill tree of a fighter (spec §7): which nodes are open and at what level (the starter node is open from the start), what
// opening / upgrading a node costs and why it cannot happen yet, the SP spent, and the class skills it carries (the loadout). Pure.
import type { ErrorCode } from '../../../core/config/errors';
import type { SkillSlot } from '../../../systems/combat/types';
import { AB, NODES, SKILLS, TREES, type ClassId, type TreeNode } from './config/content';
import type { Fighter } from './state';

type TreeHolder = Pick<Fighter, 'tree'>;

const maxLevelOf = (n: TreeNode): number => SKILLS[n.skill]?.maxLevel ?? 1;

/** Level of a node for this fighter: 0 = closed; the starter node is at least 1. */
export const nodeLevel = (f: TreeHolder, n: TreeNode): number => Math.max(f.tree[n.id] ?? 0, n.starter ? 1 : 0);

/** SP the next step of a node costs: opening, or the next upgrade level; null when it is at the top. */
export function stepCost(f: TreeHolder, n: TreeNode): number | null {
  const level = nodeLevel(f, n);
  if (level === 0) return n.unlockCost;
  if (level >= maxLevelOf(n)) return null;
  return n.upgradeCost[level - 1] ?? null;
}

/** Why the next step of `nodeId` cannot be taken by a fighter of `classId`, or null when it can. */
export function whyNotStep(f: Pick<Fighter, 'tree' | 'sp'>, classId: ClassId, nodeId: string): ErrorCode | null {
  const n = NODES[nodeId];
  if (!n || n.classId !== classId) return 'NODE_UNKNOWN';
  const level = nodeLevel(f, n);
  if (level === 0 && n.requires.some((r) => nodeLevel(f, NODES[r.node]!) < r.level)) return 'NODE_LOCKED';
  const cost = stepCost(f, n);
  if (cost === null) return 'NODE_MAXED';
  if (f.sp < cost) return 'NOT_ENOUGH_SP';
  return null;
}

/** SP put into a tree (openings past the starter and every upgrade). */
export function spSpent(f: TreeHolder, classId: ClassId): number {
  let sum = 0;
  for (const n of TREES[classId]) {
    const level = f.tree[n.id] ?? 0;
    if (level === 0) continue;
    if (!n.starter) sum += n.unlockCost;
    for (let l = 1; l < level; l += 1) sum += n.upgradeCost[l - 1] ?? 0;
  }
  return sum;
}

/** The opened class skills, in the tree's order, with their level. */
export function openedSkills(f: TreeHolder, classId: ClassId): SkillSlot[] {
  return TREES[classId].flatMap((n) => {
    const level = nodeLevel(f, n);
    return level > 0 ? [{ id: n.skill, level }] : [];
  });
}

/** The class skills it carries into battle: its chosen loadout (those still open), or the first opened ones. */
export function classLoadout(f: Pick<Fighter, 'tree' | 'skills'>, classId: ClassId): SkillSlot[] {
  const open = openedSkills(f, classId);
  const slots = AB.tree.loadoutSlots;
  if (f.skills === null) return open.slice(0, slots);
  return f.skills.flatMap((id) => open.filter((s) => s.id === id)).slice(0, slots);
}

/** Why `skills` is not a valid loadout for this fighter, or null. */
export function whyNotLoadout(f: TreeHolder, classId: ClassId, skills: readonly string[]): ErrorCode | null {
  if (skills.length > AB.tree.loadoutSlots || new Set(skills).size !== skills.length) return 'LOADOUT_INVALID';
  const open = new Set(openedSkills(f, classId).map((s) => s.id));
  return skills.every((id) => open.has(id)) ? null : 'LOADOUT_INVALID';
}
