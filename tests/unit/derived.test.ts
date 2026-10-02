import { describe, expect, it } from 'vitest';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { freeSlots, growthStage, level, waitingPigs, weight } from '../../src/core/engine/derived';
import { happiness } from '../../src/core/engine/happiness';
import { sellPrice } from '../../src/core/engine/pricing';
import { makePig } from './pigFactory';

describe('happiness (§5.4)', () => {
  it('weights cleanliness 0.55 and hunger 0.45, rounded', () => {
    expect(happiness({ cleanliness: 100, hunger: 100, isSick: false })).toBe(100);
    expect(happiness({ cleanliness: 0, hunger: 0, isSick: false })).toBe(0);
    expect(happiness({ cleanliness: 80, hunger: 40, isSick: false })).toBe(62); // 44 + 18
    expect(happiness({ cleanliness: 51, hunger: 50, isSick: false })).toBe(51); // 50.55 → 51
  });

  it('sickness subtracts 40 and clamps at 0', () => {
    expect(happiness({ cleanliness: 100, hunger: 100, isSick: true })).toBe(60);
    expect(happiness({ cleanliness: 20, hunger: 20, isSick: true })).toBe(0);
  });
});

describe('sellPrice (§5.4, §6.4 table)', () => {
  it('PINK sells for 840 / 1,140 / 1,440 at happiness 0 / 50 / 100', () => {
    expect(sellPrice(makePig({ cleanliness: 0, hunger: 0 }))).toBe(840);
    expect(sellPrice(makePig({ cleanliness: 50, hunger: 50 }))).toBe(1140);
    expect(sellPrice(makePig({ cleanliness: 100, hunger: 100 }))).toBe(1440);
  });

  it('matches exact integer arithmetic for every breed and happiness 0..100', () => {
    for (const breed of BREED_IDS) {
      for (let h = 0; h <= 100; h++) {
        const exact = Math.floor((BREEDS[breed].sellGold * (7000 + 50 * h)) / 10000);
        expect(sellPrice(makePig({ breed, cleanliness: h, hunger: h }))).toBe(exact);
      }
    }
  });
});

describe('growthStage (D3)', () => {
  it.each([
    [0, 'BABY'],
    [29.999, 'BABY'],
    [30, 'YOUNG'],
    [99.999, 'YOUNG'],
    [100, 'ADULT'],
  ])('progress %s → %s', (p, stage) => {
    expect(growthStage(p)).toBe(stage);
  });
});

describe('weight, level, freeSlots', () => {
  it('weight goes 1 kg → maxWeight', () => {
    expect(weight(makePig({ growthProgress: 0 }))).toBe(1);
    expect(weight(makePig({ growthProgress: 100 }))).toBe(50);
  });

  it('level derives from xp', () => {
    expect(level({ player: { gold: 0, xp: 250, unlockedSlots: 4 } })).toBe(3);
  });

  it('a pregnancy holds no slot; waiting = nursery + unborn (BR-1)', () => {
    const pregnancy = {
      startedAt: 0,
      endsAt: 1,
      fatherId: 'pig-2',
      childBreed: 'PIG_EARTH_PINK' as const,
      childGender: 'MALE' as const,
    };
    const state = {
      player: { gold: 0, xp: 0, unlockedSlots: 4, ownedSkins: [] },
      pigs: [makePig({ pregnancy }), makePig({ id: 'pig-2', slotIndex: 1 })],
    };
    expect(freeSlots(state)).toBe(2);
    expect(waitingPigs({ ...state, nursery: [] })).toBe(1);
  });
});
