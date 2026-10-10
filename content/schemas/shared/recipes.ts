// content/shared/recipes.json — recipes run by a workshop in real time (core/production, spec §6 Recipe).
import { z } from 'zod';
import { itemId, posInt, text } from '../fields';

const itemCounts = z.partialRecord(itemId, posInt).refine((r) => Object.keys(r).length > 0, 'at least one item');

export const recipeSchema = z.strictObject({
  id: z.string().regex(/^recipe_[a-z0-9_]+$/),
  nameVi: text,
  /** The building that cooks it (an id of the Area's buildings). */
  building: z.string().regex(/^[a-z][a-z0-9_]*$/),
  inputs: itemCounts,
  outputs: itemCounts,
  /** Real minutes one batch takes. */
  durationMin: z.number().finite().positive(),
});

export const recipesFileSchema = z.strictObject({ recipes: z.array(recipeSchema) }).superRefine((f, ctx) => {
  const ids = f.recipes.map((r) => r.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate recipe id ${dup}` });
});
