// content/adventure/skills.json — the skills of Sobi Adventure (GAME_BALANCE §9): what each one costs and does.
import { z } from 'zod';
import { nonNeg, posInt, text, unit } from '../fields';

export const ELEMENT_VALUES = ['FIRE', 'WIND', 'EARTH', 'WATER'] as const;
export const STATUS_VALUES = ['atkUp', 'defUp', 'haste', 'slow', 'burn', 'stun', 'shield'] as const;
export const SKILL_TARGET_VALUES = ['enemy', 'allEnemies', 'ally', 'allAllies', 'self'] as const;

export const skillStatusSchema = z.strictObject({ status: z.enum(STATUS_VALUES), turns: posInt, chance: unit.optional() });

export const skillSchema = z.strictObject({
  id: z.string().regex(/^skill_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  element: z.enum(ELEMENT_VALUES),
  target: z.enum(SKILL_TARGET_VALUES),
  /** Damage as a multiple of the attacker's attack (0 = none). */
  power: nonNeg,
  /** Heal as a share of the target's max HP (0 = none). */
  healPct: unit,
  /** Battle energy it costs. */
  cost: z.number().int().min(0),
  /** Own turns before it can be used again. */
  cooldown: z.number().int().min(0),
  statuses: z.array(skillStatusSchema),
  critBonus: nonNeg.optional(),
});

export const skillsFileSchema = z.strictObject({ skills: z.array(skillSchema).min(12) }).superRefine((f, ctx) => {
  const ids = f.skills.map((s) => s.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate skill id ${dup}` });
  for (const s of f.skills) if (s.power === 0 && s.healPct === 0 && s.statuses.length === 0) ctx.addIssue({ code: 'custom', message: `${s.id} does nothing` });
});
