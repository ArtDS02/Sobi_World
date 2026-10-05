// Decoration bonus (spec §5.4 decorBonus, DECISIONS PG-3). Derived, never stored.
import { DECORS } from '../../../core/config/decor';
import type { FarmGame } from './types';

/** Happiness points every pig gets from the farm's owned decorations. */
export const decorBonus = (state: Pick<FarmGame, 'decor'>): number =>
  state.decor.reduce((n, id) => n + DECORS[id].happyBonus, 0);
