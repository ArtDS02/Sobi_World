import { describe, expect, it } from 'vitest';
import {
  breedEconomy,
  foodToAdult,
  gateFailures,
  priceAt,
  stallGrowth,
} from '../../scripts/economy/model';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { BREED_ID_VALUES } from '../../src/areas/farm/logic/config/ids';

// Spec §6.4 sanity table, reproduced through the real engine (§14.7, Appendix C "Balance sanity").
describe('economy sanity (§6.4)', () => {
  // GĐ2 timescale: 48 h to Mature at -8 hunger/h, +50 per meal → one meal every 6.25 h, 7 meals.
  it('a PINK pig eats exactly 7 food units from birth to Mature (175 gold)', () => {
    expect(foodToAdult('PIG_EARTH_PINK')).toBe(7);
    expect(breedEconomy('PIG_EARTH_PINK').foodCost).toBe(175);
  });

  it('every breed eats one meal per 6.25 h (flat hunger rate) over its growth time', () => {
    for (const b of BREED_ID_VALUES) {
      const { growthSec, hungerFullSec } = BREEDS[b];
      const period = (hungerFullSec * BALANCE.FOOD_HUNGER_RESTORE) / BALANCE.HUNGER_MAX;
      expect(foodToAdult(b), b).toBe(Math.floor(growthSec / period));
    }
  });

  it('PINK ships for 1,200 / 1,440 / 3,600 (Normal / Good / Perfect) and nets 525 / 765 / 2,925 per pig', () => {
    expect([
      priceAt('PIG_EARTH_PINK', 0),
      priceAt('PIG_EARTH_PINK', 50),
      priceAt('PIG_EARTH_PINK', 100),
    ]).toEqual([1200, 1440, 3600]);
    const e = breedEconomy('PIG_EARTH_PINK');
    expect(
      [0, 50, 100].map((h) => Math.round(e.perHour[h as 0 | 50 | 100] * e.growthHours)),
    ).toEqual([525, 765, 2925]);
    expect(e.careRatio).toBeCloseTo(2925 / 525, 10); // care is worth > 5x the margin
  });

  it('an unfed baby stops growing when hunger reaches 30: PINK (48 h) 18.2 %, MELON (60 h) 14.6 %', () => {
    expect(stallGrowth('PIG_EARTH_PINK')).toBeCloseTo((8.75 / 48) * 100, 6);
    expect(stallGrowth('PIG_STRIPED_MELON')).toBeCloseTo((8.75 / 60) * 100, 6);
  });

  it('§14.7 gate passes for the shop breed and catches a ratio under 2x', () => {
    const rows = BREED_ID_VALUES.map(breedEconomy);
    expect(gateFailures(rows)).toEqual([]);
    const flat = { ...rows[0]!, perHour: { 0: 100, 50: 150, 100: 199 } };
    expect(gateFailures([flat])).toEqual([flat]);
  });
});
