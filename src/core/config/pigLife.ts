// Pig life simulation numbers (DECISIONS PL-1): needs, thresholds, priorities, personality and
// the behaviour timings of the farm's pigs. Data needs (hunger, cleanliness, sickness) keep their
// own rules in balance.ts / care.ts; this file only says how pigs BEHAVE about them. All TUNABLE.

/** Needs the life simulation knows. `enabled: false` = no data or no farm object for it yet. */
export const LIFE_NEEDS = {
  hunger: { enabled: true }, // Pig.hunger + the feed trough (auto-feeding, spec §7.3)
  cleanliness: { enabled: true }, // Pig.cleanliness; no cleaning spot on the farm yet
  health: { enabled: true }, // Pig.isSick / recovering (NH-1)
  sleepiness: { enabled: true }, // view-side need, derived from game time (PL-1)
  thirst: { enabled: false }, // no water trough in the game yet: ready, not simulated
} as const;
export type LifeNeed = keyof typeof LIFE_NEEDS;

/** Sleepiness levels (lowest value, inclusive), best first. */
export const SLEEP_LEVELS = ['awake', 'tired', 'sleepy', 'verySleepy'] as const;
export type SleepLevel = (typeof SLEEP_LEVELS)[number];

export const PIG_LIFE = {
  /** One central AI step for every pig (never per frame, never a timer per pig). */
  tickMs: 500,
  auto: { feed: true, drink: false, sleep: true },

  sleep: {
    levelMin: { awake: 0, tired: 31, sleepy: 61, verySleepy: 81 } satisfies Record<
      SleepLevel,
      number
    >,
    /** Rise while awake, per hour of game time (by day) / per minute (at night). */
    dayRisePerHour: 6,
    nightRisePerMin: 10,
    /** Fall while asleep: a daytime nap per minute, the night's sleep per hour. */
    napRecoverPerMin: 3,
    nightRecoverPerHour: 8,
    /** Lie down at night from this value; by day only from this one (a nap). */
    nightSleepAt: 70,
    daySleepAt: 85,
    /** A daytime nap ends at this value. */
    napWakeAt: 40,
    /** Morning: pigs wake up over this window after the night ends (lazier = later). */
    wakeSpreadMs: 90_000,
    /** The first hour after the night: every sleeper gets up (its night is over) rested to this. */
    morningMs: 3_600_000,
    morningLevel: 10,
    /** A pig first seen by day starts at this much per hour since dawn (capped below sleepy). */
    loadCap: 60,
  },

  feed: {
    /** Eating time at the trough per meal, capped. */
    eatMsPerMeal: 3000,
    maxEatMs: 9000,
    /** Run to the trough at this × walking speed (+ up to `driveSpeed` × foodDrive). */
    runSpeed: 1.4,
    driveSpeed: 0.5,
    /** A hungry pig reacts after up to this long (less with a high foodDrive). */
    maxReactMs: 1500,
    /** Walking there takes longer than this (paused, blocked): eat where it stands. */
    maxSeekMs: 30_000,
    /**
     * Places to eat, as fractions of the trough's bounds (u across, v down; feet position).
     * Overflow pigs reuse them one row further back (`rowBackPx`).
     */
    spots: [
      { u: 0.25, v: 0.05 },
      { u: 0.75, v: 0.05 },
      { u: 1.3, v: 0.45 },
      { u: 1.2, v: -0.25 },
      { u: 0.5, v: -0.4 },
      { u: -0.05, v: -0.35 },
      { u: 0.95, v: -0.7 },
      { u: 1.6, v: 0.05 },
    ],
    rowBackPx: 60,
  },

  idle: {
    /** Pause between two activities, ms (scaled by personality). */
    restMinMs: 1500,
    restMaxMs: 5000,
    /** A hungry (trough empty) or dirty pig mopes: rests this much longer, wanders less. */
    mopeRest: 1.8,
    /** Base weights of the free-time choices (personality reweights them). */
    weights: { wander: 0.5, lookAround: 0.2, idle: 0.3 },
    lookAroundMs: 1400,
    /** Sick / pregnant pigs rest in place this long between checks. */
    restInPlaceMs: 4000,
  },

  social: {
    /** Chance to look for a friend when free (× the social trait, 0..1). */
    chance: 0.35,
    cooldownMs: 40_000,
    /** Friends farther than this are not approached. */
    rangePx: 520,
    /** Stand this far beside the friend. */
    sideGapPx: 125,
    holdMinMs: 3000,
    holdMaxMs: 6000,
  },

  /**
   * Personality traits are 0..1, fixed per pig id. Each scales a behaviour by at most ±spread:
   * energy → wander more / tire slower, laziness → rest longer / tire faster, social → friends,
   * curiosity → look around, foodDrive → react to food faster. Needs keep their priority.
   */
  personality: { spread: 0.35 },

  /** Sleep spots: a cluster inside the walk ellipse toward PIG_HOUSE_PROP_ID (radius fraction). */
  sleepArea: { radius: 0.72, spacingPx: 95 },
} as const;
