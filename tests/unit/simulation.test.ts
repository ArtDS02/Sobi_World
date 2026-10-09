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
        12,
      ),
    );
  const start = () => at0(farm());

  it('24 hours give the same needs, growth and trough', () => {
    const online = farmOf(reg.advance(start(), T0 + DAY_MS, healthy(), 0, 'online').state);
    const offline = farmOf(reg.advance(start(), T0 + DAY_MS, healthy(), 0, 'offline').state);
    expect(online.trough.food).toBe(offline.trough.food);
    for (const [i, p] of online.pigs.entries()) {
      const q = offline.pigs[i]!;
      for (const key of ['hunger', 'cleanliness', 'growthProgress'] as const) {
        expect(q[key], `${p.id}.${key}`).toBeCloseTo(p[key], 6);
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
