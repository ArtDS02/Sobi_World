// content/adventure/lineages.json — the nine First Guardian lines (spec §6): each line's element, its four Unique skills and its
// Ultimate; which line and class a pig family / a pig breed / a fish species belongs to, and the overrides a Rare+ species may carry
// (a second element, its own Unique skills or Ultimate). Only the fish listed here can fight.
import { z } from 'zod';
import { FAMILY_VALUES } from '../vocab';
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

const assignment = z.strictObject({ lineage: lineageId, classId });

/** A species' own data: anything left out comes from its family (pig) or must be given (fish). */
const speciesSchema = z.strictObject({
  lineage: lineageId.optional(),
  classId: classId.optional(),
  element2: element.optional(),
  /** Its own Unique skills by slot (null = the line's). */
  unique: z.array(skillId.nullable()).length(4).optional(),
  ultimate: skillId.optional(),
});

export const lineagesFileSchema = z
  .strictObject({
    lineages: z.array(lineageSchema),
    families: z.strictObject(Object.fromEntries(FAMILY_VALUES.map((f) => [f, assignment])) as Record<(typeof FAMILY_VALUES)[number], typeof assignment>),
    species: z.record(z.string().regex(/^PIG_[A-Z0-9_]+$/), speciesSchema),
    fish: z.record(z.string().regex(/^fish_[a-z0-9_]+$/), speciesSchema.extend({ lineage: lineageId, classId })),
  })
  .superRefine((f, ctx) => {
    const ids = f.lineages.map((l) => l.id).sort();
    if (ids.join() !== [...LINEAGE_ID_VALUES].sort().join()) ctx.addIssue({ code: 'custom', message: 'the file must list the nine lines exactly once' });
  });
