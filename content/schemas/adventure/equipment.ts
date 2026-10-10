// content/adventure/equipment.json — what each piece of equipment adds (its rarity and price are those of its item).
import { z } from 'zod';
import { itemId, nonNeg } from '../fields';

export const EQUIPMENT_SLOT_VALUES = ['weapon', 'armor', 'charm'] as const;

export const equipmentSchema = z.strictObject({
  id: itemId,
  slot: z.enum(EQUIPMENT_SLOT_VALUES),
  stats: z.strictObject({ hp: nonNeg.optional(), atk: nonNeg.optional(), def: nonNeg.optional(), spd: nonNeg.optional(), crit: nonNeg.optional() }),
});

export const equipmentFileSchema = z.strictObject({ equipment: z.array(equipmentSchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.equipment.map((e) => e.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate equipment ${dup}` });
});
