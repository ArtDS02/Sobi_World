// Injected time source (the real clock lives outside core, DECISIONS A2) and the rules of real time.
import type { DayPeriod } from '../../content/schemas/vocab';

export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
  /** Local time minus UTC (ms) at `at`, for game-day rules (NH-1). Absent = 0 (UTC days). */
  dayOffsetMs?(at: number): number;
}

export interface FakeClock extends Clock {
  set(ms: number): void;
  advance(ms: number): void;
}

export function fakeClock(start = 0): FakeClock {
  let t = start;
  return {
    now: () => t,
    set: (ms) => {
      t = ms;
    },
    advance: (ms) => {
      t += ms;
    },
  };
}

// ---- Real time (ARCHITECTURE §6, GAME_BALANCE §1) --------------------------------------------------
// Pure functions of an epoch time, the local day offset and the rules (content/shared/time.json).

export type { DayPeriod };

export interface TimeRules {
  /** Ascending by start hour; a period lasts until the next one starts (the last wraps past midnight). */
  periods: readonly { id: DayPeriod; fromHour: number }[];
  /** Longest slice of one simulation call. */
  stepMs: { online: number; offline: number };
  /** Away time caught up at most. */
  offlineMaxMs: number;
  /** A clock this far behind the last simulated time counts as set back. */
  rewindToleranceMs: number;
}

export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

/** Milliseconds since local midnight at `at`. */
const localTimeOfDay = (at: number, dayOffsetMs: number): number => (((at + dayOffsetMs) % DAY_MS) + DAY_MS) % DAY_MS;

/** The period of the day at `at` (local time). */
export function dayPeriod(at: number, dayOffsetMs: number, rules: TimeRules): DayPeriod {
  const hour = localTimeOfDay(at, dayOffsetMs) / HOUR_MS;
  const started = rules.periods.filter((p) => p.fromHour <= hour);
  return (started[started.length - 1] ?? rules.periods[rules.periods.length - 1]!).id;
}

/** The first period start strictly after `at` (epoch ms). */
export function nextPeriodStart(at: number, dayOffsetMs: number, rules: TimeRules): number {
  const tod = localTimeOfDay(at, dayOffsetMs);
  const dayStartMs = at - tod;
  const later = rules.periods.map((p) => p.fromHour * HOUR_MS).find((t) => t > tod);
  return dayStartMs + (later ?? rules.periods[0]!.fromHour * HOUR_MS + DAY_MS);
}

/** The time of day that decides whether a creature sleeps (the `night` period). */
export const isNight = (at: number, dayOffsetMs: number, rules: TimeRules): boolean => dayPeriod(at, dayOffsetMs, rules) === 'night';

/**
 * What part of the time since the last simulation is caught up (GAME_BALANCE §1): the first
 * `offlineMaxMs` of it. A clock set back by more than the tolerance is `rewound`: nothing is
 * simulated and time never runs backwards (the caller reports it).
 */
export interface AwayWindow {
  /** Simulate from here … */
  from: number;
  /** … up to here; less than `now` when the away time exceeds the cap. */
  to: number;
  /** The away time exceeded the cap: the rest is skipped (the Areas rebase to `now`). */
  capped: boolean;
  rewound: boolean;
}

export function awayWindow(lastAt: number, now: number, rules: Pick<TimeRules, 'offlineMaxMs' | 'rewindToleranceMs'>): AwayWindow {
  if (now < lastAt) return { from: lastAt, to: lastAt, capped: false, rewound: now < lastAt - rules.rewindToleranceMs };
  const capped = now - lastAt > rules.offlineMaxMs;
  return { from: lastAt, to: capped ? lastAt + rules.offlineMaxMs : now, capped, rewound: false };
}
