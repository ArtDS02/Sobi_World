// Timed gift boxes on the farm (U06, UPDATE_AUDIT.md §6). One farm-wide timer, never one per pig;
// rarer herds wait a little longer but get more per box. TUNABLE.
import type { Rarity } from './rarity';

const HOUR = 3_600_000;

export const GIFTS = {
  /** Wait between spawns for an all-COMMON herd. */
  BASE_INTERVAL_MS: 4 * HOUR,
  /** Interval multiplier by rarity, averaged over the herd: 4 h (COMMON) … 6 h (LEGENDARY). */
  INTERVAL_FACTOR: {
    COMMON: 1,
    UNCOMMON: 1.1,
    RARE: 1.25,
    EPIC: 1.4,
    LEGENDARY: 1.5,
  } satisfies Record<Rarity, number>,
  /** Boxes per spawn: 1 + one more per this many pigs, capped; never more than MAX_ON_FARM lie out. */
  PIGS_PER_EXTRA_BOX: 6,
  MAX_PER_SPAWN: 2,
  MAX_ON_FARM: 3,
  /** Reward "power" of one pig, by rarity; a baby counts BABY_SHARE, an adult the full weight. */
  POWER: { COMMON: 1, UNCOMMON: 2, RARE: 4, EPIC: 7, LEGENDARY: 12 } satisfies Record<
    Rarity,
    number
  >,
  BABY_SHARE: 0.5,
  GOLD_PER_POWER: 40,
  XP_PER_POWER: 3,
  /** Random spread around the computed value: ±25 %. */
  VARIANCE: 0.25,
  MIN_GOLD: 50,
  MAX_GOLD: 3000,
  MIN_XP: 5,
  MAX_XP: 120,
  /** Safety stop for very long absences (spawning stops at MAX_ON_FARM anyway). */
  MAX_STEPS: 1000,
} as const;
