import { describe, expect, it } from 'vitest';
import {
  breedEconomy,
  foodToAdult,
  gateFailures,
  priceAt,
  stallGrowth,
} from '../../scripts/economy/model';
import { BREED_ID_VALUES } from '../../src/core/config/ids';

// Spec §6.4 sanity table, reproduced through the real engine (§14.7, Appendix C "Balance sanity").
describe('economy sanity (§6.4)', () => {
  it('a PINK pig eats exactly 6 food units from birth to adult (150 gold)', () => {
    expect(foodToAdult('PIG_EARTH_PINK')).toBe(6);
    expect(breedEconomy('PIG_EARTH_PINK').foodCost).toBe(150);
  });

  it('every breed needs the same 6 units: care budgets derive from growthSec (D16)', () => {
    for (const b of BREED_ID_VALUES) expect(foodToAdult(b)).toBe(6);
  });

  it('PINK sell price 840 / 1,140 / 1,440 and net profit 190 / 490 / 790 at happiness 0 / 50 / 100', () => {
    expect([
      priceAt('PIG_EARTH_PINK', 0),
      priceAt('PIG_EARTH_PINK', 50),
      priceAt('PIG_EARTH_PINK', 100),
    ]).toEqual([840, 1140, 1440]);
    const e = breedEconomy('PIG_EARTH_PINK');
    expect(
      [0, 50, 100].map((h) => Math.round(e.perHour[h as 0 | 50 | 100] * e.growthHours)),
    ).toEqual([190, 490, 790]);
    expect(e.careRatio).toBeCloseTo(790 / 190, 10); // "care is worth 4.2x the margin"
  });

  it('a PINK pig with an empty trough stalls at 33.33% growth', () => {
    expect(stallGrowth('PIG_EARTH_PINK')).toBeCloseTo(100 / 3, 2);
  });

  it('§14.7 gate passes for the shop breed and catches a ratio under 2x', () => {
    const rows = BREED_ID_VALUES.map(breedEconomy);
    expect(gateFailures(rows)).toEqual([]);
    const flat = { ...rows[0]!, perHour: { 0: 100, 50: 150, 100: 199 } };
    expect(gateFailures([flat])).toEqual([flat]);
  });
});
