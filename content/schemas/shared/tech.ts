// content/shared/tech.json — the technologies (GĐ11): upgrades bought with Sobi Coin and Adventure materials, each with levels.
import { z } from 'zod';
import { itemId, nonNeg, posInt, text } from '../fields';

export const TECH_EFFECT_VALUES = ['productionSpeed', 'maxBatches', 'prepSlots', 'adventureEnergy'] as const;
export type TechEffect = (typeof TECH_EFFECT_VALUES)[number];

export const techLevelSchema = z.strictObject({
  /** What the technology gives once this level is bought (total, not an increment): a share (0.15 = 15%) or a count. */
  value: nonNeg,
  coins: nonNeg,
  items: z.partialRecord(itemId, posInt),
});

export const techSchema = z.strictObject({
  id: z.string().regex(/^tech_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  effect: z.enum(TECH_EFFECT_VALUES),
  levels: z.array(techLevelSchema).min(1).max(5),
});

export const techFileSchema = z.strictObject({ techs: z.array(techSchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.techs.map((t) => t.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate tech id ${dup}` });
  const effects = f.techs.map((t) => t.effect);
  const dupEffect = effects.find((e, i) => effects.indexOf(e) !== i);
  if (dupEffect) ctx.addIssue({ code: 'custom', message: `two technologies give ${dupEffect}` });
  for (const t of f.techs) t.levels.forEach((l, i) => { if (i > 0 && l.value < t.levels[i - 1]!.value) ctx.addIssue({ code: 'custom', message: `${t.id}: level ${i + 1} gives less than level ${i}` }); });
});
