import { describe, expect, it } from 'vitest';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { mulberry32, sequenceRng, type Rng } from '../../src/core/rng';
import { episodeThreshold } from '../../src/systems/health/risk';
import { makePig } from './pigFactory';
import { makeState } from './stateFactory';

const SEC = 1000;
const neverSick = (): Rng => sequenceRng([1 - 1e-12]);

describe('advanceWorld (§7.4)', () => {
  it('twice with the same now consumes food only once and emits nothing the second time', () => {
    const state = makeState([makePig({ hunger: 40 })], 5);
    const first = advanceWorld(state, 45_000 * SEC, mulberry32(1));
    const second = advanceWorld(first.state, 45_000 * SEC, mulberry32(2));
    expect(first.state.trough.food).toBe(2);
    expect(second.state.trough.food).toBe(2);
    expect(second.state).toEqual(first.state);
    expect(second.events).toEqual([]);
  });

  it('3-day offline with a full trough: food never negative, growth capped at 100', () => {
    const pigs = [0, 1, 2, 3].map((i) => makePig({ id: `p${i}`, slotIndex: i }));
    const { state } = advanceWorld(makeState(pigs, 20), 3 * 24 * 3600 * SEC, mulberry32(42));
    expect(state.trough.food).toBe(0);
    expect(state.trough.lastResolvedAt).toBe(3 * 24 * 3600 * SEC);
    for (const p of state.pigs) {
      expect(p.growthProgress).toBeLessThanOrEqual(100);
      expect(p.hunger).toBeGreaterThanOrEqual(0);
      expect(p.lastTickedAt).toBe(3 * 24 * 3600 * SEC);
    }
  });

  it('now < lastTickedAt: resync timestamps only, no events (D14)', () => {
    const pig = makePig({ hunger: 30, cleanliness: 10, lastTickedAt: 10_000 * SEC });
    const state = {
      ...makeState([pig], 5),
      trough: { food: 5, capacity: 20, lastResolvedAt: 10_000 * SEC },
    };
    const out = advanceWorld(state, 9_000 * SEC, mulberry32(1));
    expect(out.events).toEqual([]);
    expect(out.state.pigs[0]).toEqual({ ...pig, lastTickedAt: 9_000 * SEC });
    expect(out.state.trough).toEqual({ ...state.trough, lastResolvedAt: 9_000 * SEC });
  });

  it('TROUGH_EMPTY carries the time of the last meal', () => {
    // PINK at hunger 100, 2 units: meals at 27,000 s (hunger 40) and 49,500 s, then dry (a third was due at 72,000 s).
    const out = advanceWorld(makeState([makePig()], 2), 86_400 * SEC, neverSick());
    expect(out.state.trough.food).toBe(0);
    expect(out.events).toContainEqual({ type: 'TROUGH_EMPTY', at: 49_500 * SEC });
  });

  it('TROUGH_EMPTY with short food over several pigs uses the latest meal (slot order)', () => {
    const pigs = [
      makePig({ id: 'a', slotIndex: 0 }),
      makePig({ id: 'b', slotIndex: 1, hunger: 50 }),
    ];
    // Slot 0 eats all 3 units at 27,000 / 49,500 / 72,000 s; slot 1 is deprived.
    const out = advanceWorld(makeState(pigs, 3), 86_400 * SEC, neverSick());
    expect(out.events.filter((e) => e.type === 'TROUGH_EMPTY')).toEqual([
      { type: 'TROUGH_EMPTY', at: 72_000 * SEC },
    ]);
  });

  it('no TROUGH_EMPTY when food lasts, when it was already empty, or when nobody was hungry', () => {
    expect(
      advanceWorld(makeState([makePig()], 10), 7200 * SEC, neverSick()).events,
    ).not.toContainEqual(expect.objectContaining({ type: 'TROUGH_EMPTY' }));
    expect(
      advanceWorld(makeState([makePig()], 0), 7200 * SEC, neverSick()).events,
    ).not.toContainEqual(expect.objectContaining({ type: 'TROUGH_EMPTY' }));
    // Exactly enough: 3 meals in 86,400 s, nobody left wanting.
    expect(
      advanceWorld(makeState([makePig()], 3), 86_400 * SEC, neverSick()).events,
    ).not.toContainEqual(expect.objectContaining({ type: 'TROUGH_EMPTY' }));
  });

  it('PIG_HUNGRY_ZERO reports when growth stopped', () => {
    // SUPERMAN (Rare: 259,200 s to Mature): 1 meal at 27,000 s → hunger 150 credited → zero at
    // 67,500 s; it grew while hunger was above 30 (until 54,000 s) and was stalled after.
    const out = advanceWorld(
      makeState([makePig({ breed: 'PIG_SUPERMAN' })], 1),
      90_000 * SEC,
      neverSick(),
    );
    expect(out.events).toContainEqual({
      type: 'PIG_HUNGRY_ZERO',
      pigId: 'pig-1',
      at: 67_500 * SEC,
      stalled: true,
    });
    expect(out.state.pigs[0]!.growthProgress).toBeCloseTo((54_000 / 259_200) * 100, 6);
  });

  it('PIG_HUNGRY_ZERO only on the crossing, not while already at 0', () => {
    const once = advanceWorld(makeState([makePig()]), 50_000 * SEC, neverSick());
    expect(once.events.filter((e) => e.type === 'PIG_HUNGRY_ZERO')).toHaveLength(1);
    const again = advanceWorld(once.state, 60_000 * SEC, neverSick());
    expect(again.events.filter((e) => e.type === 'PIG_HUNGRY_ZERO')).toHaveLength(0);
  });

  it('emits PIG_BECAME_ADULT and PIG_BECAME_SICK on the transition only', () => {
    const pig = makePig({ growthProgress: 90 });
    const out = advanceWorld(makeState([pig], 10), 17_280 * SEC, neverSick());
    expect(out.state.pigs[0]!.growthProgress).toBe(100);
    expect(out.events).toContainEqual({ type: 'PIG_BECAME_ADULT', pigId: 'pig-1' });

    // A filthy pig whose banked hazard has reached its threshold falls ill on the first exposed instant
    // (the world is old enough to be past the new-world protection).
    const dirtyPig = makePig({ cleanliness: 0 });
    const old = { ...makeState([{ ...dirtyPig, illRisk: episodeThreshold(dirtyPig) }]), createdAt: -1e12 };
    const sick = advanceWorld(old, 600 * SEC, neverSick());
    expect(sick.events).toContainEqual({ type: 'PIG_BECAME_SICK', pigId: 'pig-1' });
    const later = advanceWorld(sick.state, 1200 * SEC, neverSick());
    expect(later.events.filter((e) => e.type === 'PIG_BECAME_SICK')).toHaveLength(0);
  });

  it('result does not depend on the order of the pigs array', () => {
    const pigs = [0, 1, 2].map((i) =>
      makePig({ id: `p${i}`, slotIndex: i, hunger: 60, cleanliness: 40 }),
    );
    const a = advanceWorld(makeState(pigs, 4), 20_000 * SEC, mulberry32(9));
    const b = advanceWorld(makeState([...pigs].reverse(), 4), 20_000 * SEC, mulberry32(9));
    const byId = (s: typeof a.state) => [...s.pigs].sort((x, y) => x.id.localeCompare(y.id));
    expect(byId(b.state)).toEqual(byId(a.state));
    expect(b.state.trough).toEqual(a.state.trough);
  });
});
