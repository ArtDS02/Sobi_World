import { describe, expect, it } from 'vitest';
import {
  breedEconomy,
  foodToAdult,
  gateFailures,
  priceAt,
  stallGrowth,
} from '../../scripts/economy/model';
import { BALANCE } from '../../src/core/config/balance';
import { BREEDS } from '../../src/core/config/breeds';
import { BREED_ID_VALUES } from '../../src/core/config/ids';

// Spec §6.4 sanity table, reproduced through the real engine (§14.7, Appendix C "Balance sanity").
describe('economy sanity (§6.4)', () => {
  // NH-1 budgets: PINK hunger lasts its whole growth (7,200 s), so 2 meals (at 3,600 / 7,200 s).
  it('a PINK pig eats exactly 2 food units from birth to adult (50 gold)', () => {
    expect(foodToAdult('PIG_EARTH_PINK')).toBe(2);
    expect(breedEconomy('PIG_EARTH_PINK').foodCost).toBe(50);
  });

  it('every breed eats one meal per half hunger budget: care budgets derive from growthSec (NH-1)', () => {
    for (const b of BREED_ID_VALUES) {
      const { growthSec, hungerFullSec } = BREEDS[b];
      const period = (hungerFullSec * BALANCE.FOOD_HUNGER_RESTORE) / BALANCE.HUNGER_MAX;
      expect(foodToAdult(b), b).toBe(Math.floor(growthSec / period));
    }
  });

  it('PINK sell price 840 / 1,140 / 1,440 and net profit 290 / 590 / 890 at happiness 0 / 50 / 100', () => {
    expect([
      priceAt('PIG_EARTH_PINK', 0),
      priceAt('PIG_EARTH_PINK', 50),
      priceAt('PIG_EARTH_PINK', 100),
    ]).toEqual([840, 1140, 1440]);
    const e = breedEconomy('PIG_EARTH_PINK');
    expect(
      [0, 50, 100].map((h) => Math.round(e.perHour[h as 0 | 50 | 100] * e.growthHours)),
    ).toEqual([290, 590, 890]);
    expect(e.careRatio).toBeCloseTo(890 / 290, 10); // care still worth > 3x the margin (NH-1)
  });

  it('an unfed baby stalls at hungerFullSec / growthSec: PINK 100 %, MELON 50 % (NH-1)', () => {
    expect(stallGrowth('PIG_EARTH_PINK')).toBeCloseTo(100, 6);
    expect(stallGrowth('PIG_STRIPED_MELON')).toBeCloseTo(50, 6);
  });

  it('§14.7 gate passes for the shop breed and catches a ratio under 2x', () => {
    const rows = BREED_ID_VALUES.map(breedEconomy);
    expect(gateFailures(rows)).toEqual([]);
    const flat = { ...rows[0]!, perHour: { 0: 100, 50: 150, 100: 199 } };
    expect(gateFailures([flat])).toEqual([flat]);
  });
});
