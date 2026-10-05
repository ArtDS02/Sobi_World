// Spec §14.4 breeding tests (§6.5, §8.8, §8.9, D8, D22).
import { describe, expect, it } from 'vitest';
import { breedPigs } from '../../src/areas/farm/logic/actions/breedPigs';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { BREEDS } from '../../src/core/config/breeds';
import type { BreedId } from '../../src/core/config/ids';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { rollChild } from '../../src/areas/farm/logic/breeding';
import { breedingOutcomes } from '../../src/areas/farm/logic/breedingOdds';
import { freeSlots } from '../../src/areas/farm/logic/derived';
import { mulberry32, sequenceRng } from '../../src/core/rng';
import type { Pig, SaveGame } from '../../src/core/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';
import type { NurseryPig } from '../../src/core/types';

const nurseryPig = (id: string): NurseryPig => ({
  id,
  breed: 'PIG_EARTH_PINK',
  name: id,
  gender: 'MALE',
  generation: 2,
  bornAt: 0,
  parents: { motherId: 'm', fatherId: 'f', motherBreed: 'PIG_EARTH_PINK', fatherBreed: 'PIG_EARTH_PINK' },
});

const SEC = 1000;
const adult = (o: Partial<Pig>) => makePig({ growthProgress: 100, ...o });
const mom = (o: Partial<Pig> = {}) => adult({ id: 'mom', slotIndex: 0, gender: 'FEMALE', ...o });
const dad = (o: Partial<Pig> = {}) => adult({ id: 'dad', slotIndex: 1, gender: 'MALE', ...o });
const pair = (m: Partial<Pig> = {}, d: Partial<Pig> = {}, patch: Partial<SaveGame> = {}) =>
  farm([mom(m), dad(d)], patch);
const breed =
  (a = 'mom', b = 'dad') =>
  (s: SaveGame) =>
    breedPigs(s, { pigAId: a, pigBId: b }, ctx(0));

/** Bred at t=0, pregnancy fixed by `rng`. */
function bred(m: Partial<Pig> = {}, d: Partial<Pig> = {}, rng = mulberry32(3)): SaveGame {
  return expectOk(breedPigs(pair(m, d), { pigAId: 'dad', pigBId: 'mom' }, ctx(0, rng))).state;
}
const mother = (s: SaveGame) => s.pigs.find((p) => p.id === 'mom')!;

describe('breeding outcome (§6.5 as rules, U00-1 D4)', () => {
  it('A+B resolves like B+A', () => {
    const a = rollChild(sequenceRng([0.97, 0.2]), 'PIG_EARTH_PINK', 'PIG_STRIPED_MELON');
    const b = rollChild(sequenceRng([0.97, 0.2]), 'PIG_STRIPED_MELON', 'PIG_EARTH_PINK');
    expect(a).toEqual(b);
  });

  it('seeded 10,000-sample distribution within 1.5 points of every weight', () => {
    const rng = mulberry32(2024);
    const pairs: [BreedId, BreedId][] = [
      ['PIG_EARTH_PINK', 'PIG_EARTH_PINK'],
      ['PIG_WHITE', 'PIG_BLACK'],
      ['PIG_BOAR', 'PIG_BROWN'],
      ['PIG_KOI', 'PIG_DRAGONLING'],
    ];
    for (const [x, y] of pairs) {
      const counts = new Map<BreedId, number>();
      let males = 0;
      for (let i = 0; i < 10_000; i++) {
        const c = rollChild(rng, x, y);
        counts.set(c.breed, (counts.get(c.breed) ?? 0) + 1);
        if (c.gender === 'MALE') males += 1;
      }
      for (const o of breedingOutcomes(x, y)!)
        expect(Math.abs((counts.get(o.breed) ?? 0) / 100 - o.weight)).toBeLessThan(1.5);
      expect(Math.abs(males / 100 - 50)).toBeLessThan(1.5);
    }
  });
});

describe('breedPigs validation (§8.8) — right error, no state change', () => {
  it('same pig, missing pig, same gender → INVALID_BREEDING_PARTNERS', () => {
    expectError(breed('mom', 'mom'), pair(), 'INVALID_BREEDING_PARTNERS');
    expectError(breed('mom', 'nope'), pair(), 'INVALID_BREEDING_PARTNERS');
    expectError(breed(), pair({}, { gender: 'FEMALE' }), 'INVALID_BREEDING_PARTNERS');
  });

  it('immature, sick, pregnant', () => {
    expectError(breed(), pair({ growthProgress: 99 }), 'PIG_NOT_MATURE');
    expectError(breed(), pair({}, { isSick: true }), 'PIG_IS_SICK');
    const pregnancy = {
      startedAt: 0,
      endsAt: 999 * SEC,
      fatherId: 'x',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    expectError(breed(), pair({ pregnancy }), 'PIG_IS_PREGNANT');
  });

  it('MYTHICAL and undefined combinations → BREEDING_COMBINATION_NOT_SUPPORTED', () => {
    expectError(breed(), pair({ breed: 'PIG_MYTHICAL' }), 'BREEDING_COMBINATION_NOT_SUPPORTED');
    expectError(breed(), pair({}, { breed: 'PIG_MYTHICAL' }), 'BREEDING_COMBINATION_NOT_SUPPORTED');
  });

  it('full farm still breeds (BR-1: the child waits in the nursery); nursery cap; gold', () => {
    const full = farm([
      mom(),
      dad(),
      adult({ id: 'c', slotIndex: 2 }),
      adult({ id: 'd', slotIndex: 3 }),
    ]);
    expectOk(breed()(full));
    const crowded = { ...pair(), nursery: Array.from({ length: 12 }, (_, i) => nurseryPig(`n${i}`)) };
    expectError(breed(), crowded, 'NURSERY_FULL');
    const poor = pair();
    expectError(breed(), { ...poor, player: { ...poor.player, gold: 199 } }, 'INSUFFICIENT_GOLD');
  });

  it('checks run in the spec order (immature before sick before pregnant)', () => {
    expectError(breed(), pair({ growthProgress: 50, isSick: true }), 'PIG_NOT_MATURE');
  });
});

describe('breedPigs effect (§8.8)', () => {
  it('fee, XP, female pregnant with D22 time, record, event; male free to breed again', () => {
    const s = pair();
    const r = expectOk(breedPigs(s, { pigAId: 'dad', pigBId: 'mom' }, ctx(10 * SEC)));
    expect(r.state.player.gold).toBe(s.player.gold - 200);
    expect(r.state.player.xp).toBe(15);
    expect(r.state.transactions[0]).toMatchObject({ type: 'BREEDING_FEE', amount: -200 });
    const p = mother(r.state).pregnancy!;
    expect(p).toMatchObject({
      startedAt: 10 * SEC,
      endsAt: 10 * SEC + 3600 * SEC,
      fatherId: 'dad',
    });
    expect(r.state.pigs.find((x) => x.id === 'dad')!.pregnancy).toBeNull();
    expect(r.state.breedingRecords[0]).toMatchObject({
      motherId: 'mom',
      fatherId: 'dad',
      childBreed: p.childBreed,
      childGender: p.childGender,
      bornAt: null,
    });
    expect(r.events[0]).toEqual({
      type: 'BREEDING_STARTED',
      motherId: 'mom',
      fatherId: 'dad',
      endsAt: p.endsAt,
    });
  });

  it.each([
    ['PIG_EARTH_PINK', 3600],
    ['PIG_STRIPED_MELON', 5400],
    ['PIG_SUPERMAN', 10800],
  ] as const)('pregnancy length follows the mother breed (D22): %s', (b, sec) => {
    expect(BREEDS[b].pregnancySec).toBe(sec);
    expect(mother(bred({ breed: b }, { breed: 'PIG_SUPERMAN' })).pregnancy!.endsAt).toBe(sec * SEC);
  });
});

describe('birth (§8.9)', () => {
  it('the child is fixed at breeding time: another rng later changes nothing', () => {
    const s = bred();
    const p = mother(s).pregnancy!;
    for (const seed of [1, 2, 3]) {
      const w = advanceWorld(s, p.endsAt, mulberry32(seed));
      const child = w.state.nursery[0]!;
      expect([child.breed, child.gender]).toEqual([p.childBreed, p.childGender]);
    }
  });

  it('endsAt − 1 s: nothing; endsAt: exactly one child; again: still one', () => {
    const s = bred();
    const endsAt = mother(s).pregnancy!.endsAt;
    const early = advanceWorld(s, endsAt - SEC, mulberry32(1));
    expect(early.state.pigs).toHaveLength(2);
    expect(early.events.some((e) => e.type === 'BIRTH')).toBe(false);

    const born = advanceWorld(early.state, endsAt, mulberry32(1));
    expect(born.state.pigs).toHaveLength(2); // BR-1: never straight onto the farm
    expect(born.state.nursery).toHaveLength(1);
    expect(born.events.filter((e) => e.type === 'BIRTH')).toHaveLength(1);
    expect(mother(born.state).pregnancy).toBeNull();
    expect(born.state.breedingRecords[0]!.bornAt).toBe(endsAt);

    const again = advanceWorld(born.state, endsAt + SEC, mulberry32(2));
    expect(again.state.nursery).toHaveLength(1);
    expect(again.events.some((e) => e.type === 'BIRTH')).toBe(false);
  });

  it('the newborn is its own pig in the nursery with its genealogy (BR-1)', () => {
    const s = bred();
    const { endsAt, childBreed, childGender } = mother(s).pregnancy!;
    const w = advanceWorld(s, endsAt + 1800 * SEC, mulberry32(1));
    expect(w.state.nursery).toEqual([
      expect.objectContaining({
        breed: childBreed,
        gender: childGender,
        generation: 2,
        bornAt: endsAt,
        parents: { motherId: 'mom', fatherId: 'dad', motherBreed: 'PIG_EARTH_PINK', fatherBreed: 'PIG_EARTH_PINK' },
      }),
    ]);
    expect(w.events.find((e) => e.type === 'BIRTH')).toMatchObject({ childId: w.state.nursery[0]!.id });
  });

  it('birth after 3 days offline works, with a BIRTH event', () => {
    const s = bred();
    const w = advanceWorld(s, 3 * 86400 * SEC, mulberry32(9));
    expect(w.state.nursery).toHaveLength(1);
    expect(w.events.some((e) => e.type === 'BIRTH')).toBe(true);
  });

  it('a new breed from birth is discovered once (DISCOVERY + bonus)', () => {
    const b = bred();
    const m = mother(b);
    const pregnancy = { ...m.pregnancy!, childBreed: 'PIG_STRIPED_MELON' as const };
    const s = { ...b, pigs: b.pigs.map((p) => (p.id === 'mom' ? { ...m, pregnancy } : p)) };
    const w = advanceWorld(s, pregnancy.endsAt, mulberry32(1));
    expect(w.events.map((e) => e.type)).toEqual(expect.arrayContaining(['BIRTH', 'DISCOVERY']));
    expect(w.state.collection.discoveredBreeds).toContain('PIG_STRIPED_MELON');
  });

  it('a pregnancy holds no pen slot; a birth on a full farm still lands in the nursery (BR-1)', () => {
    const s = bred();
    const full = {
      ...s,
      pigs: [...s.pigs, adult({ id: 'x', slotIndex: 2 }), adult({ id: 'y', slotIndex: 3 })],
    };
    expect(freeSlots({ ...s, pigs: [...s.pigs, adult({ id: 'x', slotIndex: 2 })] })).toBe(1);
    expectError(
      (st) => buyPig(st, { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx(0)),
      full,
      'NO_PIG_SLOT',
    );
    const w = advanceWorld(full, mother(s).pregnancy!.endsAt, mulberry32(1));
    expect(w.state.pigs).toHaveLength(4);
    expect(w.state.nursery).toHaveLength(1);
  });
});
