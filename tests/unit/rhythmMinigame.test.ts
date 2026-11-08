// D8: the timing mini-game — pure maths, the round state machine, and the optional tip on watering (Garden and Cloud).
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { cloudArea } from '../../src/areas/cloud';
import { waterPlots as cloudWater, plantFlowers } from '../../src/areas/cloud/logic/actions/plants';
import { gardenArea } from '../../src/areas/garden';
import { waterPlots as gardenWater, plantCrops } from '../../src/areas/garden/logic/actions/plants';
import { CONTENT } from '../../src/core/config/content';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { hitScore, markerAt, rhythmTip, roundsScore } from '../../src/systems/minigame/rhythm';
import { createRhythm } from '../../src/ui/components/rhythmDialog';

const R = CONTENT.minigame.rhythm;
const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number): ActionContext => ({ now, rng: mulberry32(7) });

describe('rhythm maths', () => {
  it('the marker is a triangle wave: 0 at the start, 1 at half a period, back to 0', () => {
    expect(markerAt(0, 1000)).toBe(0);
    expect(markerAt(250, 1000)).toBeCloseTo(0.5);
    expect(markerAt(500, 1000)).toBe(1);
    expect(markerAt(750, 1000)).toBeCloseTo(0.5);
    expect(markerAt(1000, 1000)).toBeCloseTo(0);
    expect(markerAt(-250, 1000)).toBeCloseTo(0.5); // a clock that went back stays inside the bar
    expect(markerAt(NaN, 1000)).toBe(0);
    expect(markerAt(5, 0)).toBe(0);
  });
  it('the score is 1 in the middle and 0 outside the zone', () => {
    expect(hitScore(0.5, 0.14)).toBe(1);
    expect(hitScore(0.5 + 0.07, 0.14)).toBeCloseTo(0.5);
    expect(hitScore(0.5 + 0.14, 0.14)).toBe(0);
    expect(hitScore(0, 0.14)).toBe(0);
  });
  it('the mean of rounds ignores nonsense and the tip is whole, bounded coins', () => {
    expect(roundsScore([])).toBe(0);
    expect(roundsScore([1, 0.5, 0])).toBeCloseTo(0.5);
    expect(roundsScore([2, NaN, -1])).toBeCloseTo(1 / 3);
    expect(rhythmTip(1, 4, { tipPerUnit: 3 })).toBe(12);
    expect(rhythmTip(0.5, 3, { tipPerUnit: 3 })).toBe(5);
    expect(rhythmTip(5, 2, { tipPerUnit: 3 })).toBe(6); // clamped to 1
    expect(rhythmTip(NaN, 2, { tipPerUnit: 3 })).toBe(0);
    expect(rhythmTip(1, 0, { tipPerUnit: 3 })).toBe(0);
    expect(rhythmTip(1, -2, { tipPerUnit: 3 })).toBe(0);
  });
  it('the content makes a possible game: a good zone, some rounds, a modest tip', () => {
    expect(R.zoneHalf).toBeGreaterThan(0);
    expect(R.rounds).toBeGreaterThanOrEqual(1);
    expect(R.tipPerUnit).toBeLessThanOrEqual(10);
  });
});

describe('the round state machine', () => {
  it('scores each press against the marker, restarts the sweep, and finishes after the last round', () => {
    let t = 0;
    const game = createRhythm({ ...R, periodMs: 1000, rounds: 2, zoneHalf: 0.2 }, () => t);
    t = 250; // marker at 0.5: a perfect press
    expect(game.press()).toBe(1);
    t = 250 + 50; // 50 ms into the next sweep: marker 0.1, outside the zone
    expect(game.press()).toBe(0);
    expect(game.done()).toBe(true);
    expect(game.press()).toBeNull();
    expect(game.scores()).toEqual([1, 0]);
  });
});

describe('the tip on watering', () => {
  const gardenSown = (): WorldSave => {
    const opened = gardenArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
    const w: WorldSave = { ...opened, wallet: { ...opened.wallet, coins: 10_000 }, inventory: { items: {} } };
    const r = plantCrops(w, { cropId: 'crop_corn', plots: [0, 1, 2] }, ctxAt(T0));
    if (!r.ok) throw new Error(r.error);
    return r.state;
  };
  it('Garden: a perfect score tips tipPerUnit per plot through the ledger; the quick way pays nothing', () => {
    const w = gardenSown();
    const quick = gardenWater(w, { plots: [0, 1, 2] }, ctxAt(T0));
    const timed = gardenWater(w, { plots: [0, 1, 2], score: 1 }, ctxAt(T0));
    if (!quick.ok || !timed.ok) throw new Error('failed');
    expect(quick.state.wallet.coins).toBe(w.wallet.coins);
    expect(timed.state.wallet.coins).toBe(w.wallet.coins + 3 * R.tipPerUnit);
    expect(timed.state.transactions[0]).toMatchObject({ type: 'MINIGAME_TIP', currency: 'coins', amount: 3 * R.tipPerUnit });
    expect(timed.events.find((e) => e.type === 'GARDEN_WATERED')).toMatchObject({ plots: 3, tip: 3 * R.tipPerUnit });
    expect(quick.events.find((e) => e.type === 'GARDEN_WATERED')).not.toHaveProperty('tip');
    // the plots themselves are watered the same either way
    expect(JSON.stringify(timed.state.areas)).toBe(JSON.stringify(quick.state.areas));
  });
  it('Garden: a zero score tips nothing and a half score half', () => {
    const w = gardenSown();
    const zero = gardenWater(w, { plots: [0], score: 0 }, ctxAt(T0));
    const half = gardenWater(w, { plots: [0, 1], score: 0.5 }, ctxAt(T0));
    if (!zero.ok || !half.ok) throw new Error('failed');
    expect(zero.state.wallet.coins).toBe(w.wallet.coins);
    expect(half.state.wallet.coins).toBe(w.wallet.coins + Math.round(0.5 * 2 * R.tipPerUnit));
  });
  it('Cloud: the same tip after the same watering; water is still used up', () => {
    const opened = cloudArea.init(SAVE_CODEC.newWorld(ctxAt(T0)), ctxAt(T0));
    const base: WorldSave = { ...opened, wallet: { ...opened.wallet, coins: 100_000 }, inventory: { items: { item_pure_water: 5 } } };
    const planted = plantFlowers(base, { flowerId: 'flower_cloud_daisy', plots: [0, 1] }, ctxAt(T0));
    if (!planted.ok) throw new Error(planted.error);
    const timed = cloudWater(planted.state, { plots: [0, 1], score: 1 }, ctxAt(T0));
    if (!timed.ok) throw new Error(timed.error);
    expect(timed.state.wallet.coins).toBe(planted.state.wallet.coins + 2 * R.tipPerUnit);
    expect(timed.state.inventory.items.item_pure_water).toBe(3);
    expect(timed.state.transactions[0]).toMatchObject({ type: 'MINIGAME_TIP' });
  });
});
