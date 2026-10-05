// BR-1: breeding result → nursery (inventory) → raised onto the farm only when the player says so.
import { describe, expect, it } from 'vitest';
import { adoptPig } from '../../src/areas/farm/logic/actions/adoptPig';
import { BALANCE } from '../../src/core/config/balance';
import type { NurseryPig, Pig, FarmGame } from '../../src/areas/farm/logic/types';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const baby: NurseryPig = {
  id: 'baby',
  breed: 'PIG_PANDA',
  name: 'Bông',
  gender: 'FEMALE',
  generation: 3,
  bornAt: 500,
  parents: { motherId: 'mom', fatherId: 'dad', motherBreed: 'PIG_WHITE', fatherBreed: 'PIG_BLACK' },
};
const withBaby = (pigs: Pig[]): FarmGame => ({ ...farm(pigs), nursery: [baby] });
const adopt = (id = 'baby') => (s: FarmGame) => adoptPig(s, { nurseryId: id }, ctx(10_000));

describe('adoptPig (BR-1)', () => {
  it('moves the newborn onto the farm as a baby, keeping id, name, generation and parents', () => {
    const r = expectOk(adopt()(withBaby([makePig({ id: 'a', slotIndex: 0 })])));
    expect(r.state.nursery).toEqual([]);
    const pig = r.state.pigs.find((p) => p.id === 'baby')!;
    expect(pig).toMatchObject({
      breed: 'PIG_PANDA',
      name: 'Bông',
      gender: 'FEMALE',
      slotIndex: 1,
      growthProgress: 0,
      hunger: BALANCE.HUNGER_MAX,
      cleanliness: BALANCE.CLEAN_MAX,
      generation: 3,
      parents: baby.parents,
      createdAt: 10_000,
      lastTickedAt: 10_000,
    });
    expect(r.events).toContainEqual({ type: 'PIG_ADOPTED', pigId: 'baby', breed: 'PIG_PANDA' });
  });

  it('farm full: NO_PIG_SLOT and the newborn stays in the nursery (never lost)', () => {
    const full = withBaby([0, 1, 2, 3].map((i) => makePig({ id: `p${i}`, slotIndex: i })));
    expectError(adopt(), full, 'NO_PIG_SLOT');
    expect(full.nursery).toEqual([baby]);
  });

  it('unknown nursery id: PIG_NOT_FOUND', () => {
    expectError(adopt('nope'), withBaby([]), 'PIG_NOT_FOUND');
  });
});
