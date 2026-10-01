// Happiness (spec §5.4, D18). Derived, never stored.
import { BALANCE } from '../config/balance';
import type { Pig } from '../types';

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function happiness(pig: Pick<Pig, 'cleanliness' | 'hunger' | 'isSick'>): number {
  const care = Math.round(
    BALANCE.HAPPY_CLEAN_WEIGHT * pig.cleanliness + BALANCE.HAPPY_HUNGER_WEIGHT * pig.hunger,
  );
  return clamp(care - (pig.isSick ? BALANCE.HAPPY_SICK_PENALTY : 0), 0, 100);
}
