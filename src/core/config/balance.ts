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

  // Trough (D17)
  TROUGH_AUTO_FEED_AT: 50, // a pig auto-eats when hunger falls to this
  TROUGH_CAPACITY_PER_LEVEL: 10, // capacity = START + (level-1) * this, cap 120 (unreachable, DECISIONS Q6)

  // Happiness (D18)
  HAPPY_CLEAN_WEIGHT: 0.55,
  HAPPY_HUNGER_WEIGHT: 0.45,
  HAPPY_SICK_PENALTY: 40,
  SELL_MULT_MIN: 0.7,
  SELL_MULT_SPAN: 0.5, // price mult = MIN + SPAN * happiness/100

  BREEDING_FEE: 200,

  XP_EFFECTIVE_FEED_MAX_HUNGER: 80,
  XP_EFFECTIVE_CLEAN_MAX_CLEAN: 70,
  XP: { FEED: 2, CLEAN: 2, SELL: 10, BREED: 15, ORDER: 25, DISCOVERY: 30 },

  MAX_LEVEL: 10,
  LEVEL_XP: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700],

  MAX_SLOTS: 12,
  SLOT_UNLOCKS: {
    5: { cost: 2000, level: 2 },
    6: { cost: 4000, level: 3 },
    7: { cost: 7000, level: 4 },
    8: { cost: 12000, level: 5 },
    9: { cost: 20000, level: 6 },
    10: { cost: 32000, level: 7 },
    11: { cost: 50000, level: 8 },
    12: { cost: 80000, level: 9 },
  },

  // Orders (D20)
  ORDER_WINDOW_MS: 4 * 3600 * 1000,
  ORDER_TTL_MS: 8 * 3600 * 1000, // an order outlives its window by one window
  ORDER_SLOTS_PER_WINDOW: 3, // §8.14: slot in 0..2
  ORDER_MAX_ACTIVE: 6, // DECISIONS C1: two live windows x 3 slots (spec said 3)
  ORDER_REWARD_MULT: { 0: 1.5, 50: 1.8, 75: 2.2 }, // keyed by minHappiness

  DISCOVERY_BONUS_GOLD: 500, // first time a breed or skin is seen
} as const;
