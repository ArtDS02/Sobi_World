import { describe, expect, it } from 'vitest';
import { adoptPig } from '../../src/core/actions/adoptPig';
import { breedPigs } from '../../src/core/actions/breedPigs';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import type { BreedId } from '../../src/core/config/ids';
import { rarityRank } from '../../src/core/config/rarity';
import { SPECIES_TRAITS, TRAIT_VALUES } from '../../src/core/config/speciesTraits';
import { resolveBirths } from '../../src/core/engine/breeding';
import { breedingCoverage } from '../../src/core/engine/breedingCoverage';
import { breedingOutcomes, compatibility, rarityOdds } from '../../src/core/engine/breedingOdds';
import { generationOf } from '../../src/core/engine/derived';
import { parseSave } from '../../src/core/save/migrate';
import { ctx, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const tier = (a: BreedId, b: BreedId) => {
  const odds = rarityOdds(a, b);
  const base = Math.max(rarityRank(BREEDS[a].rarity), rarityRank(BREEDS[b].rarity));
  return (d: number) => odds.get(base + d) ?? 0;
};
const share = (a: BreedId, b: BreedId, pick: (id: BreedId) => boolean) =>
  (breedingOutcomes(a, b) ?? []).filter((o) => pick(o.breed)).reduce((s, o) => s + o.weight, 0);

describe('breeding engine v2 (DECISIONS PS-2)', () => {
  it('same rarity: mostly the same rarity, a real chance one up, a small chance one down', () => {
    const rr = tier('PIG_TIGER', 'PIG_PANDA'); // RARE × RARE
    expect(rr(0)).toBeGreaterThan(65);
    expect(rr(1)).toBeGreaterThan(4); // EPIC
    expect(rr(-1)).toBeGreaterThan(3); // UNCOMMON
    expect(rr(-1)).toBeLessThan(15);
    expect(rr(2)).toBeLessThan(3); // LEGENDARY: very low
    const ee = tier('PIG_KOI', 'PIG_DRAGONLING'); // EPIC × EPIC
    expect(ee(0)).toBeGreaterThan(60);
    expect(ee(1)).toBeGreaterThan(5); // LEGENDARY: meaningful
  });

  it('common × common never gives a legendary or epic; mixed pairs lean to the lower rarity', () => {
    const cc = share('PIG_EARTH_PINK', 'PIG_WHITE', (id) => rarityRank(BREEDS[id].rarity) >= 3);
    expect(cc).toBe(0);
    const cr = tier('PIG_EARTH_PINK', 'PIG_TIGER'); // COMMON × RARE → base RARE
    expect(cr(-2)).toBeGreaterThan(cr(0)); // common more likely than rare
    expect(cr(-1)).toBeGreaterThan(0);
    expect(cr(1)).toBeLessThan(5);
  });

  it('compatibility: own species and recipes high, unrelated far rarities low, always > 0', () => {
    expect(compatibility('PIG_WHITE', 'PIG_WHITE')).toBeGreaterThan(0.7);
    expect(compatibility('PIG_KOI', 'PIG_DRAGONLING')).toBeGreaterThan(
      compatibility('PIG_KOI', 'PIG_ROBOT'),
    );
    for (const a of BREED_IDS)
      for (const b of ['PIG_EARTH_PINK', 'PIG_GALAXY'] as BreedId[]) {
        const c = compatibility(a, b);
        expect(c).toBeGreaterThan(0);
        expect(c).toBeLessThanOrEqual(1);
        expect(c).toBe(compatibility(b, a));
      }
  });

  it('a compatible pair has better odds of a rarer child than an incompatible one', () => {
    const up = (a: BreedId, b: BreedId) => tier(a, b)(1);
    expect(up('PIG_PEGASUS', 'PIG_ZEUS')).toBeGreaterThan(up('PIG_PEGASUS', 'PIG_TURTLE'));
  });

  it('traits steer the child: watermelon × turtle favours green / water pigs', () => {
    const green = (id: BreedId) =>
      (SPECIES_TRAITS[id] ?? []).some((t) => t === 'green' || t === 'water');
    const tail = (a: BreedId, b: BreedId) => share(a, b, (id) => id !== a && id !== b && green(id));
    expect(tail('PIG_STRIPED_MELON', 'PIG_TURTLE')).toBeGreaterThan(tail('PIG_SHEEP', 'PIG_TIGER'));
  });

  it('every trait is known and every species row names a real species', () => {
    for (const [id, traits] of Object.entries(SPECIES_TRAITS)) {
      expect(BREEDS[id as BreedId], id).toBeDefined();
      for (const t of traits) expect(TRAIT_VALUES).toContain(t);
    }
    for (const id of BREED_IDS) expect(SPECIES_TRAITS[id]?.length ?? 0, id).toBeGreaterThan(0);
  });

  it('coverage: every species has a route from the shop; no orphan, invalid rule or bad sum', () => {
    const c = breedingCoverage();
    expect(c.total).toBe(BREED_IDS.length);
    expect(c.breedable).toBe(c.total);
    expect(c.obtainable).toBe(c.total);
    expect(c.orphans).toEqual([]);
    expect(c.weak).toEqual([]);
    expect(c.invalidRules).toEqual([]);
    expect(c.duplicateRules).toEqual([]);
    expect(c.probabilityErrors).toEqual([]);
  });

  it('coverage catches broken data', () => {
    const bad = breedingCoverage(
      [
        { parents: ['PIG_WHITE', 'PIG_BLACK'], result: 'PIG_PANDA', weight: 3 },
        { parents: ['PIG_BLACK', 'PIG_WHITE'], result: 'PIG_PANDA', weight: 2 },
        { parents: ['PIG_MYTHICAL', 'PIG_WHITE'], result: 'PIG_KOI', weight: 0 },
      ],
      [
        {
          id: 'x',
          parents: ['PIG_WHITE', 'PIG_BLACK'],
          outcomes: [{ breed: 'PIG_WHITE', percent: 90 }],
          active: false,
        },
      ],
    );
    expect(bad.duplicateRules).toHaveLength(1);
    expect(bad.invalidRules.length).toBeGreaterThanOrEqual(3); // parent, weight, 90 %
  });
});

describe('generation (PS-2)', () => {
  const adult = (o: Parameters<typeof makePig>[0]) => makePig({ growthProgress: 100, ...o });

  it('child = highest parent generation + 1, kept through birth and a save round trip', () => {
    const mom = adult({ id: 'mom', slotIndex: 0, gender: 'FEMALE', generation: 3 });
    const dad = adult({ id: 'dad', slotIndex: 1, gender: 'MALE' });
    const s = farm([mom, dad]);
    const bred = expectOk(breedPigs(s, { pigAId: 'mom', pigBId: 'dad' }, ctx()));
    const preg = bred.state.pigs.find((p) => p.id === 'mom')!.pregnancy!;
    expect(preg.childGeneration).toBe(4);
    expect(bred.state.breedingRecords[0]!.childGeneration).toBe(4);
    const born = resolveBirths(bred.state, preg.endsAt, ctx().rng).state;
    const child = born.nursery[0]!; // BR-1: the newborn waits in the nursery
    expect(child.generation).toBe(4);
    const round = parseSave(JSON.stringify(born));
    expect(round.ok && round.save.nursery.find((p) => p.id === child.id)?.generation).toBe(4);
    const raised = expectOk(adoptPig(born, { nurseryId: child.id }, ctx(preg.endsAt)));
    expect(generationOf(raised.state.pigs.find((p) => p.id === child.id)!)).toBe(4);
  });

  it('pigs from old saves (no field) count as generation 1', () => {
    expect(generationOf(makePig({}))).toBe(1);
  });
});
