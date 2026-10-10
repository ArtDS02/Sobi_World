// content/adventure/enemies.json — the enemies of the zones: stats, skills, what they give.
import { z } from 'zod';
import { assetId, itemId, nonNeg, posInt, text, unit } from '../fields';
import { ELEMENT_VALUES } from './skills';
import { statsSchema } from './archetypes';

export const dropSchema = z.strictObject({ itemId, chance: unit, min: posInt, max: posInt });

export const enemySchema = z.strictObject({
  id: z.string().regex(/^enemy_[a-z0-9_]+$/),
  nameVi: text,
  element: z.enum(ELEMENT_VALUES),
  stats: statsSchema,
  skills: z.array(z.string().regex(/^skill_[a-z0-9_]+$/)),
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
  for (const e of f.enemies) for (const d of e.drops) if (d.max < d.min) ctx.addIssue({ code: 'custom', message: `${e.id}: drop max < min` });
});
