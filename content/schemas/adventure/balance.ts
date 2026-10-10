// content/adventure/balance.json — the Adventure's numbers (GAME_BALANCE §9): the battle rules, stats and levels, the team,
// the energy of a run, exhaustion, what the world gets, the starter kit and the items usable in a battle.
import { z } from 'zod';
import { itemId, nonNeg, posInt, unit } from '../fields';
import { RARITY_VALUES } from '../vocab';
import { skillStatusSchema } from './skills';

const factor = z.number().finite().positive();

export const adventureBalanceFileSchema = z.strictObject({
  combat: z.strictObject({
    counter: factor,
    resisted: factor,
    critMultiplier: factor,
    variance: unit,
    defenseK: factor,
    energyStart: z.number().int().min(0),
    energyMax: posInt,
    energyPerTurn: z.number().int().min(0),
    basicEnergyGain: z.number().int().min(0),
    burnPct: unit,
    slowFactor: factor,
    hasteFactor: factor,
    atkUpFactor: factor,
    defUpFactor: factor,
    shieldPct: unit,
    maxRounds: posInt,
  }),
  stats: z.strictObject({
    levelGrowth: nonNeg,
    bondPerHeart: nonNeg,
    rarity: z.strictObject(Object.fromEntries(RARITY_VALUES.map((r) => [r, factor])) as Record<(typeof RARITY_VALUES)[number], typeof factor>),
  }),
  levels: z.strictObject({
    maxLevel: posInt,
    expBase: factor,
    expExponent: factor,
    /** The level at which each of an archetype's four skills opens (GAME_BALANCE §9: 1, 1, 10, 20). */
    skillUnlockLevels: z.array(posInt).length(4),
  }),
  team: z.strictObject({ max: posInt }),
  run: z.strictObject({
    /** Adventure energy a fighter spends to enter a zone, its cap, what it regains an hour. */
    energyCost: posInt,
    energyMax: posInt,
    energyPerHour: nonNeg,
    /** A lost run leaves its fighters exhausted for this many real hours. */
    exhaustHours: nonNeg,
  }),
  /** Experience of the Area (it counts for the one Sobi World Level). */
  xp: z.strictObject({ battleWin: nonNeg, zoneClear: nonNeg }),
  starter: z.strictObject({ breed: z.string().regex(/^PIG_[A-Z0-9_]+$/), items: z.partialRecord(itemId, posInt) }),
  battleItems: z.array(z.strictObject({ itemId, target: z.enum(['ally', 'allAllies']), healPct: unit, statuses: z.array(skillStatusSchema) })),
});
