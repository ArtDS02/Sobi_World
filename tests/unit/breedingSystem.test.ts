// systems/breeding (GĐ7): trait inheritance, mutation, pity, family tree, rumours.
import { describe, expect, it } from 'vitest';
import {
  applyPity,
  BREEDING_RULES_DEFAULT,
  couldBeRare,
  flattenAncestors,
  isRevealed,
  knownTraits,
  lineageFor,
  mutationChance,
  nextPity,
  rollChildTraits,
  rumorsOfDay,
  traitMultiplier,
  TRAITS,
  type ParentTraits,
} from '../../src/systems/breeding';
import { RUMOR_TEXTS } from '../../src/core/config/breeding';
import { seededRng } from '../../src/core/rng';

const R = BREEDING_RULES_DEFAULT;
const none: ParentTraits = { hiddenRevealed: false };
const withTraits = (traits: string[], hiddenTrait?: string): ParentTraits => ({ traits, hiddenTrait, hiddenRevealed: false });

describe('trait inheritance', () => {
  it('passes a one-parent trait at the configured chance', () => {
    const rng = seededRng(1);
    const N = 20_000;
    let got = 0;
    for (let i = 0; i < N; i += 1) {
      const c = rollChildTraits(rng, [withTraits(['trait_plump']), none], TRAITS, R);
      if (c.traits.includes('trait_plump')) got += 1;
    }
    expect(got / N).toBeGreaterThan(R.inheritChance / 100 - 0.03);
    expect(got / N).toBeLessThan(R.inheritChance / 100 + 0.03);
  });

  it('a trait both parents have is passed more often (two rolls)', () => {
    const rng = seededRng(2);
    const N = 20_000;
    let got = 0;
    for (let i = 0; i < N; i += 1) {
      if (rollChildTraits(rng, [withTraits(['trait_plump']), withTraits(['trait_plump'])], TRAITS, R).traits.includes('trait_plump')) got += 1;
    }
    expect(got / N).toBeGreaterThan(0.7);
  });

  it('never holds more than maxTraits, hidden one included', () => {
    const rng = seededRng(3);
    const all = ['trait_plump', 'trait_sweet', 'trait_quick_grower', 'trait_cheerful', 'trait_golden_hoof', 'trait_cuddly'];
    for (let i = 0; i < 2_000; i += 1) {
      const c = rollChildTraits(rng, [withTraits(all.slice(0, 3), all[4]), withTraits(all.slice(2, 5), all[5])], TRAITS, R);
      expect(c.traits.length + (c.hiddenTrait ? 1 : 0)).toBeLessThanOrEqual(R.maxTraits);
      expect(new Set([...c.traits, ...(c.hiddenTrait ? [c.hiddenTrait] : [])]).size).toBe(c.traits.length + (c.hiddenTrait ? 1 : 0));
    }
  });

  it('only RARE+ traits are ever hidden, and parents pass their hidden trait too', () => {
    const rng = seededRng(4);
    let hidden = 0;
    let passedHidden = 0;
    for (let i = 0; i < 5_000; i += 1) {
      const c = rollChildTraits(rng, [withTraits([], 'trait_golden_hoof'), none], TRAITS, R);
      if (c.hiddenTrait) {
        hidden += 1;
        expect(TRAITS.get(c.hiddenTrait)!.tier).not.toBe('COMMON');
      }
      if ([...c.traits, c.hiddenTrait].includes('trait_golden_hoof')) passedHidden += 1;
    }
    expect(hidden).toBeGreaterThan(0);
    expect(passedHidden).toBeGreaterThan(1_500);
  });

  it('the species signature trait is always held and never hidden', () => {
    const rng = seededRng(5);
    for (let i = 0; i < 1_000; i += 1) {
      const c = rollChildTraits(rng, [none, none], TRAITS, R, { signature: 'trait_golden_hoof' });
      expect(c.traits).toContain('trait_golden_hoof');
      expect(c.hiddenTrait).not.toBe('trait_golden_hoof');
    }
  });

  it('mutation happens at base chance, more with a boost, and gives a RARE+ trait', () => {
    const N = 40_000;
    const rate = (boost: number) => {
      const rng = seededRng(6);
      let m = 0;
      for (let i = 0; i < N; i += 1) {
        const c = rollChildTraits(rng, [none, none], TRAITS, R, { mutationBoost: boost });
        if (c.mutated) {
          m += 1;
          expect([...c.traits, c.hiddenTrait].some((id) => id && TRAITS.get(id)!.tier !== 'COMMON')).toBe(true);
        }
      }
      return m / N;
    };
    expect(rate(0)).toBeGreaterThan(R.mutation.base / 100 - 0.006);
    expect(rate(0)).toBeLessThan(R.mutation.base / 100 + 0.006);
    expect(rate(10)).toBeGreaterThan(rate(0) * 3);
  });

  it('parent traits and boosts add to the mutation chance, never past the cap', () => {
    const lucky: ParentTraits = { traits: ['trait_lucky_star'], hiddenRevealed: false };
    expect(mutationChance([lucky, none], TRAITS, R)).toBe(R.mutation.base + 3);
    // a hidden trait counts only once revealed
    const hiddenAncient: ParentTraits = { hiddenTrait: 'trait_ancient_blood', hiddenRevealed: false };
    expect(mutationChance([hiddenAncient, none], TRAITS, R)).toBe(R.mutation.base);
    expect(mutationChance([{ ...hiddenAncient, hiddenRevealed: true }, none], TRAITS, R)).toBe(R.mutation.base + 6);
    expect(mutationChance([lucky, lucky], TRAITS, R, 1_000)).toBe(R.mutation.cap);
  });

  it('is deterministic for a seed', () => {
    const run = () => rollChildTraits(seededRng(77), [withTraits(['trait_plump', 'trait_sweet']), withTraits(['trait_cuddly'])], TRAITS, R);
    expect(run()).toEqual(run());
  });
});

describe('trait effects', () => {
  it('a hidden trait takes effect only from 5 hearts', () => {
    const h = { traits: ['trait_plump'], hiddenTrait: 'trait_golden_hoof' };
    expect(isRevealed(4)).toBe(false);
    expect(knownTraits(h, 4)).toEqual(['trait_plump']);
    expect(knownTraits(h, 5)).toEqual(['trait_plump', 'trait_golden_hoof']);
    expect(traitMultiplier(TRAITS, h, 4, 'sellValue')).toBeCloseTo(1.1);
    expect(traitMultiplier(TRAITS, h, 5, 'sellValue')).toBeCloseTo(1.1 * 1.25);
    expect(traitMultiplier(TRAITS, {}, 5, 'growth')).toBe(1);
  });
});

describe('pity', () => {
  const rare = (b: string) => b === 'R';
  const odds = [
    { breed: 'C', weight: 90 },
    { breed: 'R', weight: 10 },
  ];

  it('moves probability to Rare+ outcomes and keeps the total at 100', () => {
    const out = applyPity(odds, rare, 6);
    expect(out.find((o) => o.breed === 'R')!.weight).toBeCloseTo(16);
    expect(out.reduce((s, o) => s + o.weight, 0)).toBeCloseTo(100);
  });

  it('leaves a pair that cannot give Rare+ (or only gives it) untouched', () => {
    expect(applyPity([{ breed: 'C', weight: 100 }], rare, 20)).toEqual([{ breed: 'C', weight: 100 }]);
    expect(applyPity([{ breed: 'R', weight: 100 }], rare, 20)).toEqual([{ breed: 'R', weight: 100 }]);
    expect(couldBeRare([{ breed: 'C', weight: 100 }], rare)).toBe(false);
    expect(couldBeRare(odds, rare)).toBe(true);
  });

  it('grows after a miss when Rare+ was possible, resets on a hit, holds when impossible, stops at the cap', () => {
    expect(nextPity(0, R, true, false)).toBe(R.pity.step);
    expect(nextPity(10, R, true, true)).toBe(0);
    expect(nextPity(10, R, false, false)).toBe(10);
    expect(nextPity(R.pity.cap, R, true, false)).toBe(R.pity.cap);
  });

  it('turns a bad streak into a hit: the Rare+ rate rises with every miss', () => {
    const rng = seededRng(9);
    let pity = 0;
    let longest = 0;
    let streak = 0;
    for (let i = 0; i < 5_000; i += 1) {
      const out = applyPity(odds, rare, pity);
      const roll = rng.next() * 100;
      const gotRare = roll < out.find((o) => o.breed === 'R')!.weight;
      pity = nextPity(pity, R, true, gotRare);
      streak = gotRare ? 0 : streak + 1;
      longest = Math.max(longest, streak);
    }
    // Without pity a 10% hit would miss 60+ times in a row about once in 500 runs of 5000; with it the cap bounds the streak.
    expect(longest).toBeLessThan(40);
  });
});

describe('family tree', () => {
  const node = (name: string, generation: number, lineage?: Parameters<typeof lineageFor>[0]['lineage']) => ({
    name,
    breed: 'PIG_WHITE',
    gender: 'FEMALE' as const,
    generation,
    traits: ['trait_plump'],
    lineage,
  });

  it('freezes the parents and trims the tree to the configured depth', () => {
    const gen1 = lineageFor(node('a', 1), node('b', 1), 3);
    const gen2 = lineageFor(node('c', 2, gen1), node('d', 1), 3);
    const gen3 = lineageFor(node('e', 3, gen2), node('f', 1), 3);
    const gen4 = lineageFor(node('g', 4, gen3), node('h', 1), 3);
    expect(gen4.mother.name).toBe('g');
    expect(gen4.mother.mother!.mother!.name).toBe('c'); // great-grandparent level
    expect(gen4.mother.mother!.mother!.mother).toBeUndefined(); // depth 3: nothing beyond
    expect(flattenAncestors(gen4).map((a) => a.name)).toContain('c');
    expect(flattenAncestors(gen4).map((a) => a.name)).not.toContain('a');
  });

  it('an unbred parent has no ancestors', () => {
    const t = lineageFor(node('a', 1), node('b', 1), 3);
    expect(t.mother.mother).toBeUndefined();
    expect(flattenAncestors(t)).toHaveLength(2);
  });
});

describe('rumours', () => {
  const recipes = [
    { parents: ['PIG_A', 'PIG_B'] as const, result: 'PIG_X' },
    { parents: ['PIG_C', 'PIG_D'] as const, result: 'PIG_Y' },
    { parents: ['PIG_E', 'PIG_F'] as const, result: 'PIG_Z' },
  ];
  const look = (b: string) => ({ clue: `heo họ ${b.length}`, rarity: 'RARE', theme: 'biển' });
  const base = { recipes, look, texts: RUMOR_TEXTS, perDay: R.rumors.perDay };

  it('gives one hint and one tip a day, stable within the day', () => {
    const a = rumorsOfDay({ ...base, day: 100, isKnown: () => false });
    const b = rumorsOfDay({ ...base, day: 100, isKnown: () => false });
    expect(a).toEqual(b);
    expect(a.map((r) => r.kind)).toEqual(['recipe', 'tip']);
  });

  it('changes over the days and covers the open recipes', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 40; day += 1) {
      const r = rumorsOfDay({ ...base, day, isKnown: () => false })[0]!;
      seen.add(r.recipe!.result);
    }
    expect(seen.size).toBe(3);
  });

  it('never names the result species, and skips recipes already in the Codex', () => {
    for (let day = 0; day < 40; day += 1) {
      const r = rumorsOfDay({ ...base, day, isKnown: (b) => b === 'PIG_X' })[0]!;
      expect(r.recipe!.result).not.toBe('PIG_X');
      expect(r.text).not.toMatch(/PIG_/);
      expect(r.text).not.toContain(r.recipe!.result);
    }
  });

  it('says there is no news when every recipe is known', () => {
    const r = rumorsOfDay({ ...base, day: 5, isKnown: () => true });
    expect(r[0]!.kind).toBe('none');
    expect(r[1]!.kind).toBe('tip');
  });
});
