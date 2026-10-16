// content/<area>/hybrids.json — cross-breeding recipes (decision 035): two parent species of one Area give a rarer one.
// Plants (Garden, Cloud) are crossed at the Area's lab, one harvest of each parent and a fee per try; fish cross when a
// male and a female of the two species lay eggs. Every rare species has at least one recipe whose parents can be reached
// from what the shop sells (tests/unit/hybrids.test.ts).
import { z } from 'zod';
import { nonNeg, posInt } from '../fields';

export const hybridRecipeSchema = z.strictObject({
  id: z.string().regex(/^hy_[a-z0-9_]+$/),
  /** The two parent species, order ignored (both may be the same species). */
  parents: z.tuple([z.string().min(1), z.string().min(1)]),
  /** The species the crossing can give. */
  result: z.string().min(1),
  /** Chance of the result on one try, in percent. */
  percent: z.number().finite().min(1).max(100),
});

export const hybridsFileSchema = z
  .strictObject({
    /** Failed tries of one recipe in a row after which the next one always gives the result. */
    pityAfter: posInt,
    /** Percentage points each failed try adds to the next try of the same recipe. */
    pityStep: nonNeg,
    /** Plants only: what one try costs and gives. */
    lab: z
      .strictObject({
        /** Coins per try (one harvest of each parent is used too). */
        cost: nonNeg,
        /** Seeds of the result a successful try gives. */
        seeds: posInt,
        /** Seeds of a parent a failed try gives back, so a try is never all lost. */
        consolation: z.number().int().min(0),
        xp: nonNeg,
      })
      .optional(),
    recipes: z.array(hybridRecipeSchema).min(1),
  })
  .superRefine((f, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = f.recipes.map((r) => r.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) issue(`duplicate hybrid recipe ${dup}`);
    const pairs = f.recipes.map((r) => [...r.parents].sort().join('+'));
    const dupPair = pairs.find((p, i) => pairs.indexOf(p) !== i);
    if (dupPair) issue(`two recipes share the parents ${dupPair}`);
    for (const r of f.recipes) if (r.parents.includes(r.result)) issue(`${r.id}: a parent cannot be its own result`);
  });

export type HybridsFile = z.infer<typeof hybridsFileSchema>;
export type HybridRecipeRow = z.infer<typeof hybridRecipeSchema>;
