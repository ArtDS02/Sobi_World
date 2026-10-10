// Bond, favourite food, snack mood and what a pig is raised for (GĐ6, GAME_BALANCE §3, spec V2 §7).
import { describe, expect, it } from 'vitest';
import { breedingError } from '../../src/areas/farm/logic/actions/breedPigs';
import { feedPig } from '../../src/areas/farm/logic/actions/feedPig';
import { petPig } from '../../src/areas/farm/logic/actions/petPig';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { setPurpose } from '../../src/areas/farm/logic/actions/setPurpose';
import { treatPig } from '../../src/areas/farm/logic/actions/treatPig';
import { penMood } from '../../src/areas/farm/logic/decor';
import { advancePig } from '../../src/areas/farm/logic/advancePig';
import { pigFavorite } from '../../src/areas/farm/logic/bond';
import { pigQuality, sellQuote } from '../../src/areas/farm/logic/pricing';
import { BOND } from '../../src/core/config/bond';
import type { ItemId } from '../../src/core/config/ids';
import { DAY_MS } from '../../src/core/clock';
import { mulberry32 } from '../../src/core/rng';
import { favoriteOf, heartsOf, moodBoostOver, petsLeft, raiseBond, withMoodBoost } from '../../src/systems/bond/bond';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';
import { inv } from './stateFactory';

const HOUR = 3_600_000;
const adult = (patch = {}) => makePig({ growthProgress: 60, hunger: 50, ...patch });

describe('bond rules', () => {
  it('five hearts of 20, raised but never past the top or below zero', () => {
    expect([0, 19, 20, 59, 60, 100].map((b) => heartsOf(b, BOND))).toEqual([0, 0, 1, 2, 3, 5]);
    expect(heartsOf(undefined, BOND)).toBe(0);
    expect(raiseBond(98, 5, BOND)).toBe(100);
    expect(raiseBond(undefined, 3, BOND)).toBe(3);
  });

  it('every pig has one favourite from the pool, the same for its whole life', () => {
    const picks = new Set(Array.from({ length: 60 }, (_, i) => favoriteOf(`pig-${i}`, BOND)));
    expect([...picks].every((p) => (BOND.favorites as readonly string[]).includes(p))).toBe(true);
    expect(picks.size).toBeGreaterThan(1); // not one food for everyone
    expect(favoriteOf('pig-7', BOND)).toBe(favoriteOf('pig-7', BOND));
  });

  it('a snack lifts mood for a while; a later one extends it but never lowers a stronger boost', () => {
    const c = withMoodBoost(makePig(), 10, 0, BOND);
    expect(c.moodBoost).toEqual({ amount: 10, until: BOND.moodBoost.hours * HOUR });
    expect(withMoodBoost(c, 3, HOUR, BOND).moodBoost).toEqual({ amount: 10, until: (BOND.moodBoost.hours + 1) * HOUR }); // grass after premium feed
    expect(withMoodBoost(c, 3, 0, BOND)).toBe(c); // nothing new to give
    expect(withMoodBoost(makePig(), 0, 0, BOND).moodBoost).toBeUndefined();
  });

  it('the boost is the share of the span it covers, so slicing time cannot change it', () => {
    const c = withMoodBoost(makePig(), 10, 0, BOND); // 10 points for 3 hours
    expect(moodBoostOver(c, 0, 3 * HOUR)).toBe(10);
    expect(moodBoostOver(c, 0, 6 * HOUR)).toBe(5);
    expect(moodBoostOver(c, 3 * HOUR, 4 * HOUR)).toBe(0);
    // What the boost adds to the life average is the same whether time is one jump or many slices.
    const run = (pig: ReturnType<typeof makePig>, step: number) => {
      let p = { ...pig, growthProgress: 60, hunger: 60, cleanliness: 60 };
      for (let t = step; t <= 6 * HOUR; t += step) p = advancePig(p, t, mulberry32(1));
      return p.moodAvg!;
    };
    const plain = makePig();
    const gainWhole = run(c, 6 * HOUR) - run(plain, 6 * HOUR);
    const gainSliced = run(c, 600_000) - run(plain, 600_000);
    expect(gainWhole).toBeCloseTo(5, 6);
    expect(gainSliced).toBeCloseTo(gainWhole, 6);
  });
});

describe('petPig', () => {
  const day = (n: number) => n * DAY_MS; // a pig left alone for a day or two is hungry but alive

  it('+3 bond, +1 XP, twice a day; the next day it starts over', () => {
    const s = farm([adult()]);
    const first = expectOk(petPig(s, { pigId: 'pig-1' }, ctx(day(0) + HOUR)));
    expect(first.state.pigs[0]!.bond).toBe(3);
    expect(first.state.player.xp).toBe(s.player.xp + 1);
    expect(first.events).toContainEqual({ type: 'PIG_PETTED', pigId: 'pig-1', bond: 3, hearts: 0 });
    const second = expectOk(petPig(first.state, { pigId: 'pig-1' }, ctx(day(0) + 2 * HOUR)));
    expect(second.state.pigs[0]!.bond).toBe(6);
    expectError((x) => petPig(x, { pigId: 'pig-1' }, ctx(day(0) + 3 * HOUR)), second.state, 'PET_LIMIT_REACHED');
    const next = expectOk(petPig(second.state, { pigId: 'pig-1' }, ctx(day(1) + HOUR)));
    expect(next.state.pigs[0]!.bond).toBe(9);
    expect(petsLeft(next.state.pigs[0]!, 0, BOND)).toBe(2); // the count belongs to its day
    expect(petsLeft(next.state.pigs[0]!, 1, BOND)).toBe(1);
  });

  it('a heart is a whole 20 bond; unknown pigs are refused', () => {
    const s = farm([adult({ bond: 18 })]);
    expect(expectOk(petPig(s, { pigId: 'pig-1' }, ctx(HOUR))).events).toContainEqual({ type: 'PIG_PETTED', pigId: 'pig-1', bond: 21, hearts: 1 });
    expectError((x) => petPig(x, { pigId: 'nope' }, ctx()), s, 'PIG_NOT_FOUND');
  });
});

describe('feeding', () => {
  const lovedBy = (pig = makePig({ hunger: 40 })): ItemId => pigFavorite(pig);

  it('the favourite crop gives +20 hunger and +2 bond; another crop is not feed', () => {
    const pig = adult({ hunger: 40 });
    const food = lovedBy(pig);
    const other = (['item_carrot', 'item_corn', 'item_wheat', 'item_potato'] as ItemId[]).find((i) => i !== food)!;
    const s = farm([pig], { inventory: inv({ [food]: 2, [other]: 2 }) });
    const r = expectOk(feedPig(s, { pigId: 'pig-1', itemId: food }, ctx()));
    expect(r.state.pigs[0]).toMatchObject({ hunger: 60, bond: 2 });
    expect(r.state.inventory[food]).toBe(1);
    expect(r.events).toContainEqual({ type: 'PIG_FED', pigId: 'pig-1', itemId: food, favorite: true });
    expectError((x) => feedPig(x, { pigId: 'pig-1', itemId: other }, ctx()), s, 'INVALID_REQUEST');
  });

  it('the favourite needs one in the bag; plain food never gives bond', () => {
    const pig = adult({ hunger: 40 });
    expectError((x) => feedPig(x, { pigId: 'pig-1', itemId: lovedBy(pig) }, ctx()), farm([pig]), 'INSUFFICIENT_ITEM');
    expect(expectOk(feedPig(farm([pig]), { pigId: 'pig-1' }, ctx())).state.pigs[0]!.bond).toBeUndefined();
  });

  it('premium feed lifts mood +10 and grass +3 for 3 hours', () => {
    const s = farm([adult({ hunger: 10 })], { inventory: inv({ FOOD_PREMIUM: 1, item_grass: 1 }) });
    const premium = expectOk(feedPig(s, { pigId: 'pig-1', itemId: 'FOOD_PREMIUM' }, ctx(HOUR)));
    expect(premium.state.pigs[0]!.moodBoost).toEqual({ amount: 10, until: 4 * HOUR });
    const grass = expectOk(feedPig(s, { pigId: 'pig-1', itemId: 'item_grass' }, ctx(HOUR)));
    expect(grass.state.pigs[0]!.moodBoost).toEqual({ amount: 3, until: 4 * HOUR });
  });
});

describe('nursing', () => {
  it('giving the medicine to a sick pig adds 5 bond', () => {
    const s = farm([adult({ isSick: true, bond: 10, lastSickAt: 0 })]);
    expect(expectOk(treatPig(s, { pigId: 'pig-1' }, ctx(1000))).state.pigs[0]!.bond).toBe(15);
  });
});

describe('purpose', () => {
  it('is chosen from Adult on, changeable, and Adventure waits for GĐ10', () => {
    const young = farm([makePig({ growthProgress: 20 })]);
    expectError((x) => setPurpose(x, { pigId: 'pig-1', purpose: 'SHIP' }, ctx()), young, 'PIG_NOT_MATURE');
    const s = farm([adult()]);
    expectError((x) => setPurpose(x, { pigId: 'pig-1', purpose: 'ADVENTURE' }, ctx()), s, 'PURPOSE_LOCKED');
    const ship = expectOk(setPurpose(s, { pigId: 'pig-1', purpose: 'SHIP' }, ctx()));
    expect(ship.state.pigs[0]!.purpose).toBe('SHIP');
    expectError((x) => setPurpose(x, { pigId: 'pig-1', purpose: 'SHIP' }, ctx()), ship.state, 'NOTHING_TO_DO');
    expect(expectOk(setPurpose(ship.state, { pigId: 'pig-1', purpose: 'BREED' }, ctx())).state.pigs[0]!.purpose).toBe('BREED');
  });

  it('a pet is not shipped and not bred', () => {
    const pet = adult({ purpose: 'PET' as const, growthProgress: 100 });
    const s = farm([pet]);
    expectError((x) => sellPig(x, { pigId: 'pig-1' }, ctx()), s, 'PIG_IS_PET');
    const mate = makePig({ id: 'pig-2', slotIndex: 1, gender: 'MALE', growthProgress: 100 });
    expect(breedingError(farm([pet, mate]), pet, mate)).toBe('PIG_IS_PET');
  });

  it('every pet lifts the mood of the whole pen by 1, up to 5', () => {
    const pets = (n: number) => farm(Array.from({ length: n }, (_, i) => adult({ id: `p${i}`, slotIndex: i, purpose: 'PET' as const })), { decor: [] });
    expect(penMood(pets(0))).toBe(0);
    expect(penMood(pets(3))).toBe(3);
    expect(penMood({ ...pets(4), decor: ['DECOR_HAY_BALE'] })).toBe(5); // 4 pets + 1 decoration
    expect(penMood({ ...pets(4), pigs: [...pets(4).pigs, ...pets(4).pigs.map((p) => ({ ...p, id: `${p.id}b` }))] })).toBe(5); // capped
  });
});

describe('quality and bond', () => {
  const ready = (id: string, bond: number) => makePig({ id, growthProgress: 100, bond, hunger: 100, cleanliness: 100, moodAvg: 70, moodSec: 1000 });

  it('below 3 hearts nothing changes; the lift from 3 hearts is fixed per pig and never above Perfect', () => {
    expect(pigQuality(ready('a', 59))).toBe('GREAT');
    const results = Array.from({ length: 200 }, (_, i) => pigQuality(ready(`pig-${i}`, 60)));
    const lifted = results.filter((q) => q === 'EXCELLENT').length;
    expect(results.every((q) => q === 'GREAT' || q === 'EXCELLENT')).toBe(true);
    expect(lifted / 200).toBeGreaterThan(0.1);
    expect(lifted / 200).toBeLessThan(0.3); // 20 %
    expect(pigQuality(ready('pig-1', 60))).toBe(pigQuality(ready('pig-1', 100))); // same pig, same answer
    expect(pigQuality({ ...ready('x', 100), moodAvg: 99 })).toBe('PERFECT');
  });

  it('the quote and the sale agree, and the quote says when bond lifted the tier', () => {
    const lifted = Array.from({ length: 200 }, (_, i) => ready(`pig-${i}`, 100)).find((p) => pigQuality(p) === 'EXCELLENT')!;
    const quote = sellQuote(lifted, { now: 0, dayOffsetMs: 0, decorBonus: 0 });
    expect(quote.bondLift).toBe(true);
    expect(quote.quality).toBe('EXCELLENT');
    const sold = expectOk(sellPig(farm([{ ...lifted, slotIndex: 0 }]), { pigId: lifted.id }, ctx()));
    expect(sold.events).toContainEqual({ type: 'PIG_SOLD', pigId: lifted.id, gold: sellQuote(lifted, { now: 0, dayOffsetMs: 0, decorBonus: 0 }).price });
  });
});
