// core/simulation (ARCHITECTURE §6): slices on the local-time grid, one formula for every step size,
// the 30-day offline cap and the clock set back.
import { describe, expect, it } from 'vitest';
import { farmArea } from '../../src/areas/farm';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { DAY_MS, HOUR_MS } from '../../src/core/clock';
import { TIME } from '../../src/core/config/time';
import { createAreaRegistry } from '../../src/core/area-registry/registry';
import { WORLD_DEVELOPMENT } from '../../src/core/config/progression';
import { sequenceRng } from '../../src/core/rng';
import { sliceEnds } from '../../src/core/simulation/slices';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';
import type { WorldSave } from '../../src/core/save/world';
import { world } from './worldKit';

const MIN = 60_000;
const T0 = 20_000 * DAY_MS; // local midnight at offset 0
const reg = createAreaRegistry([farmArea], WORLD_DEVELOPMENT, TIME);
/** The farm of a test world, its trough clock set to T0 (makeState starts at t = 0). */
const at0 = (w: WorldSave): WorldSave => {
  const f = farmOf(w);
  return { ...w, areas: { ...w.areas, sobi_farm: { ...(w.areas.sobi_farm as object), trough: { ...f.trough, lastResolvedAt: T0 } } } } as WorldSave;
};
/** An rng that never starts an illness within the test windows. */
const healthy = () => sequenceRng([0.999999]);

describe('slices', () => {
  it('end on the local-time grid and cover [from, to] exactly', () => {
    expect(sliceEnds(0, 0, 0, MIN)).toEqual([]);
    expect(sliceEnds(10, 5, 0, MIN)).toEqual([]);
    expect(sliceEnds(0, 150_000, 0, MIN)).toEqual([60_000, 120_000, 150_000]);
    expect(sliceEnds(30_000, 100_000, 0, MIN)).toEqual([60_000, 100_000]); // first slice is short
    expect(sliceEnds(0, 30_000, 0, MIN)).toEqual([30_000]); // shorter than a step: one slice
  });

  it('the grid follows local time: period starts are slice edges in any time zone', () => {
    for (const offset of [0, 7 * HOUR_MS, -5 * HOUR_MS, 5.75 * HOUR_MS, 5.5 * HOUR_MS]) {
      for (const step of [TIME.stepMs.online, TIME.stepMs.offline]) {
        const ends = new Set(sliceEnds(T0 + 3 * HOUR_MS, T0 + 60 * HOUR_MS, offset, step));
        for (const p of TIME.periods) {
          // the local `fromHour` of the day after T0's local day
          const edge = Math.floor((T0 + 3 * HOUR_MS + offset) / DAY_MS) * DAY_MS + DAY_MS + p.fromHour * HOUR_MS - offset;
          expect(ends.has(edge), `offset ${offset} step ${step} period ${p.id}`).toBe(true);
        }
      }
    }
  });
});

describe('one formula for every step size (online 1 min vs offline 10 min)', () => {
  const farm = () =>
    world(
      makeState(
        [
          makePig({ id: 'a', slotIndex: 0, lastTickedAt: T0, createdAt: T0, growthProgress: 10 }),
          makePig({ id: 'b', slotIndex: 1, lastTickedAt: T0, createdAt: T0, hunger: 60, cleanliness: 70, growthProgress: 55 }),
          makePig({ id: 'c', slotIndex: 2, breed: 'PIG_EARTH_PINK', lastTickedAt: T0, createdAt: T0, hunger: 30, cleanliness: 90, growthProgress: 100 }),
        ],
        100,
      ),
    );
  const start = () => at0(farm());

  // Needs, growth and meals are closed-form per slice, so the slice size does not matter for them. The
  // one thing a slice samples is the pile count (a pile made mid-slice counts from the next slice on),
  // which moves cleanliness, and so the moment a pig turns dirty, by a minute or two over a day.
  it('a day gives the same needs, growth and trough, within what pile counting can move', () => {
    const online = farmOf(reg.advance(start(), T0 + DAY_MS, healthy(), 0, 'online').state);
    const offline = farmOf(reg.advance(start(), T0 + DAY_MS, healthy(), 0, 'offline').state);
    expect(online.trough.food).toBe(offline.trough.food);
    expect(online.manure).toBe(offline.manure);
    for (const [i, p] of online.pigs.entries()) {
      const q = offline.pigs[i]!;
      expect(q.hunger, `${p.id}.hunger`).toBeCloseTo(p.hunger, 6);
      expect(Math.abs(q.cleanliness - p.cleanliness), `${p.id}.cleanliness`).toBeLessThan(0.5);
      expect(Math.abs(q.growthProgress - p.growthProgress), `${p.id}.growth`).toBeLessThan(0.25);
    }
  });

  it('a pen without manure (babies only) matches to the last digit', () => {
    const babies = at0(world(makeState([makePig({ id: 'a', lastTickedAt: T0, createdAt: T0 }), makePig({ id: 'b', slotIndex: 1, lastTickedAt: T0, createdAt: T0, hunger: 60 })], 100)));
    const span = 5 * HOUR_MS; // young at 6 h: no manure yet
    const online = farmOf(reg.advance(babies, T0 + span, healthy(), 0, 'online').state);
    const offline = farmOf(reg.advance(babies, T0 + span, healthy(), 0, 'offline').state);
    for (const [i, p] of online.pigs.entries()) {
      for (const key of ['hunger', 'cleanliness', 'growthProgress', 'energy'] as const) {
        expect(offline.pigs[i]![key], `${p.id}.${key}`).toBeCloseTo(p[key]!, 9);
      }
    }
  });
});

describe('offline cap and clock safety', () => {
  const idle = () => {
    return at0(world(makeState([makePig({ lastTickedAt: T0, createdAt: T0 })], 20)));
  };

  it('a 30-day catch-up finishes quickly (GAME_BALANCE §1: under 3 s)', () => {
    const pigs = Array.from({ length: 24 }, (_, i) => makePig({ id: `p${i}`, slotIndex: i, lastTickedAt: T0, createdAt: T0 }));
    const w = at0(world({ ...makeState(pigs, 100), player: { gold: 5000, xp: 0, unlockedSlots: 24 } }));
    const t = performance.now();
    const r = reg.advance(w, T0 + 30 * DAY_MS, healthy(), 0, 'offline');
    expect(performance.now() - t).toBeLessThan(3000);
    expect(r.capped).toBe(false);
    expect(reg.simulatedAt(r.state)).toBe(T0 + 30 * DAY_MS);
  });

  it('an absence over 30 days simulates the first 30 and skips the rest', () => {
    const r = reg.advance(idle(), T0 + 90 * DAY_MS, healthy(), 0, 'offline');
    expect(r.capped).toBe(true);
    expect(reg.simulatedAt(r.state)).toBe(T0 + 90 * DAY_MS); // rebased: the farm is "now" again
    const within = reg.advance(idle(), T0 + 30 * DAY_MS, healthy(), 0, 'offline');
    expect(farmOf(r.state).pigs[0]!.hunger).toBe(farmOf(within.state).pigs[0]!.hunger);
    expect(farmOf(r.state).pigs[0]!.growthProgress).toBe(farmOf(within.state).pigs[0]!.growthProgress);
  });

  it('a clock set back simulates nothing and says so; small jitter is ignored', () => {
    const w = idle();
    const back = reg.advance(w, T0 - 3 * DAY_MS, healthy(), 0, 'offline');
    expect(back).toMatchObject({ rewound: true, events: [] });
    expect(back.state).toBe(w);
    const jitter = reg.advance(w, T0 - 30_000, healthy(), 0, 'online');
    expect(jitter.rewound).toBe(false);
    expect(reg.simulatedAt(jitter.state)).toBe(T0);
  });
});

describe('neglect over days (the GĐ2 acceptance walk)', () => {
  const neglected = () => at0({ ...world({ ...makeState([makePig({ lastTickedAt: T0, createdAt: T0 })], 0), createdAt: T0 }), meta: { ...world(makeState([])).meta, createdAt: T0 } } as WorldSave);

  it('left alone and unfed: protected for 72 h, then ill, then critical after 48 h, then dead after 72 h of illness', () => {
    let w = neglected();
    let sickAt: number | null = null;
    let criticalAt: number | null = null;
    let diedAt: number | null = null;
    for (let t = T0 + MIN; t <= T0 + 12 * DAY_MS; t += MIN) {
      const r = reg.advance(w, t, healthy(), 0, 'online');
      w = r.state;
      for (const e of r.events) {
        if (e.type === 'PIG_BECAME_SICK') sickAt = t;
        if (e.type === 'PIG_BECAME_CRITICAL') criticalAt = t;
        if (e.type === 'PIG_DIED') diedAt = t;
      }
      if (diedAt !== null) break;
    }
    expect(sickAt).not.toBeNull();
    expect(sickAt!).toBeGreaterThanOrEqual(T0 + 72 * HOUR_MS); // the new-world protection
    expect(criticalAt! - sickAt!).toBeGreaterThanOrEqual(48 * HOUR_MS);
    expect(criticalAt! - sickAt!).toBeLessThan(48 * HOUR_MS + 2 * MIN);
    expect(diedAt! - sickAt!).toBeGreaterThanOrEqual(72 * HOUR_MS);
    expect(diedAt! - sickAt!).toBeLessThan(72 * HOUR_MS + 2 * MIN);
    expect(farmOf(w).pigs).toEqual([]);
  });

  it('the same farm after the game was closed for 12 days: alive and critical, then a 12 h grace', () => {
    const closed = reg.advance(neglected(), T0 + 12 * DAY_MS, healthy(), 0, 'offline');
    const farm = farmOf(closed.state);
    expect(farm.pigs).toHaveLength(1);
    expect(farm.pigs[0]!.isSick).toBe(true);
    expect(farm.graceUntil).toBe(T0 + 12 * DAY_MS + 12 * HOUR_MS);
    const open = reg.advance(closed.state, T0 + 12 * DAY_MS + 13 * HOUR_MS, healthy(), 0, 'online');
    expect(open.events.some((e) => e.type === 'PIG_DIED')).toBe(true);
  });

  it('1 minute and 10 minute catch-ups find the pig ill at the same moment', () => {
    const sickTime = (mode: 'online' | 'offline') => {
      const r = reg.advance(neglected(), T0 + 5 * DAY_MS, healthy(), 0, mode);
      return farmOf(r.state).pigs[0]!.lastSickAt;
    };
    expect(sickTime('online')).toBe(sickTime('offline'));
  });
});
