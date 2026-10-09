import type { Pig, FarmGame } from '../../src/areas/farm/logic/types';

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
    inventory: { FOOD_BASIC: 10, MEDICINE_COMMON: 1, item_manure: 0 },
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
