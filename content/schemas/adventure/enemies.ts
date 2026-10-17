// content/adventure/enemies.json — the enemies of the zones (spec §14): stats, elements, skills, resistances, boss phases, what they give.
import { z } from 'zod';
import { assetId, itemId, nonNeg, posInt, text, unit } from '../fields';
import { INTERACTION_VALUES, element, skillId, statsSchema, statusId } from './combat';

export { statsSchema } from './combat';

export const dropSchema = z.strictObject({ itemId, chance: unit, min: posInt, max: posInt });

export const phaseSchema = z.strictObject({
  /** The phase starts when its HP share falls under this. */
  hpBelow: unit,
  addSkills: z.array(skillId),
  statuses: z.array(z.strictObject({ status: statusId, turns: posInt })),
  element: element.optional(),
});

export const enemySchema = z.strictObject({
  id: z.string().regex(/^enemy_[a-z0-9_]+$/),
  nameVi: text,
  element,
  element2: element.optional(),
  /** `umbraflux` (corrupted: Light purifies it), `boss`, `elite`. */
  tags: z.array(z.string()).default([]),
  stats: statsSchema,
  skills: z.array(skillId),
  statusResist: z.partialRecord(statusId, unit).default({}),
  statusImmune: z.array(statusId).default([]),
  elementOverrides: z.partialRecord(element, z.enum(INTERACTION_VALUES)).default({}),
  phases: z.array(phaseSchema).default([]),
  /** Experience every fighter of the team gets for it, and the coins it drops. */
  exp: nonNeg,
  coins: nonNeg,
  drops: z.array(dropSchema),
  boss: z.boolean().optional(),
  art: assetId,
});

export const enemiesFileSchema = z.strictObject({ enemies: z.array(enemySchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.enemies.map((e) => e.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate enemy id ${dup}` });
  for (const e of f.enemies) {
    for (const d of e.drops) if (d.max < d.min) ctx.addIssue({ code: 'custom', message: `${e.id}: drop max < min` });
    if (e.boss && !e.statusImmune.includes('doom')) ctx.addIssue({ code: 'custom', message: `${e.id}: a boss is immune to Doom (spec §10.2)` });
  }
});
