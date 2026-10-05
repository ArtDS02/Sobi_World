// Happiness (spec §5.4, D18). Derived, never stored.
import { BALANCE } from '../../../core/config/balance';
import type { Pig } from '../../../core/types';

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** `decorBonus`: the farm's decoration bonus (§5.4 reserved term, engine/decor.ts). */
export function happiness(
  pig: Pick<Pig, 'cleanliness' | 'hunger' | 'isSick'>,
  decorBonus = 0,
): number {
  const care = Math.round(
    BALANCE.HAPPY_CLEAN_WEIGHT * pig.cleanliness + BALANCE.HAPPY_HUNGER_WEIGHT * pig.hunger,
  );
  return clamp(care - (pig.isSick ? BALANCE.HAPPY_SICK_PENALTY : 0) + decorBonus, 0, 100);
}
