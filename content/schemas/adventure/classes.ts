// content/adventure/classes.json — the four combat classes and their skill trees (spec §5, §7): base stats of a class, and for each
// class a tree of nodes (tier, branch, SP to open, SP per upgrade level, prerequisites). Opening a node gives its class skill.
import { z } from 'zod';
import { posInt, text } from '../fields';
import { skillId, statsSchema } from './combat';

export const CLASS_ID_VALUES = ['tanker', 'striker', 'mage', 'support'] as const;
export const classId = z.enum(CLASS_ID_VALUES);

export const classSchema = z.strictObject({
  id: classId,
  nameVi: text,
  descVi: text,
  /** Level-1 stats of a Common creature of this class. */
  stats: statsSchema,
});

const nodeId = z.string().regex(/^node_[a-z0-9_]+$/);

export const nodeSchema = z.strictObject({
  id: nodeId,
  skill: skillId,
  tier: z.number().int().min(1).max(5),
  branch: z.enum(['core', 'left', 'right']),
  /** SP to open it. */
  unlockCost: z.number().int().min(0),
  /** SP for each upgrade level after the first (length = the skill's maxLevel − 1). */
  upgradeCost: z.array(posInt),
  /** Nodes (with a level) that must be reached first: one or several (A + C → D). */
  requires: z.array(z.strictObject({ node: nodeId, level: posInt })),
  /** Open from the start, for free (every class has one). */
  starter: z.boolean().default(false),
});

export const treeSchema = z.strictObject({ classId, nodes: z.array(nodeSchema).min(1) });

export const classesFileSchema = z
  .strictObject({ classes: z.array(classSchema), trees: z.array(treeSchema) })
  .superRefine((f, ctx) => {
    const ids = f.classes.map((c) => c.id).sort();
    if (ids.join() !== [...CLASS_ID_VALUES].sort().join()) ctx.addIssue({ code: 'custom', message: 'the file must list the four classes exactly once' });
    const treeIds = f.trees.map((t) => t.classId).sort();
    if (treeIds.join() !== [...CLASS_ID_VALUES].sort().join()) ctx.addIssue({ code: 'custom', message: 'every class needs exactly one tree' });
    const all = new Set<string>();
    for (const t of f.trees) {
      const mine = new Map(t.nodes.map((n) => [n.id, n]));
      if (t.nodes.filter((n) => n.starter).length !== 1) ctx.addIssue({ code: 'custom', message: `${t.classId}: exactly one starter node` });
      for (const n of t.nodes) {
        if (all.has(n.id)) ctx.addIssue({ code: 'custom', message: `duplicate node ${n.id}` });
        all.add(n.id);
        for (const r of n.requires) {
          const req = mine.get(r.node);
          if (!req) ctx.addIssue({ code: 'custom', message: `${n.id}: requires ${r.node}, not in the ${t.classId} tree` });
          else if (req.tier >= n.tier) ctx.addIssue({ code: 'custom', message: `${n.id}: requires a node of the same or a higher tier` });
        }
        if (n.tier > 1 && n.requires.length === 0) ctx.addIssue({ code: 'custom', message: `${n.id}: a node above tier 1 needs a prerequisite` });
      }
    }
  });
