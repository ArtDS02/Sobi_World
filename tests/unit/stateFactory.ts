import type { Pig, FarmGame, ItemId } from '../../src/areas/farm/logic/types';
import { ITEM_ID_VALUES } from '../../src/core/config/ids';

/** A full bag view: every item at 0 except those given (items are added to content over time). */
export const inv = (items: Partial<Record<ItemId, number>> = {}): Record<ItemId, number> =>
  ({ ...Object.fromEntries(ITEM_ID_VALUES.map((id) => [id, 0])), ...items }) as Record<ItemId, number>;

/** Minimal valid save at t=0 with the given pigs and trough food. */
export function makeState(pigs: Pig[] = [], troughFood = 0): FarmGame {
  return {
    schemaVersion: 7,
    createdAt: 0,
    updatedAt: 0,
    player: {
      gold: 5000,
      xp: 0,
      unlockedSlots: 4,
    },
    pigs,
    nursery: [],
    trough: { food: troughFood, capacity: 20, lastResolvedAt: 0 },
    inventory: inv({ FOOD_BASIC: 10, MEDICINE_COMMON: 1 }),
    orders: [],
    collection: { discoveredBreeds: [] },
    transactions: [],
    breedingRecords: [],
    gifts: { nextAt: null, boxes: [] },
    progress: { stats: {}, claimed: {}, daily: { lastDay: null, streak: 0 } },
    decor: [],
    settings: {
      musicOn: true,
      sfxOn: true,
      reduceMotion: false,
      tutorialDone: false,
      lastExportAt: null,
    },
  };
}
