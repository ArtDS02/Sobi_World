// Growth stage and display weight (spec §7), derived from growthProgress, never stored.
import type { GrowthStage } from './types';

/** Snap threshold so float drift cannot leave a grown creature at 99.9999…% (spec §7.2). */
export const GROWN_SNAP = 99.999999;

/** BABY < youngAt <= YOUNG < 100 = ADULT (D3). */
export function growthStage(growthProgress: number, youngAt: number): GrowthStage {
  if (growthProgress >= 100) return 'ADULT';
  return growthProgress >= youngAt ? 'YOUNG' : 'BABY';
}

/** Display-only weight in kg: 1 kg at birth up to the species' max weight when grown. */
export const displayWeight = (growthProgress: number, maxWeight: number): number =>
  1 + ((maxWeight - 1) * growthProgress) / 100;
