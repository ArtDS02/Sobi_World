// core/clock (GAME_BALANCE §1): periods of the day, the 30-day offline cap, a clock set back.
import { describe, expect, it } from 'vitest';
import { awayWindow, dayPeriod, DAY_MS, HOUR_MS, isNight, nextPeriodStart, fakeClock } from '../../src/core/clock';
import { TIME } from '../../src/core/config/time';
import { timeFileSchema } from '../../content/schemas/shared/time';

const at = (hour: number, offset = 0) => 20_000 * DAY_MS + hour * HOUR_MS - offset; // local hour of day 20000

describe('periods of the day', () => {
  it.each([
    [4.99, 'night'], [5, 'morning'], [9.99, 'morning'], [10, 'day'], [16.99, 'day'],
    [17, 'evening'], [19.99, 'evening'], [20, 'night'], [23.99, 'night'], [0, 'night'],
  ] as const)('local hour %s is %s', (hour, period) => {
    expect(dayPeriod(at(hour), 0, TIME)).toBe(period);
  });

  it('follows the local time zone: the same instant is another period elsewhere', () => {
    const instant = at(12); // noon UTC
    expect(dayPeriod(instant, 0, TIME)).toBe('day');
    expect(dayPeriod(instant, 9 * HOUR_MS, TIME)).toBe('night'); // 21:00 at UTC+9
    expect(isNight(instant, 9 * HOUR_MS, TIME)).toBe(true);
  });

  it('handles times before the epoch (negative local time)', () => {
    expect(dayPeriod(-HOUR_MS, 0, TIME)).toBe('night'); // 23:00 the day before
    expect(dayPeriod(-19 * HOUR_MS, 0, TIME)).toBe('morning'); // 05:00
  });

  it('nextPeriodStart is the next boundary, wrapping past midnight', () => {
    expect(nextPeriodStart(at(12), 0, TIME)).toBe(at(17));
    expect(nextPeriodStart(at(17), 0, TIME)).toBe(at(20)); // strictly after
    expect(nextPeriodStart(at(21), 0, TIME)).toBe(at(24 + 5));
    expect(nextPeriodStart(at(2), 0, TIME)).toBe(at(5));
    expect(nextPeriodStart(at(12, 5.75 * HOUR_MS), 5.75 * HOUR_MS, TIME)).toBe(at(17, 5.75 * HOUR_MS));
  });
});

describe('away window', () => {
  const last = 1_000_000_000_000;
  it('catches up everything within the cap', () => {
    expect(awayWindow(last, last + 5 * DAY_MS, TIME)).toEqual({ from: last, to: last + 5 * DAY_MS, capped: false, rewound: false });
  });

  it('caps the catch-up at 30 days and says so', () => {
    const w = awayWindow(last, last + 90 * DAY_MS, TIME);
    expect(w).toEqual({ from: last, to: last + 30 * DAY_MS, capped: true, rewound: false });
    expect(awayWindow(last, last + 30 * DAY_MS, TIME).capped).toBe(false);
  });

  it('a clock set back never runs time backwards', () => {
    const w = awayWindow(last, last - 3 * DAY_MS, TIME);
    expect(w).toEqual({ from: last, to: last, capped: false, rewound: true });
  });

  it('a small step back (clock sync jitter) is ignored without a warning', () => {
    expect(awayWindow(last, last - 30_000, TIME)).toEqual({ from: last, to: last, capped: false, rewound: false });
  });
});

describe('time content', () => {
  it('ships the GAME_BALANCE §1 numbers', () => {
    expect(TIME.periods).toEqual([
      { id: 'morning', fromHour: 5 }, { id: 'day', fromHour: 10 }, { id: 'evening', fromHour: 17 }, { id: 'night', fromHour: 20 },
    ]);
    expect(TIME.stepMs).toEqual({ online: 60_000, offline: 600_000 });
    expect(TIME.offlineMaxMs).toBe(30 * DAY_MS);
  });

  it('rejects periods out of order or a step that does not divide the hour', () => {
    const bad = (patch: object) => timeFileSchema.safeParse({ ...TIME, ...patch }).success;
    expect(bad({})).toBe(true);
    expect(bad({ periods: [...TIME.periods].reverse() })).toBe(false);
    expect(bad({ stepMs: { online: 70_000, offline: 700_000 } })).toBe(false);
    expect(bad({ stepMs: { online: 60_000, offline: 650_000 } })).toBe(false);
  });

  it('the fake clock still moves', () => {
    const c = fakeClock(5);
    c.advance(10);
    expect(c.now()).toBe(15);
  });
});
