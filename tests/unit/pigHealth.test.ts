// NH-1 / GĐ2: pig needs & health — game-time decay, care levels, disease lifecycle, save round trip.
import { describe, expect, it } from 'vitest';
import { cleanPig } from '../../src/areas/farm/logic/actions/cleanPig';
import { feedPig } from '../../src/areas/farm/logic/actions/feedPig';
import { treatPig } from '../../src/areas/farm/logic/actions/treatPig';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { advancePig } from '../../src/areas/farm/logic/advancePig';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { dayStart, diseaseState, gameDay, needLevel } from '../../src/areas/farm/logic/pigHealth';
import type { GameEvent } from '../../src/areas/farm/logic/events';
import { sequenceRng, type Rng } from '../../src/core/rng';
import { episodeThreshold } from '../../src/systems/health/risk';
import { parseFarmSave } from '../../src/areas/farm/logic/save/legacy';
import type { ActionResult, Pig, FarmGame } from '../../src/areas/farm/logic/types';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

const SEC = 1000;
const HOUR = 3600 * SEC;
const DAY = 24 * HOUR;
const neverSick = (): Rng => sequenceRng([1 - 1e-12]);
/** A world old enough that the new-world protection (first 72 h) is over. */
const LONG_AGO = -1e12;
/** Dirty enough that exposure starts at once. */
const dirty = (o: Partial<Pig> = {}) => makePig({ cleanliness: 0, growthProgress: 100, ...o });
/** A pig whose hazard is banked up to its threshold: the next exposed instant makes it ill. */
const primed = (pig: Pig): Pig => (pig.isSick ? pig : { ...pig, illRisk: episodeThreshold(pig) });

const okState = (r: ActionResult): FarmGame => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

describe('hunger & cleanliness follow game time only', () => {
  it('a full pig stays fed for 12.5 h and clean for 25 h (-8 and -4 per hour)', () => {
    const p = advancePig(makePig(), 12.5 * HOUR - SEC, neverSick());
    expect(p.hunger).toBeGreaterThan(0);
    expect(advancePig(makePig(), 12.5 * HOUR, neverSick()).hunger).toBeCloseTo(0, 9);
    expect(advancePig(makePig(), 25 * HOUR - SEC, neverSick()).cleanliness).toBeGreaterThan(0);
  });

  it('60 fps-sized steps decay exactly like one big step (no per-frame mutation)', () => {
    let pig = makePig();
    for (let i = 1; i <= 600; i++) pig = advancePig(pig, (i * SEC) / 60, neverSick());
    const once = advancePig(makePig(), 10 * SEC, neverSick());
    expect(pig.hunger).toBeCloseTo(once.hunger, 9);
    expect(pig.cleanliness).toBeCloseTo(once.cleanliness, 9);
  });

  it('a time skip (dev x-speed / offline) equals ticking through it second by second', () => {
    const state = makeState([makePig({ hunger: 90 }), makePig({ id: 'b', slotIndex: 1 })], 0);
    let ticked = state;
    for (let t = 1; t <= 3600; t++) ticked = advanceWorld(ticked, t * SEC, neverSick()).state;
    const skipped = advanceWorld(state, HOUR, neverSick()).state;
    ticked.pigs.forEach((p, i) => {
      expect(p.hunger).toBeCloseTo(skipped.pigs[i]!.hunger, 9);
      expect(p.cleanliness).toBeCloseTo(skipped.pigs[i]!.cleanliness, 9);
    });
  });

  it('feed: +50 hunger and lastFedAt; the same tick does not take it back', () => {
    const s = makeState([makePig({ hunger: 30, lastTickedAt: 0 })]);
    const fed = okState(feedPig(s, { pigId: 'pig-1' }, { now: 600 * SEC, rng: neverSick() }));
    const pig = fed.pigs[0]!;
    const decayed = 30 - (600 * 100) / BREEDS.PIG_EARTH_PINK.hungerFullSec;
    expect(pig.hunger).toBeCloseTo(decayed + BALANCE.FOOD_HUNGER_RESTORE, 9);
    expect(pig.lastFedAt).toBe(600 * SEC);
    expect(advanceWorld(fed, 600 * SEC, neverSick()).state.pigs[0]!.hunger).toBe(pig.hunger);
  });

  it('clean: back to 100 and lastCleanedAt; still above "normal" an hour later', () => {
    const s = makeState([makePig({ cleanliness: 20 })]);
    const cleaned = okState(cleanPig(s, { pigId: 'pig-1' }, { now: 0, rng: neverSick() }));
    expect(cleaned.pigs[0]).toMatchObject({ cleanliness: 100, lastCleanedAt: 0 });
    const later = advanceWorld(cleaned, HOUR, neverSick()).state.pigs[0]!;
    expect(needLevel(later.cleanliness)).toBe('good');
  });

  it('pigs decay independently; every species has the same flat rates', () => {
    const pink = makePig({ id: 'a', slotIndex: 0 });
    const mythic = makePig({ id: 'b', slotIndex: 1, breed: 'PIG_MYTHICAL' });
    const out = advanceWorld(makeState([pink, mythic]), HOUR, neverSick()).state.pigs;
    expect(out[0]!.hunger).toBeCloseTo(100 - (3600 * 100) / BREEDS.PIG_EARTH_PINK.hungerFullSec, 9);
    expect(out[1]!.hunger).toBeCloseTo(100 - (3600 * 100) / BREEDS.PIG_MYTHICAL.hungerFullSec, 9);
  });
});

describe('care levels and warnings', () => {
  it('levels: good ≥ 80, normal ≥ 50, low ≥ 25, veryLow ≥ 10, critical below', () => {
    expect([100, 80, 79.9, 50, 49, 25, 24, 10, 9.9, 0].map(needLevel)).toEqual([
      'good',
      'good',
      'normal',
      'normal',
      'low',
      'low',
      'veryLow',
      'veryLow',
      'critical',
      'critical',
    ]);
  });

  it('ticking every second warns once per drop: low, veryLow, critical — never repeated', () => {
    let state = makeState([makePig({ cleanliness: 100 })]);
    const events: GameEvent[] = [];
    for (let t = 60; t <= 13 * 3600; t += 30) {
      const out = advanceWorld(state, t * SEC, neverSick());
      state = out.state;
      events.push(...out.events);
    }
    const drops = events.flatMap((e) =>
      e.type === 'PIG_NEED_DROPPED' && e.need === 'hunger' ? [e.level] : [],
    );
    expect(drops).toEqual(['low', 'veryLow', 'critical']);
  });

  it('no warning when feeding raises the level, nor on a same-now tick', () => {
    const s = makeState([makePig({ hunger: 30 })]);
    const fed = okState(feedPig(s, { pigId: 'pig-1' }, { now: 0, rng: neverSick() }));
    expect(advanceWorld(fed, 0, neverSick()).events).toEqual([]);
  });
});

describe('disease lifecycle: Healthy → Ill → Recovering, max 1 episode / game day', () => {
  const sickAt = (pig: Pig, now: number, offset = 0) => advancePig(primed(pig), now, neverSick(), offset, 0, LONG_AGO);

  it('a healthy dirty pig can fall ill: Ill, onset time and day recorded', () => {
    const p = sickAt(dirty(), 10 * SEC);
    expect(diseaseState(p, 10 * SEC)).toBe('ill');
    expect(p).toMatchObject({ isSick: true, lastSickAt: 0, sickDay: 0, sickEpisodes: 1 });
  });

  it('an ill pig gets no new episode (counter unchanged, no second event)', () => {
    const ill = sickAt(dirty(), 10 * SEC);
    const later = sickAt(ill, 20 * HOUR);
    expect(later.sickEpisodes).toBe(1);
    expect(later.lastSickAt).toBe(0);
  });

  it('a recovering pig gets no new episode, even on a new day', () => {
    const pig = dirty({ recoveringUntil: 30 * HOUR, lastTickedAt: 0 });
    expect(diseaseState(pig, 10 * HOUR)).toBe('recovering');
    expect(sickAt(pig, 30 * HOUR - SEC).isSick).toBe(false);
    const after = sickAt(pig, 30 * HOUR + SEC);
    expect(after.isSick).toBe(true);
    expect(after.lastSickAt).toBe(30 * HOUR);
  });

  it('after recovery the same day: still no second episode; the next day: yes, counter 1', () => {
    const pig = dirty({ sickDay: 0, sickEpisodes: 1, recoveringUntil: 3 * HOUR });
    expect(sickAt(pig, DAY - SEC).isSick).toBe(false);
    const next = sickAt(pig, DAY + SEC);
    expect(next).toMatchObject({ isSick: true, lastSickAt: DAY, sickDay: 1, sickEpisodes: 1 });
  });

  it('the day boundary is the local one (dayOffsetMs = +7 h)', () => {
    const offset = 7 * HOUR;
    const pig = dirty({ sickDay: gameDay(0, offset), sickEpisodes: 1 });
    const midnight = dayStart(gameDay(0, offset) + 1, offset); // 17:00 UTC
    expect(midnight).toBe(17 * HOUR);
    expect(sickAt(pig, midnight - SEC, offset).isSick).toBe(false);
    expect(sickAt(pig, midnight + SEC, offset).lastSickAt).toBe(midnight);
  });

  it('an illness lasting across days is kept as is (no reset of state or counters)', () => {
    const ill = sickAt(dirty(), 10 * SEC);
    const days = sickAt(ill, 3 * DAY);
    expect(days).toMatchObject({ isSick: true, sickDay: 0, sickEpisodes: 1, lastSickAt: 0 });
  });

  it('medicine: Ill → Recovering for SICK_RECOVERY_SEC, then Healthy', () => {
    const s = makeState([sickAt(dirty(), 10 * SEC)]);
    const treated = okState(treatPig(s, { pigId: 'pig-1' }, { now: HOUR, rng: neverSick() }));
    const pig = treated.pigs[0]!;
    const until = HOUR + BALANCE.SICK_RECOVERY_SEC * SEC;
    expect(pig.recoveringUntil).toBe(until);
    expect(diseaseState(pig, until - 1)).toBe('recovering');
    expect(diseaseState(pig, until)).toBe('healthy');
  });

  it('a split window gives the same onset as one big window', () => {
    const pig = primed(dirty({ sickDay: 0, sickEpisodes: 1 }));
    const run = (p: Pig, now: number) => advancePig(p, now, neverSick(), 0, 0, LONG_AGO);
    const whole = run(pig, DAY + HOUR);
    const split = run(run(pig, DAY - HOUR), DAY + HOUR);
    expect(split).toMatchObject({ isSick: true, lastSickAt: whole.lastSickAt, sickDay: whole.sickDay, sickEpisodes: 1 });
  });
});

describe('save / load keeps needs and disease state', () => {
  const roundTrip = (s: FarmGame): FarmGame => {
    const r = parseFarmSave(JSON.stringify(s));
    if (!r.ok) throw new Error(r.error);
    return r.save;
  };

  it('reload while ill and while recovering: fields survive, nothing reset', () => {
    const ill = {
      ...dirty({ id: 'a', slotIndex: 0, hunger: 12 }),
      isSick: true,
      lastSickAt: 5,
      sickDay: 0,
      sickEpisodes: 1,
    };
    const rec = dirty({
      id: 'b',
      slotIndex: 1,
      recoveringUntil: 9 * HOUR,
      sickDay: 0,
      sickEpisodes: 1,
      lastFedAt: 3,
      lastCleanedAt: 4,
    });
    const loaded = roundTrip(makeState([ill, rec]));
    expect(loaded.pigs).toEqual([ill, rec]);
    expect(diseaseState(loaded.pigs[0]!, HOUR)).toBe('ill');
    expect(diseaseState(loaded.pigs[1]!, HOUR)).toBe('recovering');
  });

  it('an older save without the NH-1 fields loads as Healthy with no episode today', () => {
    const loaded = roundTrip(makeState([makePig()]));
    expect(diseaseState(loaded.pigs[0]!, 0)).toBe('healthy');
    expect(loaded.pigs[0]!.sickEpisodes).toBeUndefined();
  });
});

describe('integration: neglect never becomes a disease spiral', () => {
  it('5 days starving + filthy, medicine at once: ≤ 1 episode per day', () => {
    let state = {
      ...makeState([dirty({ hunger: 0 })]),
      createdAt: LONG_AGO,
      inventory: { FOOD_BASIC: 0, MEDICINE_COMMON: 99, item_manure: 0 },
    };
    const onsets: number[] = [];
    for (let t = 0; t <= 5 * DAY; t += 60 * SEC) {
      const out = advanceWorld(state, t, neverSick());
      state = out.state;
      if (out.events.some((e) => e.type === 'PIG_BECAME_SICK')) {
        onsets.push(state.pigs[0]!.lastSickAt!);
        state = okState(treatPig(state, { pigId: 'pig-1' }, { now: t, rng: neverSick() }));
      }
    }
    const days = onsets.map((at) => gameDay(at, 0));
    expect(new Set(days).size).toBe(days.length);
    expect(onsets.length).toBeLessThanOrEqual(6);
  });

  it('being ill does not speed up hunger or cleanliness decay', () => {
    const healthy = advancePig(makePig({ growthProgress: 100 }), HOUR, neverSick());
    const ill = advancePig(makePig({ growthProgress: 100, isSick: true }), HOUR, neverSick());
    expect(ill.hunger).toBe(healthy.hunger);
    expect(ill.cleanliness).toBe(healthy.cleanliness);
  });
});
