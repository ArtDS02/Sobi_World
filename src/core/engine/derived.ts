// Derived values that are never stored (spec §5.4). Happiness and price live in their own modules.
import { BALANCE } from '../config/balance';
import { BREEDS } from '../config/breeds';
import { levelFromXp } from '../config/levels';
import type { GrowthStage, Pig, SaveGame } from '../types';

/** D3: BABY < 30 <= YOUNG < 100 = ADULT. */
export function growthStage(growthProgress: number): GrowthStage {
  if (growthProgress >= 100) return 'ADULT';
  return growthProgress >= BALANCE.STAGE_YOUNG_AT ? 'YOUNG' : 'BABY';
}

/** Display-only weight in kg. */
export function weight(pig: Pick<Pig, 'breed' | 'growthProgress'>): number {
  return 1 + ((BREEDS[pig.breed].maxWeight - 1) * pig.growthProgress) / 100;
}

/** D13: level is derived from xp. */
export const level = (state: Pick<SaveGame, 'player'>): number => levelFromXp(state.player.xp);

/**
 * Max pigs on the farm (capacity, PS-1): the pen slots the player unlocked (start slots + slot
 * upgrades, spec §8). The one place to add any future capacity source (building, bonus).
 */
export function pigCapacity(state: Pick<SaveGame, 'player'>): number {
  return state.player.unlockedSlots;
}

/** Slots held for unborn children (D8: a pregnancy reserves one). */
export function reservedSlots(state: Pick<SaveGame, 'pigs'>): number {
  return state.pigs.filter((p) => p.pregnancy !== null).length;
}

/** D8: free = capacity − pigs − reserved. Every action that adds a pig needs at least 1. */
export function freeSlots(state: Pick<SaveGame, 'player' | 'pigs'>): number {
  return pigCapacity(state) - state.pigs.length - reservedSlots(state);
}

/** Generation of a pig (PS-2): starters and shop pigs are 1; saves before PS-2 omit it. */
export const generationOf = (pig: Pick<Pig, 'generation'>): number => pig.generation ?? 1;
