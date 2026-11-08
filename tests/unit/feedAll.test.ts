// D7: feed every hungry pig in one action; items and XP charged as for single feeds.
import { describe, expect, it } from 'vitest';
import { feedAll } from '../../src/areas/farm/logic/actions/feedAll';
import { feedPig } from '../../src/areas/farm/logic/actions/feedPig';
import { mulberry32 } from '../../src/core/rng';
import { makePig } from './pigFactory';
import { inv, makeState } from './stateFactory';

const ctx = { now: 0, rng: mulberry32(1) };
const pigs = () => [makePig({ id: 'a', hunger: 20 }), makePig({ id: 'b', hunger: 60, slotIndex: 1 }), makePig({ id: 'c', hunger: 100, slotIndex: 2 })];

describe('feedAll (D7)', () => {
  it('feeds each hungry pig once, spends one feed per pig, skips full pigs', () => {
    const s = { ...makeState(pigs(), 0), inventory: inv({ FOOD_BASIC: 5 }) };
    const r = feedAll(s, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.inventory.FOOD_BASIC).toBe(3);
    expect(r.events.filter((e) => e.type === 'PIG_FED')).toHaveLength(2);
    expect(r.state.pigs.find((p) => p.id === 'a')!.hunger).toBeGreaterThan(20);
  });

  it('gives the same result as feeding the pigs one by one', () => {
    const s = { ...makeState(pigs(), 0), inventory: inv({ FOOD_BASIC: 5 }) };
    const all = feedAll(s, ctx);
    const one = feedPig(s, { pigId: 'a' }, ctx);
    const two = one.ok ? feedPig(one.state, { pigId: 'b' }, ctx) : one;
    if (!all.ok || !two.ok) throw new Error('failed');
    expect(all.state.pigs.map((p) => p.hunger)).toEqual(two.state.pigs.map((p) => p.hunger));
    expect(all.state.player.xp).toBe(two.state.player.xp);
    expect(all.state.inventory.FOOD_BASIC).toBe(two.state.inventory.FOOD_BASIC);
  });

  it('runs out of feed halfway: the hungriest are fed, the rest stay hungry', () => {
    const s = { ...makeState(pigs(), 0), inventory: inv({ FOOD_BASIC: 1 }) };
    const r = feedAll(s, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.inventory.FOOD_BASIC).toBe(0);
    expect(r.state.pigs.find((p) => p.id === 'a')!.hunger).toBeGreaterThan(20);
    expect(r.state.pigs.find((p) => p.id === 'b')!.hunger).toBe(60);
  });

  it('errors when nothing can be done: all full, or no feed', () => {
    const full = { ...makeState([makePig({ id: 'x', hunger: 100 })], 0), inventory: inv({ FOOD_BASIC: 3 }) };
    expect(feedAll(full, ctx)).toEqual({ ok: false, error: 'ALREADY_FULL' });
    const none = { ...makeState(pigs(), 0), inventory: inv({}) };
    expect(feedAll(none, ctx)).toMatchObject({ ok: false, error: 'INSUFFICIENT_ITEM' });
  });
});
