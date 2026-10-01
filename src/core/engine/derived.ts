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

/** D8: a pregnancy reserves a slot for the unborn child. */
export function freeSlots(state: Pick<SaveGame, 'player' | 'pigs'>): number {
  const pregnant = state.pigs.filter((p) => p.pregnancy !== null).length;
  return state.player.unlockedSlots - state.pigs.length - pregnant;
}
