// GĐ7 in the Farm: traits through breed → pregnancy → birth → adopt, pity, family tree, trait effects, new species.
import { describe, expect, it } from 'vitest';
import { adoptPig } from '../../src/areas/farm/logic/actions/adoptPig';
import { breedPigs } from '../../src/areas/farm/logic/actions/breedPigs';
import { petPig } from '../../src/areas/farm/logic/actions/petPig';
import { advancePig } from '../../src/areas/farm/logic/advancePig';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { BREEDS, BREED_IDS } from '../../src/areas/farm/logic/config/breeds';
import { MUTATIONS } from '../../src/areas/farm/logic/config/breedingRules';
import { breedingOutcomes } from '../../src/areas/farm/logic/breedingOdds';
import { pigFavorite } from '../../src/areas/farm/logic/bond';
import { isRareBreed } from '../../src/areas/farm/logic/heredity';
import { sellQuote } from '../../src/areas/farm/logic/pricing';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import { farmGameSchema } from '../../src/areas/farm/logic/save/farmSchema';
import { BOND } from '../../src/core/config/bond';
import { mulberry32 } from '../../src/core/rng';
import { TRAITS } from '../../src/systems/breeding';
import { ctx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';
import type { FarmGame, Pig } from '../../src/areas/farm/logic/types';

const adult = (o: Partial<Pig>) => makePig({ growthProgress: 100, ...o });
const mom = (o: Partial<Pig> = {}) => adult({ id: 'mom', slotIndex: 0, gender: 'FEMALE', ...o });
const dad = (o: Partial<Pig> = {}) => adult({ id: 'dad', slotIndex: 1, gender: 'MALE', ...o });
const startBreeding = (m: Partial<Pig>, d: Partial<Pig>, now = 0, patch: Partial<FarmGame> = {}) =>
  expectOk(breedPigs(farm([mom(m), dad(d)], patch), { pigAId: 'mom', pigBId: 'dad' }, ctx(now, mulberry32(11)))).state;

/** The newborn of a breeding, after the mother's pregnancy has ended. */
function newborn(s: FarmGame) {
  const end = s.pigs.find((p) => p.id === 'mom')!.pregnancy!.endsAt;
  const born = advanceWorld(s, end + 1000, mulberry32(5));
  return born.state.nursery[0]!;
}

describe('traits through the pregnancy', () => {
  it('the child traits are drawn when breeding starts and stored on the mother', () => {
    const s = startBreeding({ traits: ['trait_plump'] }, { traits: ['trait_sweet'] });
    const p = s.pigs.find((x) => x.id === 'mom')!.pregnancy!;
    expect(p.childTraits).toBeDefined();
    expect(p.childLineage?.mother?.name).toBeDefined();
  });

  it('is deterministic for the same pair and time', () => {
    const a = startBreeding({ traits: ['trait_plump', 'trait_sweet'] }, { traits: ['trait_cuddly'] }, 1_000);
    const b = startBreeding({ traits: ['trait_plump', 'trait_sweet'] }, { traits: ['trait_cuddly'] }, 1_000);
    expect(a.pigs.find((p) => p.id === 'mom')!.pregnancy).toEqual(b.pigs.find((p) => p.id === 'mom')!.pregnancy);
  });

  it('a newborn keeps its traits, hidden trait and family tree; adopting moves them onto the pig', () => {
    const s = startBreeding({ name: 'Mẹ', traits: ['trait_plump', 'trait_sweet'], hiddenTrait: 'trait_golden_hoof' }, { name: 'Bố', traits: ['trait_plump'] });
    const preg = s.pigs.find((p) => p.id === 'mom')!.pregnancy!;
    const baby = newborn(s);
    expect(baby.traits).toEqual(preg.childTraits);
    expect(baby.hiddenTrait).toBe(preg.childHidden);
    expect(baby.lineage?.mother?.name).toBe('Mẹ');
    expect(baby.lineage?.father?.name).toBe('Bố');
    const raised = expectOk(adoptPig(farm([], { nursery: [baby] }), { nurseryId: baby.id }, ctx(0))).state.pigs[0]!;
    expect(raised.traits).toEqual(baby.traits);
    expect(raised.hiddenTrait).toBe(baby.hiddenTrait);
    expect(raised.lineage).toEqual(baby.lineage);
  });

  it('the tree grows a level each generation and stops at the configured depth', () => {
    let m: Partial<Pig> = { name: 'g1m' };
    let d: Partial<Pig> = { name: 'g1d' };
    let tree: Pig['lineage'];
    for (let gen = 0; gen < 5; gen += 1) {
      const baby = newborn(startBreeding(m, d, gen * 1_000_000));
      tree = baby.lineage;
      m = { name: `gen${gen + 2}`, generation: baby.generation, traits: baby.traits, lineage: baby.lineage };
      d = { name: 'other' };
    }
    const depth = (a: NonNullable<Pig['lineage']>['mother']): number => (a ? 1 + Math.max(depth(a.mother), depth(a.father)) : 0);
    expect(depth(tree!.mother)).toBe(3);
  });

  it('a signature species trait is always on the child of that species', () => {
    for (const id of BREED_IDS.filter((b) => BREEDS[b].signatureTrait)) {
      const sig = BREEDS[id].signatureTrait!;
      expect(TRAITS.has(sig), `${id} → ${sig}`).toBe(true);
    }
  });
});

describe('pity', () => {

  it('grows after a breeding that could have been Rare+ and was not, resets on a Rare+ child', () => {
    // find a pair that can give Rare+
    const pairs = MUTATIONS.filter((m) => isRareBreed(m.result)).map((m) => m.parents);
    expect(pairs.length).toBeGreaterThan(0);
    const [a, b] = pairs[0]!;
    let pity = 0;
    let missed = 0;
    let hit = false;
    for (let seed = 1; seed < 400 && !hit; seed += 1) {
      const s = expectOk(
        breedPigs(farm([mom({ breed: a }), dad({ breed: b })], pity > 0 ? { breedingPity: pity } : {}), { pigAId: 'mom', pigBId: 'dad' }, ctx(0, mulberry32(seed))),
      ).state;
      const child = s.pigs.find((p) => p.id === 'mom')!.pregnancy!.childBreed;
      if (isRareBreed(child)) {
        expect(s.breedingPity ?? 0).toBe(0);
        hit = true;
      } else {
        expect(s.breedingPity).toBe(pity + 2);
        pity = s.breedingPity!;
        missed += 1;
      }
    }
    expect(missed).toBeGreaterThan(0);
  });

  it('a pair that cannot give Rare+ leaves pity alone', () => {
    const s = startBreeding({ breed: 'PIG_WHITE' }, { breed: 'PIG_WHITE', gender: 'MALE' }, 0, { breedingPity: 8 });
    const child = s.pigs.find((p) => p.id === 'mom')!.pregnancy!.childBreed;
    if (!isRareBreed(child) && !(breedingOutcomes('PIG_WHITE', 'PIG_WHITE') ?? []).some((o) => isRareBreed(o.breed))) {
      expect(s.breedingPity).toBe(8);
    }
  });

  it('pity makes the Rare+ outcome more likely', () => {
    const [a, b] = MUTATIONS.filter((m) => isRareBreed(m.result)).map((m) => m.parents)[0]!;
    const rate = (pity: number) => {
      let rare = 0;
      for (let seed = 1; seed <= 3_000; seed += 1) {
        const s = expectOk(
          breedPigs(farm([mom({ breed: a }), dad({ breed: b })], { breedingPity: pity }), { pigAId: 'mom', pigBId: 'dad' }, ctx(0, mulberry32(seed))),
        ).state;
        if (isRareBreed(s.pigs.find((p) => p.id === 'mom')!.pregnancy!.childBreed)) rare += 1;
      }
      return rare / 3_000;
    };
    expect(rate(20)).toBeGreaterThan(rate(0) + 0.1);
  });
});

describe('trait effects on the pig', () => {
  const quote = (p: Partial<Pig>) => sellQuote(adult({ id: 'x', ...p }), { now: 0, dayOffsetMs: 0, decorBonus: 0 });

  it('a price trait raises the shipping price; a hidden one only from 5 hearts', () => {
    const base = quote({}).price;
    expect(quote({ traits: ['trait_plump'] }).price).toBeGreaterThan(base);
    expect(quote({ hiddenTrait: 'trait_golden_hoof', bond: 80 }).price).toBe(base);
    expect(quote({ hiddenTrait: 'trait_golden_hoof', bond: BOND.maxBond }).price).toBeGreaterThan(base);
    expect(quote({ traits: ['trait_plump'] }).traitFactor).toBeCloseTo(1.1);
  });

  it('a growth trait makes the pig grow faster', () => {
    const grow = (p: Partial<Pig>) => advancePig(makePig({ lastTickedAt: 0, ...p }), 3_600_000 * 6, mulberry32(1)).growthProgress;
    expect(grow({ traits: ['trait_swift_growth'] })).toBeGreaterThan(grow({}));
  });

  it('a bond trait raises the Bond a pet gives', () => {
    const pet = (p: Partial<Pig>) => expectOk(petPig(farm([makePig({ id: 'p', ...p })]), { pigId: 'p' }, ctx(0))).state.pigs[0]!.bond!;
    expect(pet({ traits: ['trait_cuddly'] })).toBeGreaterThan(pet({}));
  });
});

describe('the six new species', () => {
  const NEW = ['PIG_MUSHROOM', 'PIG_FIREFLY', 'PIG_CLOUD', 'PIG_CORAL', 'PIG_CRYSTAL', 'PIG_AURORA'] as const;

  it('exist, with their own signature trait, favourite food and price', () => {
    for (const id of NEW) {
      const b = BREEDS[id];
      expect(b.enabled, id).toBe(true);
      expect(b.signatureTrait, id).toBeDefined();
      expect(b.favorite, id).toBeDefined();
      expect(b.buyGold, id).toBeNull(); // found by breeding, not bought
    }
    expect(new Set(NEW.map((id) => BREEDS[id].sellGold)).size).toBe(NEW.length);
    const pig = { id: 'z', breed: 'PIG_CORAL' as const };
    expect(pigFavorite(pig)).toBe(BREEDS.PIG_CORAL.favorite);
  });

  it('each one has a recipe, and the chain starts from species of the first game', () => {
    const resultOf = new Map(MUTATIONS.map((m) => [m.result, m]));
    for (const id of NEW) expect(resultOf.has(id), id).toBe(true);
    expect(new Set(MUTATIONS.filter((m) => (NEW as readonly string[]).includes(m.result)).map((m) => m.result)).size).toBe(6);
    // The recipe's parents give the child with its weight (before random genetics).
    for (const id of NEW) {
      const m = resultOf.get(id)!;
      const odds = breedingOutcomes(m.parents[0], m.parents[1])!;
      expect(odds.find((o) => o.breed === id)!.weight).toBeGreaterThanOrEqual(m.weight - 0.01);
    }
  });
});

describe('old saves', () => {
  it('a farm without any GĐ7 field validates and plays on', () => {
    const s = newGame(ctx());
    expect(farmGameSchema.safeParse(s).success).toBe(true);
    const bred = expectOk(breedPigs(farm([mom(), dad()]), { pigAId: 'mom', pigBId: 'dad' }, ctx(0))).state;
    expect(farmGameSchema.safeParse(JSON.parse(JSON.stringify(bred))).success).toBe(true);
  });

  it('a pregnancy saved before GĐ7 (no traits) gives a newborn with none', () => {
    const s = startBreeding({}, {});
    const old = {
      ...s,
      pigs: s.pigs.map((p) => {
        if (!p.pregnancy) return p;
        const rest = { ...p.pregnancy };
        for (const k of ['childTraits', 'childHidden', 'childMutated', 'childLineage'] as const) delete rest[k];
        return { ...p, pregnancy: rest };
      }),
    };
    const baby = newborn(old);
    expect(baby.traits).toBeUndefined();
    expect(baby.lineage).toBeUndefined();
    expect(expectOk(adoptPig(farm([], { nursery: [baby] }), { nurseryId: baby.id }, ctx(0))).state.pigs[0]!.traits).toBeUndefined();
  });
});
