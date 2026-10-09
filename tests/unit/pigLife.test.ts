import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { PIG_LIFE } from '../../src/areas/farm/logic/config/pigLife';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import {
  chooseBehavior,
  freeChoice,
  initialSleepiness,
  mopes,
  personalityOf,
  restMs,
  sleepLevel,
  sleepinessAfter,
  sleepinessOnWake,
  traitScale,
  wakeDelayMs,
  wantsSleep,
} from '../../src/areas/farm/logic/pigLife';
import { sequenceRng } from '../../src/core/rng';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

const HOUR = 3_600_000;
const MIN = 60_000;
const neverSick = () => sequenceRng([1 - 1e-12]);
const mid = personalityOf('x');
const flat = { ...mid, energy: 0.5, laziness: 0.5, social: 0.5, curiosity: 0.5, foodDrive: 0.5 };

describe('PL-1 trough meals as events', () => {
  it('a pig fed by the trough raises PIG_ATE_FROM_TROUGH once, with its hunger before the meal', () => {
    const state = makeState([makePig({ id: 'a', hunger: 40.05, lastTickedAt: 0 })], 5);
    const out = advanceWorld(state, 60_000, neverSick());
    const ate = out.events.filter((e) => e.type === 'PIG_ATE_FROM_TROUGH');
    expect(ate).toHaveLength(1);
    expect(ate[0]).toMatchObject({ pigId: 'a', meals: 1 });
    if (ate[0]?.type === 'PIG_ATE_FROM_TROUGH') {
      expect(ate[0].hungerBefore).toBeCloseTo(BALANCE.TROUGH_AUTO_FEED_AT, 5);
    }
    // Idempotent: the same `now` again feeds nobody.
    expect(advanceWorld(out.state, 60_000, neverSick()).events).toEqual([]);
  });

  it('hungry pig + empty trough: no meal event (the pig does not walk to it)', () => {
    const state = makeState([makePig({ id: 'a', hunger: 30, lastTickedAt: 0 })], 0);
    const out = advanceWorld(state, 1000, neverSick());
    expect(out.events.some((e) => e.type === 'PIG_ATE_FROM_TROUGH')).toBe(false);
  });

  it('food added: only the hungry pigs eat on the next tick', () => {
    const state = makeState(
      [
        makePig({ id: 'a', slotIndex: 0, hunger: 30, lastTickedAt: 0 }),
        makePig({ id: 'b', slotIndex: 1, hunger: 20, lastTickedAt: 0 }),
        makePig({ id: 'c', slotIndex: 2, hunger: 90, lastTickedAt: 0 }),
      ],
      10,
    );
    const out = advanceWorld(state, 1000, neverSick());
    const ids = out.events.flatMap((e) => (e.type === 'PIG_ATE_FROM_TROUGH' ? [e.pigId] : []));
    expect(ids.sort()).toEqual(['a', 'b']);
  });
});

describe('PL-1 personality', () => {
  it('is fixed per id, in 0..1, and differs between pigs', () => {
    expect(personalityOf('pig-1')).toEqual(personalityOf('pig-1'));
    const all = ['a', 'b', 'c', 'd', 'e'].map(personalityOf);
    for (const p of all) for (const v of Object.values(p)) expect(v).toBeGreaterThanOrEqual(0);
    for (const p of all) for (const v of Object.values(p)) expect(v).toBeLessThanOrEqual(1);
    expect(new Set(all.map((p) => p.energy.toFixed(3))).size).toBeGreaterThan(3);
  });

  it('scales behaviour by at most ±spread', () => {
    expect(traitScale(0)).toBeCloseTo(1 - PIG_LIFE.personality.spread);
    expect(traitScale(1)).toBeCloseTo(1 + PIG_LIFE.personality.spread);
    const lazy = { ...flat, laziness: 1, energy: 0 };
    const busy = { ...flat, laziness: 0, energy: 1 };
    expect(restMs(lazy, 0.5, false)).toBeGreaterThan(restMs(busy, 0.5, false));
    expect(restMs(flat, 0.5, true)).toBeGreaterThan(restMs(flat, 0.5, false)); // moping
  });

  it('energetic pigs wander more, lazy ones idle more', () => {
    const count = (p: typeof flat, choice: string) => {
      let n = 0;
      for (let i = 0; i < 1000; i++) {
        const c = freeChoice(p, i / 1000, 1, { night: false, moping: false, friendReady: false });
        if (c === choice) n++;
      }
      return n;
    };
    const busy = { ...flat, energy: 1, laziness: 0 };
    const lazy = { ...flat, energy: 0, laziness: 1 };
    expect(count(busy, 'wander')).toBeGreaterThan(count(lazy, 'wander'));
    expect(count(lazy, 'idle')).toBeGreaterThan(count(busy, 'idle'));
  });

  it('social pigs look for friends; never at night or while moping', () => {
    const social = { ...flat, social: 1 };
    const opts = { night: false, moping: false, friendReady: true };
    expect(freeChoice(social, 0.5, 0, opts)).toBe('social');
    expect(freeChoice({ ...flat, social: 0 }, 0.5, 0.01, opts)).not.toBe('social');
    expect(freeChoice(social, 0.5, 0, { ...opts, night: true })).not.toBe('social');
    expect(freeChoice(social, 0.5, 0, { ...opts, moping: true })).not.toBe('social');
    expect(freeChoice(social, 0.5, 0, { ...opts, friendReady: false })).not.toBe('social');
    // Awake at night: no wandering.
    for (let r = 0; r < 1; r += 0.05) {
      expect(freeChoice(social, r, 1, { ...opts, night: true })).not.toBe('wander');
    }
  });
});

describe('PL-1 sleepiness (game time, not frames)', () => {
  it('rises by game time awake (faster at night), falls asleep; one big step = many small ones', () => {
    const one = sleepinessAfter(10, HOUR, false, false, flat);
    let many = 10;
    for (let i = 0; i < 3600; i++) many = sleepinessAfter(many, 1000, false, false, flat);
    expect(one).toBeCloseTo(10 + PIG_LIFE.sleep.dayRisePerHour, 5);
    expect(many).toBeCloseTo(one, 5);
    expect(sleepinessAfter(10, MIN, false, true, flat)).toBeCloseTo(
      10 + PIG_LIFE.sleep.nightRisePerMin,
    );
    expect(sleepinessAfter(50, MIN, true, false, flat)).toBeCloseTo(
      50 - PIG_LIFE.sleep.napRecoverPerMin,
    );
    expect(sleepinessAfter(50, 0, false, false, flat)).toBe(50);
    expect(sleepinessAfter(99, HOUR, false, true, flat)).toBe(100);
    expect(sleepinessAfter(1, HOUR, true, false, flat)).toBe(0);
  });

  it('levels follow the thresholds', () => {
    expect([0, 30, 31, 60, 61, 80, 81, 100].map(sleepLevel)).toEqual([
      'awake',
      'awake',
      'tired',
      'tired',
      'sleepy',
      'sleepy',
      'verySleepy',
      'verySleepy',
    ]);
  });

  it('lies down at night from nightSleepAt, by day only when very sleepy; sleeps through the night', () => {
    const base = { night: true, asleep: false, sinceDayMs: Infinity, wakeDelayMs: 0 };
    const S = PIG_LIFE.sleep;
    expect(wantsSleep({ ...base, sleepiness: S.nightSleepAt })).toBe(true);
    expect(wantsSleep({ ...base, sleepiness: S.nightSleepAt - 1 })).toBe(false);
    expect(wantsSleep({ ...base, night: false, sleepiness: S.nightSleepAt })).toBe(false);
    expect(wantsSleep({ ...base, night: false, sleepiness: S.daySleepAt })).toBe(true);
    expect(wantsSleep({ ...base, asleep: true, sleepiness: 0 })).toBe(true); // night: keep sleeping
    // Morning: up once the personal delay passed and rested enough.
    const morning = { ...base, night: false, asleep: true, sleepiness: 5, wakeDelayMs: 30_000 };
    expect(wantsSleep({ ...morning, sinceDayMs: 10_000 })).toBe(true);
    expect(wantsSleep({ ...morning, sinceDayMs: 40_000 })).toBe(false);
    expect(wantsSleep({ ...morning, sinceDayMs: 40_000, sleepiness: 90 })).toBe(false); // morning
    const later = { ...morning, sinceDayMs: S.morningMs };
    expect(wantsSleep({ ...later, sleepiness: S.napWakeAt + 1 })).toBe(true); // a nap
    expect(wantsSleep({ ...later, sleepiness: S.napWakeAt })).toBe(false);
    expect(sleepinessOnWake(80, 1000)).toBe(S.morningLevel);
    expect(sleepinessOnWake(80, S.morningMs)).toBe(80);
  });

  it('pigs do not all wake at once; a pig loaded by day is not sleepy, at night it is', () => {
    const delays = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => wakeDelayMs(id, personalityOf(id)));
    expect(new Set(delays.map((d) => Math.round(d / 1000))).size).toBeGreaterThan(3);
    for (const d of delays) expect(d).toBeLessThanOrEqual(PIG_LIFE.sleep.wakeSpreadMs);
    expect(initialSleepiness(false, 2 * HOUR, flat)).toBeLessThan(PIG_LIFE.sleep.daySleepAt);
    expect(initialSleepiness(false, 30 * HOUR, flat)).toBe(PIG_LIFE.sleep.loadCap);
    expect(initialSleepiness(true, 0, flat)).toBeGreaterThanOrEqual(PIG_LIFE.sleep.nightSleepAt);
  });
});

describe('PL-1 need priority', () => {
  const none = { meal: null, sleep: false, sick: false, pregnant: false };
  it('critical hunger > sleep > hunger > sick rest > free time', () => {
    const urgent = { hungerBefore: 5 };
    const normal = { hungerBefore: BALANCE.TROUGH_AUTO_FEED_AT };
    expect(chooseBehavior({ ...none, meal: urgent, sleep: true, sick: true })).toBe('eatUrgent');
    expect(chooseBehavior({ ...none, meal: normal, sleep: true })).toBe('sleep');
    expect(chooseBehavior({ ...none, meal: normal, sick: true })).toBe('eat');
    expect(chooseBehavior({ ...none, sick: true })).toBe('rest');
    expect(chooseBehavior({ ...none, pregnant: true })).toBe('rest');
    expect(chooseBehavior(none)).toBe('free');
  });

  it('a hungry pig at an empty trough or a very dirty pig mopes', () => {
    expect(mopes({ hunger: 40, cleanliness: 90 })).toBe(true);
    expect(mopes({ hunger: 90, cleanliness: 15 })).toBe(true);
    expect(mopes({ hunger: 60, cleanliness: 40 })).toBe(false);
  });
});
