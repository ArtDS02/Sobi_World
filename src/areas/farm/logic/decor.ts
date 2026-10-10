// Decoration bonus (spec §5.4 decorBonus, DECISIONS PG-3). Derived, never stored.
import { petBonus } from './bond';
import { DECORS } from './config/decor';
import type { FarmGame } from './types';

/** Happiness points every pig gets from the farm's owned decorations. */
export const decorBonus = (state: Pick<FarmGame, 'decor'>): number =>
  state.decor.reduce((n, id) => n + DECORS[id].happyBonus, 0);

/** Everything that lifts the mood of the whole pen: decorations and pets (GAME_BALANCE, spec V2 §7, §9). */
export const penMood = (state: Pick<FarmGame, 'decor' | 'pigs'>): number => decorBonus(state) + petBonus(state);
