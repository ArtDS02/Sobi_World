// content/breeding/traits.json — the traits a creature can inherit (GAME_BALANCE §4, spec V2 §7). A creature
// holds at most `maxTraits` (set in balance.json); a RARE+ one may be hidden until the creature reaches 5
// hearts of Bond. Effects are multipliers (1 = no change) or flat percentage points (`mutation`).
import { z } from 'zod';
import { nonNeg, text } from '../fields';

export const traitId = z.string().regex(/^trait_[a-z0-9_]+$/);

export const traitEffectsSchema = z.strictObject({
  /** Growth speed multiplier (1.15 = grows 15% faster). */
  growth: z.number().finite().min(0.5).max(3).optional(),
  /** Shipping price multiplier. */
  sellValue: z.number().finite().min(0.5).max(3).optional(),
  /** Bond gained per care action, multiplier. */
  bondGain: z.number().finite().min(0.5).max(3).optional(),
  /** Percentage points added to the mutation chance of a breeding this creature takes part in. */
  mutation: nonNeg.max(50).optional(),
});

export const traitSchema = z.strictObject({
  id: traitId,
  nameVi: text,
  descVi: text,
  /** COMMON shows from birth; RARE and EPIC may be hidden (see balance.json `hiddenChance`). */
  tier: z.enum(['COMMON', 'RARE', 'EPIC']),
  /** Relative weight when a trait is drawn from its tier. */
  weight: z.number().finite().positive(),
  effects: traitEffectsSchema,
  /** false = retired: never drawn, creatures that have it keep it. */
  active: z.boolean(),
});

export const traitsFileSchema = z.strictObject({ traits: z.array(traitSchema).min(1) }).superRefine((f, ctx) => {
  const ids = f.traits.map((t) => t.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate trait id ${dup}` });
  for (const tier of ['COMMON', 'RARE', 'EPIC'] as const) {
    if (!f.traits.some((t) => t.tier === tier && t.active)) {
      ctx.addIssue({ code: 'custom', message: `no active ${tier} trait: breeding draws from every tier` });
    }
  }
});
