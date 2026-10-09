// content/farm/balance.json — the farm's numbers (spec §6.4, GAME_BALANCE.md; Sobi Farm values kept in
// GĐ1, the Sobi World timescale comes in GĐ2). Key names are the code's BALANCE constants.
import { z } from 'zod';
import { NEED_LEVELS, RARITY_VALUES } from '../vocab';
import { int, itemId, nonNeg, posInt, unit } from '../fields';

const seconds = nonNeg;
const ms = nonNeg;

const balanceSchema = z.strictObject({
  START_GOLD: nonNeg,
  START_SLOTS: posInt,
  START_INVENTORY: z.record(itemId, int.min(0)),
  START_TROUGH_CAPACITY: nonNeg,
  HUNGER_MAX: posInt,
  CLEAN_MAX: posInt,
  STAGE_YOUNG_AT: z.number().min(0).max(100),
  SICK_CLEAN_THRESHOLD: z.number().min(0).max(100),
  SICK_CHANCE_PER_INTERVAL: unit,
  SICK_INTERVAL_SEC: seconds,
  SICK_STARVING_MULTIPLIER: nonNeg,
  SICK_MAX_EPISODES_PER_DAY: int.min(0),
  SICK_RECOVERY_SEC: seconds,
  CARE_HUNGER_GROWTH_RATIO: nonNeg,
  CARE_HUNGER_MIN_SEC: seconds,
  CARE_CLEAN_GROWTH_RATIO: nonNeg,
  CARE_CLEAN_MIN_SEC: seconds,
  TROUGH_AUTO_FEED_AT: z.number().min(0).max(100),
  TROUGH_CAPACITY_PER_LEVEL: nonNeg,
  TROUGH_CAPACITY_MAX: nonNeg,
  HAPPY_CLEAN_WEIGHT: unit,
  HAPPY_HUNGER_WEIGHT: unit,
  HAPPY_SICK_PENALTY: nonNeg,
  SELL_MULT_MIN: nonNeg,
  SELL_MULT_SPAN: nonNeg,
  BREEDING_FEE: nonNeg,
  SHOP_MAX_QUANTITY: posInt,
  PIG_NAME_MAX: posInt,
  XP_EFFECTIVE_FEED_MAX_HUNGER: z.number().min(0).max(100),
  XP_EFFECTIVE_CLEAN_MAX_CLEAN: z.number().min(0).max(100),
  XP: z.strictObject({ FEED: nonNeg, CLEAN: nonNeg, SELL: nonNeg, BREED: nonNeg, ORDER: nonNeg, DISCOVERY: nonNeg }),
  MAX_LEVEL: posInt,
  /** XP needed for level n + 1 at index n (index 0 = level 1 = 0 XP). */
  LEVEL_XP: z.array(int.min(0)).min(1),
  NURSERY_MAX: posInt,
  MAX_SLOTS: posInt,
  /** Slot number (as a string key) -> its unlock. */
  SLOT_UNLOCKS: z.record(z.string().regex(/^\d+$/), z.strictObject({ cost: nonNeg, level: posInt })),
  ORDER_WINDOW_MS: ms,
  ORDER_TTL_MS: ms,
  ORDER_SLOTS_PER_WINDOW: posInt,
  ORDER_MAX_ACTIVE: posInt,
  /** Keyed by the order's minHappiness (0, 50, 75). */
  ORDER_REWARD_MULT: z.strictObject({ 0: nonNeg, 50: nonNeg, 75: nonNeg }),
  DISCOVERY_BONUS_GOLD: nonNeg,
});

export const farmBalanceFileSchema = z
  .strictObject({
    balance: balanceSchema,
    care: z.strictObject({
      /** Lowest value (inclusive) of each care level. */
      needLevelMin: z.strictObject(Object.fromEntries(NEED_LEVELS.map((l) => [l, z.number().min(0).max(100)])) as Record<(typeof NEED_LEVELS)[number], z.ZodNumber>),
      /** Dropping into this level or a worse one notifies, once per drop. */
      notifyFrom: z.enum(NEED_LEVELS),
    }),
    /** NPC order demand per rarity: common species are wanted more often. */
    orderDemand: z.strictObject(Object.fromEntries(RARITY_VALUES.map((r) => [r, nonNeg])) as Record<(typeof RARITY_VALUES)[number], typeof nonNeg>),
    /** Neighbour's help (DECISIONS PG-1). */
    relief: z.strictObject({ FOOD: posInt, MEDICINE_MAX: posInt, START_FOOD: posInt }),
  })
  .superRefine((f, ctx) => {
    const b = f.balance;
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (b.LEVEL_XP.length !== b.MAX_LEVEL) issue('balance.LEVEL_XP needs one entry per level (MAX_LEVEL)');
    if (b.LEVEL_XP.some((x, i) => i > 0 && x <= b.LEVEL_XP[i - 1]!)) issue('balance.LEVEL_XP must increase');
    if (b.START_SLOTS > b.MAX_SLOTS) issue('balance.START_SLOTS > MAX_SLOTS');
    for (let slot = b.START_SLOTS + 1; slot <= b.MAX_SLOTS; slot++) {
      if (!b.SLOT_UNLOCKS[String(slot)]) issue(`balance.SLOT_UNLOCKS has no slot ${slot}`);
    }
    const levels = NEED_LEVELS.map((l) => f.care.needLevelMin[l]);
    if (levels.some((v, i) => i > 0 && v >= levels[i - 1]!)) issue('care.needLevelMin must decrease from good to critical');
    if (Math.abs(b.HAPPY_CLEAN_WEIGHT + b.HAPPY_HUNGER_WEIGHT - 1) > 1e-9) issue('balance.HAPPY_*_WEIGHT must sum to 1');
  });
