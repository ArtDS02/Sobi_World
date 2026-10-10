// Decoration bonus (spec §5.4 decorBonus, DECISIONS PG-3; GĐ6: placed or stored). Derived, never stored.
import { petBonus } from './bond';
import { DECORS } from './config/decor';
import type { DecorId } from './config/ids';
import type { DecorPlan, FarmGame } from './types';

/** Where a decoration stands: absent in the save = placed on its first spot (every decoration owned before GĐ6). */
export const planOf = (state: Pick<FarmGame, 'decorPlan'>, id: DecorId): DecorPlan => state.decorPlan?.[id] ?? { spot: 0, stored: false };

/** The owned decorations that stand on the farm (not in storage). */
export const placedDecor = (state: Pick<FarmGame, 'decor' | 'decorPlan'>): DecorId[] => state.decor.filter((id) => !planOf(state, id).stored);

/** Happiness points every pig of the pen gets from the decorations standing on the farm (stored ones give none). */
export const decorBonus = (state: Pick<FarmGame, 'decor' | 'decorPlan'>): number =>
  placedDecor(state).reduce((n, id) => n + DECORS[id].happyBonus, 0);

/** Everything that lifts the mood of the whole pen: decorations and pets (GAME_BALANCE, spec V2 §7, §9). */
export const penMood = (state: Pick<FarmGame, 'decor' | 'decorPlan' | 'pigs'>): number => decorBonus(state) + petBonus(state);
