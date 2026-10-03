// Balance constants (spec §6.4). TUNABLE.
export const BALANCE = {
  START_GOLD: 5000,
  START_SLOTS: 4,
  START_INVENTORY: { FOOD_BASIC: 10, MEDICINE_COMMON: 1 },
  START_TROUGH_CAPACITY: 20,

  HUNGER_MAX: 100,
  CLEAN_MAX: 100,
  FOOD_HUNGER_RESTORE: 50,

  STAGE_YOUNG_AT: 30,
  SICK_CLEAN_THRESHOLD: 30,
  SICK_CHANCE_PER_INTERVAL: 0.05, // 5% ...
  SICK_INTERVAL_SEC: 600, // ... per 10 minutes of exposure
  SICK_STARVING_MULTIPLIER: 2, // doubled while hunger = 0 (D21: no death)
  // Disease lifecycle (NH-1): Healthy → Ill (until treated) → Recovering → Healthy.
  SICK_MAX_EPISODES_PER_DAY: 1, // onsets per game day (local calendar day)
  SICK_RECOVERY_SEC: 2 * 3600, // immune after medicine

  // Care budgets (NH-1, replaces D16's growth/3 and growth*0.75): full → 0 takes
  // max(MIN, growthSec * RATIO) seconds of game time (game time = wall clock, 1:1).
  CARE_HUNGER_GROWTH_RATIO: 0.5,
  CARE_HUNGER_MIN_SEC: 2 * 3600,
  CARE_CLEAN_GROWTH_RATIO: 1,
  CARE_CLEAN_MIN_SEC: 5 * 3600,

  // Trough (D17)
  TROUGH_AUTO_FEED_AT: 50, // a pig auto-eats when hunger falls to this
  TROUGH_CAPACITY_PER_LEVEL: 10, // capacity = START + (level-1) * this, capped below
  TROUGH_CAPACITY_MAX: 120, // §8.6; unreachable at MAX_LEVEL 10 (DECISIONS Q6)

  // Happiness (D18)
  HAPPY_CLEAN_WEIGHT: 0.55,
  HAPPY_HUNGER_WEIGHT: 0.45,
  HAPPY_SICK_PENALTY: 40,
  SELL_MULT_MIN: 0.7,
  SELL_MULT_SPAN: 0.5, // price mult = MIN + SPAN * happiness/100

  BREEDING_FEE: 200,

  SHOP_MAX_QUANTITY: 99, // §8.10
  PIG_NAME_MAX: 16, // §5.2, §8.12

  XP_EFFECTIVE_FEED_MAX_HUNGER: 80,
  XP_EFFECTIVE_CLEAN_MAX_CLEAN: 70,
  XP: { FEED: 2, CLEAN: 2, SELL: 10, BREED: 15, ORDER: 25, DISCOVERY: 30 },

  MAX_LEVEL: 10,
  LEVEL_XP: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700],

  /** Newborns waiting in the inventory nursery, unborn included (DECISIONS BR-1). */
  NURSERY_MAX: 12,
  MAX_SLOTS: 24, // U05: 30 pigs measured at 0.8 ms/frame; 24 keeps the pen readable
  SLOT_UNLOCKS: {
    5: { cost: 2000, level: 2 },
    6: { cost: 4000, level: 3 },
    7: { cost: 7000, level: 4 },
    8: { cost: 12000, level: 5 },
    9: { cost: 20000, level: 6 },
    10: { cost: 32000, level: 7 },
    11: { cost: 50000, level: 8 },
    12: { cost: 80000, level: 9 },
    13: { cost: 100000, level: 10 },
    14: { cost: 120000, level: 10 },
    15: { cost: 145000, level: 10 },
    16: { cost: 175000, level: 10 },
    17: { cost: 210000, level: 10 },
    18: { cost: 250000, level: 10 },
    19: { cost: 300000, level: 10 },
    20: { cost: 360000, level: 10 },
    21: { cost: 430000, level: 10 },
    22: { cost: 510000, level: 10 },
    23: { cost: 600000, level: 10 },
    24: { cost: 700000, level: 10 },
  },

  // Orders (D20)
  ORDER_WINDOW_MS: 4 * 3600 * 1000,
  ORDER_TTL_MS: 8 * 3600 * 1000, // an order outlives its window by one window
  ORDER_SLOTS_PER_WINDOW: 3, // §8.14: slot in 0..2
  ORDER_MAX_ACTIVE: 6, // DECISIONS C1: two live windows x 3 slots (spec said 3)
  ORDER_REWARD_MULT: { 0: 1.5, 50: 1.8, 75: 2.2 }, // keyed by minHappiness

  DISCOVERY_BONUS_GOLD: 500, // first time a species is seen
} as const;
