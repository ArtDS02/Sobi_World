// The admin breeding simulator (GĐ7): 1,000 breedings read the configured rates.
import { describe, expect, it } from 'vitest';
import { simulateBreeding } from '../../src/areas/farm/logic/breedingSim';
import { breedingOutcomes } from '../../src/areas/farm/logic/breedingOdds';
import { isRareBreed } from '../../src/areas/farm/logic/heredity';
import { BREEDING_RULES_DEFAULT } from '../../src/systems/breeding';

describe('simulateBreeding', () => {
  it('is deterministic for a seed', () => {
    const run = () => simulateBreeding({ a: 'PIG_WHITE', b: 'PIG_BLACK', samples: 1000, seed: 7 });
    expect(run()).toEqual(run());
  });

  it('species rates match the odds of the pair (50,000 breedings, within 1 point)', () => {
    const r = simulateBreeding({ a: 'PIG_WHITE', b: 'PIG_BLACK', samples: 50_000, seed: 3, carryPity: false });
    for (const o of breedingOutcomes('PIG_WHITE', 'PIG_BLACK')!) {
      const got = r.species.find((s) => s.id === o.breed)?.percent ?? 0;
      expect(Math.abs(got - o.weight), o.breed).toBeLessThan(1);
    }
    expect(r.species.reduce((n, s) => n + s.count, 0)).toBe(50_000);
  }, 60_000);

  it('the mutation rate follows the configured base, and rises with a boost', () => {
    const base = simulateBreeding({ a: 'PIG_WHITE', b: 'PIG_WHITE', samples: 40_000, seed: 5, carryPity: false });
    expect(base.mutationPercent).toBeGreaterThan(BREEDING_RULES_DEFAULT.mutation.base - 0.6);
    expect(base.mutationPercent).toBeLessThan(BREEDING_RULES_DEFAULT.mutation.base + 0.6);
    const boosted = simulateBreeding({ a: 'PIG_WHITE', b: 'PIG_WHITE', samples: 40_000, seed: 5, carryPity: false, mutationBoost: 10 });
    expect(boosted.mutationPercent).toBeGreaterThan(base.mutationPercent * 3);
  }, 60_000);

  it('parent traits pass at the configured chance', () => {
    const r = simulateBreeding({
      a: 'PIG_WHITE',
      b: 'PIG_WHITE',
      samples: 20_000,
      seed: 9,
      carryPity: false,
      parentA: { traits: ['trait_plump'], hiddenRevealed: true },
    });
    const got = r.traits.find((t) => t.id === 'trait_plump')?.percent ?? 0;
    expect(got).toBeGreaterThan(BREEDING_RULES_DEFAULT.inheritChance - 3);
    expect(got).toBeLessThan(BREEDING_RULES_DEFAULT.inheritChance + 4);
  });

  it('pity: carried pity shortens the worst miss streak of a Rare+ recipe; a pair without Rare+ never counts', () => {
    const rarePair = ['PIG_BEE', 'PIG_PUMPKIN'] as const; // can give the rare SUNFLOWER
    expect(breedingOutcomes(...rarePair)!.some((o) => isRareBreed(o.breed))).toBe(true);
    const without = simulateBreeding({ a: rarePair[0], b: rarePair[1], samples: 3000, seed: 1, carryPity: false });
    const withPity = simulateBreeding({ a: rarePair[0], b: rarePair[1], samples: 3000, seed: 1, carryPity: true });
    expect(withPity.rarePercent).toBeGreaterThan(without.rarePercent);
    expect(withPity.longestMiss).toBeLessThanOrEqual(without.longestMiss);
    expect(withPity.maxPity).toBeGreaterThan(0);
    const never = simulateBreeding({ a: 'PIG_WHITE', b: 'PIG_WHITE', samples: 500, seed: 1 });
    if (!never.couldBeRare) {
      expect(never.maxPity).toBe(0);
      expect(never.longestMiss).toBe(0);
    }
  });
});
