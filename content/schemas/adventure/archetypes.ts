// content/adventure/archetypes.json — who can fight and how (spec V2 §7, §8.5): a few fighting styles, each with its element,
// base stats and four skills (two from the start, one at level 10, one at level 20). A pig takes the style of its family
// (or its own species when listed); a fish takes the style listed for its species — only those listed can fight.
import { z } from 'zod';
import { FAMILY_VALUES } from '../vocab';
import { nonNeg, posInt, text } from '../fields';
import { ELEMENT_VALUES } from './skills';

const skillId = z.string().regex(/^skill_[a-z0-9_]+$/);

export const statsSchema = z.strictObject({ hp: posInt, atk: posInt, def: nonNeg, spd: posInt, crit: nonNeg });

export const archetypeSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  nameVi: text,
  descVi: text,
  element: z.enum(ELEMENT_VALUES),
  stats: statsSchema,
  skills: z.array(skillId).length(4),
});

const archetypeRef = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const archetypesFileSchema = z
  .strictObject({
    archetypes: z.array(archetypeSchema).min(1),
    /** Pig family → style. Every family has one. */
    families: z.strictObject(Object.fromEntries(FAMILY_VALUES.map((f) => [f, archetypeRef])) as Record<(typeof FAMILY_VALUES)[number], typeof archetypeRef>),
    /** Pig species → style, when it differs from its family's. */
    species: z.record(z.string().regex(/^PIG_[A-Z0-9_]+$/), archetypeRef),
    /** Fish species → style: the fish that can fight. */
    fish: z.record(z.string().regex(/^fish_[a-z0-9_]+$/), archetypeRef),
  })
  .superRefine((f, ctx) => {
    const ids = new Set(f.archetypes.map((a) => a.id));
    if (ids.size !== f.archetypes.length) ctx.addIssue({ code: 'custom', message: 'duplicate archetype id' });
    for (const ref of [...Object.values(f.families), ...Object.values(f.species), ...Object.values(f.fish)]) {
      if (!ids.has(ref)) ctx.addIssue({ code: 'custom', message: `unknown archetype ${ref}` });
    }
  });
