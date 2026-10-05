// Pig life simulation numbers (DECISIONS PL-1): needs, thresholds, priorities, personality and
// the behaviour timings of the farm's pigs. Data needs (hunger, cleanliness, sickness) keep their
// own rules in balance.ts / care.ts; this file only says how pigs BEHAVE about them. All TUNABLE in
// content/farm/behavior.json.
import { CONTENT } from './content';

/** Needs the life simulation knows. `enabled: false` = no data or no farm object for it yet (thirst:
 * no water trough in the game yet — ready, not simulated). */
export const LIFE_NEEDS = CONTENT.behavior.needs;

/** Sleepiness levels (lowest value, inclusive), best first. */
export const SLEEP_LEVELS = ['awake', 'tired', 'sleepy', 'verySleepy'] as const;
export type SleepLevel = (typeof SLEEP_LEVELS)[number];

/**
 * Behaviour numbers (content/farm/behavior.json `life`): one central AI step (tickMs) for every pig;
 * sleep levels / rise / recovery / nap and wake timings; feeding at the trough (eat time, run speed,
 * reaction, places to eat as fractions of the trough's bounds); idle rests and free-time weights;
 * friends (social); personality spread (each trait scales a behaviour by at most ±spread); the sleep
 * area near the pig house.
 */
export const PIG_LIFE = CONTENT.behavior.life;
