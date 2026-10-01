import type { Pig } from '../../src/core/types';

/** §14.1 baseline: PINK baby, progress 0, hunger 100, cleanliness 100, ticked at t=0. */
export function makePig(overrides: Partial<Pig> = {}): Pig {
  return {
    id: 'pig-1',
    slotIndex: 0,
    breed: 'PIG_EARTH_PINK',
    skinId: 'pig_classic',
    cosmetics: {},
    name: 'Ủn Hồng',
    gender: 'FEMALE',
    growthProgress: 0,
    hunger: 100,
    cleanliness: 100,
    isSick: false,
    pregnancy: null,
    lastTickedAt: 0,
    createdAt: 0,
    ...overrides,
  };
}
