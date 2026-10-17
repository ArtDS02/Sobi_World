// content/adventure/{elements,statuses,reactions}.json — the tables of Combat V2 (spec §9–§11): the nine elements and their chart, the
// status framework, the element reactions. Three separate files on purpose: the chart and the reactions are two systems (R9).
import { z } from 'zod';
import { text } from '../fields';
import { CATEGORY_VALUES, ELEMENT_VALUES, INTERACTION_VALUES, STATUS_VALUES, STAT_VALUES, element, statusId } from './combat';

const share = z.number().finite().min(0).max(1);
const factor = z.number().finite().min(0);

export const elementsFileSchema = z
  .strictObject({
    elements: z.array(z.strictObject({ id: element, nameVi: text, descVi: text })),
    multipliers: z.strictObject(Object.fromEntries(INTERACTION_VALUES.map((i) => [i, factor])) as Record<(typeof INTERACTION_VALUES)[number], typeof factor>),
    /** Every pair that is not NEUTRAL: attacker → defender. */
    chart: z.array(z.strictObject({ attacker: element, defender: element, interaction: z.enum(INTERACTION_VALUES) })),
    dualMin: factor,
    dualMax: factor,
  })
  .superRefine((f, ctx) => {
    const ids = f.elements.map((e) => e.id).sort();
    if (ids.join() !== [...ELEMENT_VALUES].sort().join()) ctx.addIssue({ code: 'custom', message: 'the file must list exactly the nine elements' });
    const seen = new Set<string>();
    for (const c of f.chart) {
      const key = `${c.attacker}>${c.defender}`;
      if (seen.has(key)) ctx.addIssue({ code: 'custom', message: `duplicate chart pair ${key}` });
      seen.add(key);
      if ((c.attacker === 'VOID' || c.defender === 'VOID') && c.interaction !== 'NEUTRAL') ctx.addIssue({ code: 'custom', message: `${key}: Void is neutral to every element (R5)` });
      if (c.interaction === 'IMMUNE') ctx.addIssue({ code: 'custom', message: `${key}: IMMUNE is only for a boss override` });
    }
    if (f.dualMin > f.dualMax) ctx.addIssue({ code: 'custom', message: 'dualMin > dualMax' });
  });

export const statusSchema = z.strictObject({
  id: statusId,
  nameVi: text,
  descVi: text,
  kind: z.enum(['dot', 'control', 'stat', 'recovery', 'special']),
  positive: z.boolean(),
  sourceElement: element.nullable(),
  turns: z.number().int().min(1),
  maxStacks: z.number().int().min(1),
  cleansable: z.boolean(),
  immunityAfter: z.number().int().min(0),
  tickPct: share,
  stat: z.strictObject({ key: z.enum(STAT_VALUES), mult: factor.optional(), add: z.number().finite().optional() }).optional(),
  skipTurn: z.boolean(),
  noSkills: z.boolean(),
  revivePct: share,
});

export const statusesFileSchema = z.strictObject({ statuses: z.array(statusSchema) }).superRefine((f, ctx) => {
  const ids = f.statuses.map((s) => s.id).sort();
  if (ids.join() !== [...STATUS_VALUES].sort().join()) ctx.addIssue({ code: 'custom', message: 'the file must list every status exactly once' });
});

export const reactionSchema = z.strictObject({
  id: z.string().regex(/^reaction_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  priority: z.number().int(),
  elements: z.array(element),
  categories: z.array(z.enum(CATEGORY_VALUES)),
  requiresStatus: statusId.nullable(),
  requiresSourceElement: element.nullable(),
  requiresTag: z.string().nullable(),
  damageMult: factor,
  voidBonus: factor,
  consume: z.boolean(),
  applyStatus: z.strictObject({ status: statusId, turns: z.number().int().min(1), chance: share, allFoes: z.boolean() }).nullable(),
  dispel: z.number().int().min(0),
});

export const reactionsFileSchema = z.strictObject({ reactions: z.array(reactionSchema) }).superRefine((f, ctx) => {
  for (const r of f.reactions) {
    if (r.elements.length === 0 && r.categories.length === 0) ctx.addIssue({ code: 'custom', message: `${r.id}: needs an element or a category to trigger` });
    if (!r.requiresStatus && !r.requiresSourceElement && !r.requiresTag) ctx.addIssue({ code: 'custom', message: `${r.id}: needs a status, a status source or a tag on the target` });
  }
});
