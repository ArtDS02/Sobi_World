import type { Pig, SaveGame } from '../../src/core/types';

/** Minimal valid save at t=0 with the given pigs and trough food. */
export function makeState(pigs: Pig[] = [], troughFood = 0): SaveGame {
  return {
    schemaVersion: 5,
    createdAt: 0,
    updatedAt: 0,
    player: {
      gold: 5000,
      xp: 0,
      unlockedSlots: 4,
    },
    pigs,
    trough: { food: troughFood, capacity: 20, lastResolvedAt: 0 },
    inventory: { FOOD_BASIC: 10, MEDICINE_COMMON: 1 },
    orders: [],
    collection: { discoveredBreeds: [] },
    transactions: [],
    breedingRecords: [],
    gifts: { nextAt: null, boxes: [] },
    settings: {
      musicOn: true,
      sfxOn: true,
      reduceMotion: false,
      tutorialDone: false,
      lastExportAt: null,
    },
  };
}
