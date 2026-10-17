// The closed vocabularies of Combat V2 (decision 037, spec §1, §9–§12): nine elements, the statuses, the targets and kinds of skills.
// The rules engine (src/systems/combat/types.ts) keeps the same lists; a test checks they match.
import { z } from 'zod';

export const ELEMENT_VALUES = ['METAL', 'NATURE', 'WATER', 'FIRE', 'EARTH', 'LIGHTNING', 'DARK', 'LIGHT', 'VOID'] as const;
export const INTERACTION_VALUES = ['STRONG', 'NEUTRAL', 'WEAK', 'RESIST', 'IMMUNE'] as const;
export const STATUS_VALUES = [
  'poison', 'burn', 'wet', 'freeze', 'stun', 'disable', 'doom',
  'atkUp', 'atkDown', 'defUp', 'defDown', 'matkUp', 'matkDown', 'mdefUp', 'mdefDown',
  'accUp', 'accDown', 'evaUp', 'evaDown', 'spdUp', 'spdDown',
  'shield', 'taunt', 'regen', 'autoRevive',
] as const;
export const STAT_VALUES = ['hp', 'mp', 'atk', 'def', 'matk', 'mdef', 'spd', 'acc', 'eva', 'crit'] as const;
export const TARGET_VALUES = ['enemy', 'allEnemies', 'randomEnemies', 'ally', 'allAllies', 'self', 'all'] as const;
export const SKILL_TYPE_VALUES = ['unique', 'class', 'ultimate', 'enemy'] as const;
export const CATEGORY_VALUES = ['physical', 'magical', 'hybrid', 'support'] as const;

export const element = z.enum(ELEMENT_VALUES);
export const statusId = z.enum(STATUS_VALUES);
export const skillId = z.string().regex(/^skill_[a-z0-9_]+$/);

const nonNeg = z.number().finite().min(0);
const share = z.number().finite().min(0).max(1);

/** All ten stats; every one is required so a row never silently misses one. */
export const statsSchema = z.strictObject(Object.fromEntries(STAT_VALUES.map((k) => [k, nonNeg])) as Record<(typeof STAT_VALUES)[number], typeof nonNeg>);
export const partialStatsSchema = z.strictObject(Object.fromEntries(STAT_VALUES.map((k) => [k, nonNeg.optional()])) as Record<(typeof STAT_VALUES)[number], z.ZodOptional<typeof nonNeg>>);

const to = z.enum(['self', 'allies', 'foes']).optional();

export const effectSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('heal'), pct: share, to }),
  z.strictObject({ kind: z.literal('shield'), pct: share, to }),
  z.strictObject({ kind: z.literal('status'), status: statusId, turns: z.number().int().min(1).optional(), chance: share.optional(), to }),
  z.strictObject({ kind: z.literal('cleanse'), count: z.number().int().min(0).optional(), doom: z.boolean().optional(), to }),
  z.strictObject({ kind: z.literal('dispel'), count: z.number().int().min(0).optional(), to }),
  z.strictObject({ kind: z.literal('clearAll') }),
  z.strictObject({ kind: z.literal('mp'), amount: z.number().int(), to }),
  z.strictObject({ kind: z.literal('rage'), amount: z.number().int(), to }),
  z.strictObject({ kind: z.literal('revive'), pct: share }),
]);

export const perLevelSchema = z.strictObject({
  power: nonNeg.optional(),
  heal: nonNeg.optional(),
  chance: nonNeg.optional(),
  mpCost: z.number().finite().optional(),
});
