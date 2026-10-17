// content/adventure/skills.json — every skill of Sobi Adventure (spec §12): Unique skills of the nine Guardian lines, Class skills of the
// skill trees, Ultimates and the enemies' skills. What each one costs, hits with and does; how an upgrade level makes it better.
import { z } from 'zod';
import { nonNeg, posInt, text } from '../fields';
import { CATEGORY_VALUES, ELEMENT_VALUES, SKILL_TYPE_VALUES, TARGET_VALUES, effectSchema, perLevelSchema, skillId } from './combat';

export { ELEMENT_VALUES, STATUS_VALUES } from './combat';

export const skillSchema = z.strictObject({
  id: skillId,
  nameVi: text,
  descVi: text,
  type: z.enum(SKILL_TYPE_VALUES),
  category: z.enum(CATEGORY_VALUES),
  /** Element of its damage: one of nine, SELF (the caster's own), or null for a skill without damage. */
  element: z.enum([...ELEMENT_VALUES, 'SELF']).nullable(),
  target: z.enum(TARGET_VALUES),
  /** Damage as a multiple of ATK (physical) or MATK (magical); 0 = no damage. */
  power: nonNeg,
  hits: posInt.default(1),
  /** Base hit chance, percent. */
  accuracy: z.number().finite().min(1).max(200).default(100),
  mpCost: z.number().int().min(0),
  /** Own turns before it can be used again. */
  cooldown: z.number().int().min(0),
  critBonus: nonNeg.default(0),
  effects: z.array(effectSchema).default([]),
  /** Upgrade levels in a skill tree (1 = cannot be upgraded). */
  maxLevel: posInt.default(1),
  perLevel: perLevelSchema.default({}),
});

export const skillsFileSchema = z.strictObject({ skills: z.array(skillSchema).min(12) }).superRefine((f, ctx) => {
  const ids = f.skills.map((s) => s.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate skill id ${dup}` });
  for (const s of f.skills) {
    if (s.power === 0 && s.effects.length === 0) ctx.addIssue({ code: 'custom', message: `${s.id} does nothing` });
    if (s.power > 0 && s.element === null) ctx.addIssue({ code: 'custom', message: `${s.id} deals damage: it needs an element (VOID for neutral)` });
    if (s.type === 'ultimate' && s.mpCost > 0) ctx.addIssue({ code: 'custom', message: `${s.id}: an Ultimate costs Rage, not MP` });
  }
});
