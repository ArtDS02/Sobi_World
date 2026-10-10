import { describe, expect, it } from 'vitest';
import { BREED_IDS, BREEDS } from '../../src/areas/farm/logic/config/breeds';
import type { Pig } from '../../src/areas/farm/logic/types';
import { CONTENT } from '../../src/core/config/content';
import { marketFactor } from '../../src/systems/valuation/market';
import { freeSlots, growthStage, level, waitingPigs, weight } from '../../src/areas/farm/logic/derived';
import { happiness } from '../../src/areas/farm/logic/happiness';
import { pigQuality, sellPrice, sellQuote } from '../../src/areas/farm/logic/pricing';
import { makePig } from './pigFactory';

describe('happiness (§5.4)', () => {
  it('weights cleanliness 0.55 and hunger 0.45, rounded', () => {
    expect(happiness({ cleanliness: 100, hunger: 100, isSick: false })).toBe(100);
    expect(happiness({ cleanliness: 0, hunger: 0, isSick: false })).toBe(0);
    expect(happiness({ cleanliness: 80, hunger: 40, isSick: false })).toBe(62); // 44 + 18
    expect(happiness({ cleanliness: 51, hunger: 50, isSick: false })).toBe(51); // 50.55 → 51
  });

  it('sickness subtracts 40 and clamps at 0', () => {
    expect(happiness({ cleanliness: 100, hunger: 100, isSick: true })).toBe(60);
    expect(happiness({ cleanliness: 20, hunger: 20, isSick: true })).toBe(0);
  });
});

describe('shipping price (GAME_BALANCE §2.5)', () => {
  const V = CONTENT.valuation;
  const DAY = 86_400_000;
  /** A day on which the market pays the plain price, and one that pays more / less. */
  const dayWith = (factor: number) => Array.from({ length: 60 }, (_, d) => d).find((d) => marketFactor(d, V.market) === factor)!;
  const ctx = (day = dayWith(1), decorBonus = 0) => ({ now: day * DAY + 12 * 3_600_000, dayOffsetMs: 0, decorBonus });
  /** A full-grown pig that lived at mood `mood` all its life. */
  const grown = (mood: number, over: Partial<Pig> = {}) => makePig({ growthProgress: 100, moodAvg: mood, moodSec: 1e6, ...over });

  it('PINK ships for 1,200 / 1,440 / 1,800 / 2,400 / 3,600 at Normal / Good / Great / Excellent / Perfect', () => {
    expect([10, 45, 65, 80, 95].map((m) => sellPrice(grown(m), ctx()))).toEqual([1200, 1440, 1800, 2400, 3600]);
  });

  it('quality is the lifetime average mood; a new pig counts its mood now', () => {
    expect(pigQuality(grown(95))).toBe('PERFECT');
    expect(pigQuality(makePig({ hunger: 100, cleanliness: 100 }))).toBe('PERFECT'); // (100 + 100 + 100) / 3
    expect(pigQuality(makePig({ hunger: 30, cleanliness: 30, energy: 30 }))).toBe('NORMAL');
    expect(pigQuality(makePig({ hunger: 50, cleanliness: 50, energy: 50 }), 10)).toBe('GREAT'); // decorations lift it
  });

  it('weight: a young pig is worth its share of the full weight', () => {
    const half = sellQuote(grown(10, { growthProgress: 50 }), ctx());
    expect(half.weightFactor).toBeCloseTo(0.6, 9); // 60 % of max weight at Adult
    expect(half.price).toBe(Math.floor(1200 * 0.6));
  });

  it('illness takes 10 % a day, at most 30 %; treated pigs are not marked down', () => {
    const c = ctx();
    const ill = (days: number) => sellQuote(grown(10, { isSick: true, lastSickAt: c.now - days * DAY }), c).healthFactor;
    expect(ill(0)).toBe(1);
    expect(ill(1)).toBeCloseTo(0.9, 9);
    expect(ill(2)).toBeCloseTo(0.8, 9);
    expect(ill(10)).toBeCloseTo(0.7, 9);
    expect(sellQuote(grown(10, { isSick: false, lastSickAt: c.now - 3 * DAY }), c).healthFactor).toBe(1);
  });

  it('the market of a day is 0.9, 1.0 or 1.2, the same all day and in every run', () => {
    const factors = Array.from({ length: 200 }, (_, d) => marketFactor(d, V.market));
    expect(new Set(factors)).toEqual(new Set([0.9, 1, 1.2]));
    expect(marketFactor(7, V.market)).toBe(marketFactor(7, V.market));
    const share = (f: number) => factors.filter((x) => x === f).length / factors.length;
    expect(share(1)).toBeGreaterThan(0.4); // weights 1 : 2 : 1
    const p = (f: number) => sellPrice(grown(10), ctx(dayWith(f)));
    expect([p(0.9), p(1), p(1.2)]).toEqual([1080, 1200, 1440]);
  });

  it('the price is the product of the factors, floored', () => {
    for (const breed of BREED_IDS) {
      const q = sellQuote(grown(65, { breed }), ctx());
      expect(q.price).toBe(Math.floor(BREEDS[breed].sellGold * q.qualityFactor * q.weightFactor * q.healthFactor * q.marketFactor + 1e-9));
    }
  });
});

describe('growthStage (GAME_BALANCE §2.1)', () => {
  it.each([
    [0, 'BABY'],
    [12.499, 'BABY'],
    [12.5, 'YOUNG'],
    [49.999, 'YOUNG'],
    [50, 'ADULT'],
    [99.999, 'ADULT'],
    [100, 'MATURE'],
  ])('progress %s → %s', (p, stage) => {
    expect(growthStage(p)).toBe(stage);
  });
});

describe('weight, level, freeSlots', () => {
  it('weight goes 1 kg → maxWeight, by stage (2 % newborn, 60 % at Adult, 100 % Mature)', () => {
    expect(weight(makePig({ growthProgress: 0 }))).toBe(1);
    expect(weight(makePig({ growthProgress: 50 }))).toBe(30);
    expect(weight(makePig({ growthProgress: 100 }))).toBe(50);
  });

  it('level derives from xp', () => {
    expect(level({ player: { gold: 0, xp: 383, unlockedSlots: 4 } })).toBe(3);
  });

  it('a pregnancy holds no slot; waiting = nursery + unborn (BR-1)', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 1,
      fatherId: 'pig-2',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    const state = {
      player: { gold: 0, xp: 0, unlockedSlots: 4, ownedSkins: [] },
      pigs: [makePig({ pregnancy }), makePig({ id: 'pig-2', slotIndex: 1 })],
    };
    expect(freeSlots(state)).toBe(2);
    expect(waitingPigs({ ...state, nursery: [] })).toBe(1);
  });
});
