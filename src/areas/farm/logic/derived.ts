// Derived values that are never stored (spec §5.4). Happiness and price live in their own modules.
import { displayWeight, growthStage as creatureGrowthStage } from '../../../systems/creature/growth';
import { BALANCE } from './config/balance';
import { BREEDS } from './config/breeds';
import { levelFromXp } from './config/levels';
import type { GrowthStage, Pig, FarmGame } from './types';

/** D3: BABY < STAGE_YOUNG_AT <= YOUNG < 100 = ADULT (systems/creature). */
export const growthStage = (growthProgress: number): GrowthStage =>
  creatureGrowthStage(growthProgress, BALANCE.STAGE_YOUNG_AT);

/** Display-only weight in kg. */
export const weight = (pig: Pick<Pig, 'breed' | 'growthProgress'>): number =>
  displayWeight(pig.growthProgress, BREEDS[pig.breed].maxWeight);

/** D13: level is derived from xp. */
export const level = (state: Pick<FarmGame, 'player'>): number => levelFromXp(state.player.xp);

/**
 * Max pigs on the farm (capacity, PS-1): the pen slots the player unlocked (start slots + slot
 * upgrades, spec §8). The one place to add any future capacity source (building, bonus).
 */
export function pigCapacity(state: Pick<FarmGame, 'player'>): number {
  return state.player.unlockedSlots;
}

/**
 * Newborns waiting in the nursery plus unborn ones (BR-1). They hold no pen slot: a child joins
 * the farm only when the player raises it (adoptPig), which needs a free slot then.
 */
export function waitingPigs(state: Pick<FarmGame, 'pigs' | 'nursery'>): number {
  return state.nursery.length + state.pigs.filter((p) => p.pregnancy !== null).length;
}

/** free = capacity − pigs (BR-1 replaces D8's reservation). Every action that adds a pig needs 1. */
export function freeSlots(state: Pick<FarmGame, 'player' | 'pigs'>): number {
  return pigCapacity(state) - state.pigs.length;
}

/** Generation of a pig (PS-2): starters and shop pigs are 1; saves before PS-2 omit it. */
export const generationOf = (pig: Pick<Pig, 'generation'>): number => pig.generation ?? 1;
