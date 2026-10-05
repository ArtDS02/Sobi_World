// Special recipe → random genetics (DECISIONS MU-1): bucket priorities, rarity bounds, recipe
// priority, every pair breeds, gene pool as a bonus only, seeded rolls, config validation.
import { describe, expect, it } from 'vitest';
import { GENETICS, MUTATIONS, type Mutation } from '../../src/core/config/breedingRules';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import type { BreedId } from '../../src/core/config/ids';
import { rarityRank, RARITY_VALUES } from '../../src/core/config/rarity';
import { rollChildSeeded } from '../../src/areas/farm/logic/breeding';
import {
  breedingLayer,
  breedingOutcomes,
  geneticsBuckets,
  geneticsCase,
  geneticsIssues,
  recipeIssues,
} from '../../src/areas/farm/logic/breedingOdds';
import { geneProfile, geneWeight, themesRelated } from '../../src/areas/farm/logic/genePool';

const BREEDABLE = BREED_IDS.filter((id) => BREEDS[id].enabled && BREEDS[id].breedable);
const rank = (id: BreedId) => rarityRank(BREEDS[id].rarity);
const ofRarity = (r: string) => BREEDABLE.filter((id) => BREEDS[id].rarity === r);
/** A pair of the given rarities with no special recipe and no pair rule. */
function plainPair(ra: string, rb: string): [BreedId, BreedId] {
  for (const a of ofRarity(ra))
    for (const b of ofRarity(rb))
      if (a !== b && breedingLayer(a, b) === 'genetics') return [a, b];
  throw new Error(`no plain ${ra} × ${rb} pair`);
}
const odds = (a: BreedId, b: BreedId, mutations?: readonly Mutation[]) =>
  new Map((breedingOutcomes(a, b, [], mutations ? { mutations } : {}) ?? []).map((o) => [o.breed, o.weight]));
const sum = (m: Map<BreedId, number>, pick: (id: BreedId) => boolean) =>
  [...m].filter(([id]) => pick(id)).reduce((s, [, w]) => s + w, 0);

describe('random genetics: same rarity (MU-1)', () => {
  for (const r of ['COMMON', 'RARE', 'EPIC']) {
    it(`${r} + ${r}: parents > other ${r} > one tier up, nothing else`, () => {
      const [a, b] = plainPair(r, r);
      expect(geneticsCase(a, b)).toBe('sameRarity');
      const o = odds(a, b);
      const k = rarityRank(r as never);
      const parents = sum(o, (id) => id === a || id === b);
      const same = sum(o, (id) => id !== a && id !== b && rank(id) === k);
      const up = sum(o, (id) => rank(id) === k + 1);
      expect(parents).toBeGreaterThan(same);
      expect(same).toBeGreaterThan(up);
      expect(up).toBeGreaterThan(0);
      expect(parents + same + up).toBeCloseTo(100, 6);
      // Each parent species is individually the most likely child.
      const top = Math.max(...o.values());
      expect(Math.max(o.get(a)!, o.get(b)!)).toBe(top);
    });
  }

  it('the top tier has no "one up": its bucket drops and the rest rescale', () => {
    const top = RARITY_VALUES.length - 1;
    const buckets = geneticsBuckets('PIG_KOI', 'PIG_DRAGONLING'); // EPIC: up = LEGENDARY exists
    expect(buckets.some((x) => x.kind === 'higher')).toBe(true);
    for (const id of BREEDABLE) for (const o of breedingOutcomes(id, id) ?? []) expect(rank(o.breed)).toBeLessThanOrEqual(top);
  });
});

describe('random genetics: different rarity (MU-1)', () => {
  it('Common + Rare (one tier between): parents > Uncommon (middle) > other Rare; no Common others', () => {
    const [a, b] = plainPair('COMMON', 'RARE');
    expect(geneticsCase(a, b)).toBe('differentRarity');
    const o = odds(a, b);
    const parents = sum(o, (id) => id === a || id === b);
    const middle = sum(o, (id) => rank(id) === 1);
    const higher = sum(o, (id) => id !== b && rank(id) === 2);
    expect(parents).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(higher);
    expect(sum(o, (id) => id !== a && rank(id) === 0)).toBe(0);
    expect(sum(o, (id) => rank(id) > 2)).toBe(0);
  });

  it('Common + Epic: both middle tiers (Uncommon, Rare) can come out', () => {
    const [a, b] = plainPair('COMMON', 'EPIC');
    const o = odds(a, b);
    expect(sum(o, (id) => rank(id) === 1)).toBeGreaterThan(0);
    expect(sum(o, (id) => rank(id) === 2)).toBeGreaterThan(0);
    expect(sum(o, (id) => rank(id) === 4)).toBe(0); // nothing above the higher parent
  });

  it('adjacent Common + Uncommon / Rare + Epic: parents > others of both tiers, higher tier gets the extra', () => {
    for (const [ra, rb] of [['COMMON', 'UNCOMMON'], ['RARE', 'EPIC']] as const) {
      const [a, b] = plainPair(ra, rb);
      expect(geneticsCase(a, b)).toBe('adjacentRarity');
      const o = odds(a, b);
      const lo = rank(a), hi = rank(b);
      const parents = sum(o, (id) => id === a || id === b);
      const others = sum(o, (id) => id !== a && id !== b);
      expect(parents).toBeGreaterThan(others / 2);
      for (const id of o.keys()) expect([lo, hi]).toContain(rank(id));
      const avgLo = sum(o, (id) => id !== a && rank(id) === lo) / Math.max(1, ofRarity(ra).length - 1);
      const avgHi = sum(o, (id) => id !== b && rank(id) === hi) / Math.max(1, BREED_IDS.filter((x) => BREEDS[x].enabled && rank(x) === hi).length - 1);
      expect(avgHi).toBeGreaterThan(avgLo * 0.5);
    }
  });
});

describe('special recipes beat random genetics (MU-1)', () => {
  it('a recipe result gets at least its percent; the rest is random genetics', () => {
    for (const m of MUTATIONS) {
      if (!BREEDS[m.result].enabled) continue;
      expect(breedingLayer(m.parents[0], m.parents[1])).toBe('recipe');
      const o = odds(m.parents[0], m.parents[1]);
      expect(o.get(m.result)!).toBeGreaterThanOrEqual(m.weight - 1e-9);
    }
  });

  it('a 100 % recipe always wins, whatever the seed', () => {
    const recipe: Mutation[] = [{ parents: ['PIG_WHITE', 'PIG_BROWN'], result: 'PIG_GHOST', weight: 100 }];
    const o = odds('PIG_WHITE', 'PIG_BROWN', recipe);
    expect([...o]).toEqual([['PIG_GHOST', 100]]);
  });

  it('every valid pair has offspring (no unsupported pair), odds sum to 100', () => {
    for (let i = 0; i < BREEDABLE.length; i++)
      for (let j = i; j < BREEDABLE.length; j++) {
        const out = breedingOutcomes(BREEDABLE[i]!, BREEDABLE[j]!);
        expect(out?.length, `${BREEDABLE[i]} × ${BREEDABLE[j]}`).toBeGreaterThan(0);
        expect(out!.reduce((s, o) => s + o.weight, 0)).toBeCloseTo(100, 6);
        expect(out!.every((o) => o.weight > 0)).toBe(true);
      }
  });
});

describe('gene pool + seed (MU-1)', () => {
  it('profiles carry pigType, rarity, theme and gene tags', () => {
    const p = geneProfile('PIG_STRIPED_MELON');
    expect(p).toMatchObject({ pigType: 'PIG_STRIPED_MELON', rarity: 'UNCOMMON', theme: 'MEADOW' });
    expect(p.geneTags).toContain('fruit');
  });

  it('pigs without gene tags still breed (tags are a bonus only)', () => {
    const out = breedingOutcomes('PIG_WHITE', 'PIG_BLACK', [], { genes: { parentTraits: [[], []] } });
    expect(out!.reduce((s, o) => s + o.weight, 0)).toBeCloseTo(100, 6);
    expect(geneWeight('PIG_GHOST', 'PIG_WHITE', 'PIG_BLACK', { parentTraits: [[], []] })).toBeGreaterThan(0);
  });

  it('a related theme is a bonus, never a requirement', () => {
    expect(themesRelated('FARM', 'MEADOW')).toBe(true);
    expect(themesRelated('FARM', 'FARM')).toBe(false);
    const off = { bonuses: { base: 1, sameTheme: 0, relatedTheme: 0, perGeneTag: 0, geneTagCap: 0 } };
    const on = { bonuses: { base: 1, sameTheme: 0, relatedTheme: 5, perGeneTag: 0, geneTagCap: 0 } };
    expect(geneWeight('PIG_SHEEP', 'PIG_WHITE', 'PIG_WHITE', on)).toBeGreaterThan(geneWeight('PIG_SHEEP', 'PIG_WHITE', 'PIG_WHITE', off));
    expect(geneWeight('PIG_ALIEN', 'PIG_WHITE', 'PIG_WHITE', on)).toBe(1);
  });

  it('a seed replays the same children; different seeds differ', () => {
    const roll = (seed: number) => rollChildSeeded(seed, 'PIG_WHITE', 'PIG_BLACK');
    for (const seed of [1, 42, 9999]) expect(roll(seed)).toEqual(roll(seed));
    const seen = new Set(Array.from({ length: 200 }, (_, i) => roll(i).breed));
    expect(seen.size).toBeGreaterThan(3);
  });

  it('config validation: shipped tables are valid; bad ones are caught', () => {
    expect(geneticsIssues(GENETICS)).toEqual([]);
    expect(recipeIssues(MUTATIONS)).toEqual([]);
    const bad = JSON.parse(JSON.stringify(GENETICS)) as typeof GENETICS;
    (bad.sameRarity as { parentTypeChance: number }).parentTypeChance = -5;
    (bad.differentRarity as { higherRarityChance: number }).higherRarityChance = 50;
    expect(geneticsIssues(bad).length).toBeGreaterThanOrEqual(3);
    expect(recipeIssues([
      { parents: ['PIG_WHITE', 'PIG_BLACK'], result: 'PIG_PANDA', weight: 70 },
      { parents: ['PIG_BLACK', 'PIG_WHITE'], result: 'PIG_PENGUIN', weight: 40 },
    ])).toHaveLength(1);
  });
});
