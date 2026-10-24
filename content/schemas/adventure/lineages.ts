// content/adventure/lineages.json — the nine First Guardian lines (spec §6): each line's element, its four Unique skills and its
// Ultimate; the combat animals — the pig breeds and fish species that can fight (adventure-big-update-1 §14: only these, a few
// standout creatures per line, not every creature) with their line and class, and the overrides a species may carry (a second
// element, its own Unique skills or Ultimate).
import { z } from 'zod';
import { text } from '../fields';
import { classId } from './classes';
import { element, skillId } from './combat';

export const LINEAGE_ID_VALUES = ['nam_hai', 'quy_son', 'da_mac', 'quang_tru', 'loi_duong', 'thiet_giap', 'hoa_giai', 'moc_mau', 'hu_khong'] as const;
export const lineageId = z.enum(LINEAGE_ID_VALUES);

export const lineageSchema = z.strictObject({
  id: lineageId,
  nameVi: text,
  /** The First Guardian the line comes from. */
  guardianVi: text,
  descVi: text,
  element,
  /** The four Unique skills, opened at the levels of balance.levels.uniqueUnlockLevels. */
  unique: z.array(skillId).length(4),
  ultimate: skillId,
});

/** A combat animal: its line and class, and what it carries of its own. */
const speciesSchema = z.strictObject({
  lineage: lineageId,
  classId,
  element2: element.optional(),
  /** Its own Unique skills by slot (null = the line's). */
  unique: z.array(skillId.nullable()).length(4).optional(),
  ultimate: skillId.optional(),
});

export const lineagesFileSchema = z
  .strictObject({
    lineages: z.array(lineageSchema),
    species: z.record(z.string().regex(/^PIG_[A-Z0-9_]+$/), speciesSchema),
    fish: z.record(z.string().regex(/^fish_[a-z0-9_]+$/), speciesSchema),
  })
  .superRefine((f, ctx) => {
    const ids = f.lineages.map((l) => l.id).sort();
    if (ids.join() !== [...LINEAGE_ID_VALUES].sort().join()) ctx.addIssue({ code: 'custom', message: 'the file must list the nine lines exactly once' });
    // Every line keeps at least one combat animal, so every element can be fielded.
    const fielded = new Set([...Object.values(f.species), ...Object.values(f.fish)].map((s) => s.lineage));
    for (const id of LINEAGE_ID_VALUES) if (!fielded.has(id)) ctx.addIssue({ code: 'custom', message: `line ${id} has no combat animal` });
  });
