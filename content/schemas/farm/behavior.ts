// content/farm/behavior.json — how the farm's pigs BEHAVE (DECISIONS PL-1): needs, thresholds,
// personality and timings of the behaviour AI. Data needs (hunger, cleanliness, sickness) keep their
// own rules in balance.json; this file only says how pigs act on them.
import { z } from 'zod';
import { nonNeg, posInt, unit } from '../fields';

const need = z.strictObject({ enabled: z.boolean() });
const msRange = nonNeg;

export const behaviorFileSchema = z.strictObject({
  /** Needs the life simulation knows; `enabled: false` = no data or no farm object for it yet. */
  needs: z.strictObject({ hunger: need, cleanliness: need, health: need, sleepiness: need, thirst: need }),
  life: z.strictObject({
    /** One central AI step for every pig (never per frame, never a timer per pig). */
    tickMs: posInt,
    auto: z.strictObject({ feed: z.boolean(), drink: z.boolean(), sleep: z.boolean() }),
    sleep: z.strictObject({
      levelMin: z.strictObject({ awake: nonNeg, tired: nonNeg, sleepy: nonNeg, verySleepy: nonNeg }),
      dayRisePerHour: nonNeg,
      nightRisePerMin: nonNeg,
      napRecoverPerMin: nonNeg,
      nightRecoverPerHour: nonNeg,
      nightSleepAt: nonNeg,
      daySleepAt: nonNeg,
      napWakeAt: nonNeg,
      wakeSpreadMs: msRange,
      morningMs: msRange,
      morningLevel: nonNeg,
      loadCap: nonNeg,
    }),
    feed: z.strictObject({
      eatMsPerMeal: msRange,
      maxEatMs: msRange,
      runSpeed: nonNeg,
      driveSpeed: nonNeg,
      maxReactMs: msRange,
      maxSeekMs: msRange,
      /** Places to eat, as fractions of the trough's bounds (u across, v down; feet position). */
      spots: z.array(z.strictObject({ u: z.number(), v: z.number() })).min(1),
      rowBackPx: nonNeg,
    }),
    idle: z.strictObject({
      restMinMs: msRange,
      restMaxMs: msRange,
      mopeRest: nonNeg,
      weights: z.strictObject({ wander: nonNeg, lookAround: nonNeg, idle: nonNeg }),
      lookAroundMs: msRange,
      restInPlaceMs: msRange,
    }),
    social: z.strictObject({
      chance: unit,
      cooldownMs: msRange,
      rangePx: nonNeg,
      sideGapPx: nonNeg,
      holdMinMs: msRange,
      holdMaxMs: msRange,
    }),
    personality: z.strictObject({ spread: unit }),
    sleepArea: z.strictObject({ radius: unit, spacingPx: nonNeg }),
  }),
});
