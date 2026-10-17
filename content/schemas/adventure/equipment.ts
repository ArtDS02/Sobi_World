// content/adventure/equipment.json — what each piece of equipment adds (spec §13): stats, an element affinity, a status affinity,
// resistances, a skill-category bonus. Its rarity and price are those of its item. Affinity never changes a fighter's element (R7).
import { z } from 'zod';
import { itemId, posInt, unit } from '../fields';
import { CATEGORY_VALUES, element, partialStatsSchema, statusId } from './combat';

export const EQUIPMENT_SLOT_VALUES = ['weapon', 'armor', 'charm'] as const;

export const equipmentSchema = z.strictObject({
  id: itemId,
  slot: z.enum(EQUIPMENT_SLOT_VALUES),
  /** Fighter level needed to wear it. */
  levelReq: posInt.default(1),
  stats: partialStatsSchema,
  elementAffinity: z.strictObject({ element, damagePct: unit, resistPct: unit }).optional(),
  statusAffinity: z.strictObject({ status: statusId, chancePct: unit }).optional(),
  elementResist: z.partialRecord(element, unit).optional(),
  statusResist: z.partialRecord(statusId, unit).optional(),
  categoryBonus: z.strictObject({ category: z.enum(CATEGORY_VALUES), pct: unit }).optional(),
});

export const equipmentFileSchema = z.strictObject({ equipment: z.array(equipmentSchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.equipment.map((e) => e.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate equipment ${dup}` });
});
