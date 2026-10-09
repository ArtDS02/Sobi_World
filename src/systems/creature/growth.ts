// Growth stage and weight (spec §7), derived from growthProgress, never stored.
import type { GrowthStage } from './types';

/** Snap threshold so float drift cannot leave a grown creature at 99.9999…% (spec §7.2). */
export const GROWN_SNAP = 99.999999;

/** BABY < youngAt <= YOUNG < adultAt <= ADULT < 100 = MATURE (GAME_BALANCE §2.1). */
export function growthStage(growthProgress: number, youngAt: number, adultAt: number): GrowthStage {
  if (growthProgress >= 100) return 'MATURE';
  if (growthProgress >= adultAt) return 'ADULT';
  return growthProgress >= youngAt ? 'YOUNG' : 'BABY';
}

/** Share of the max weight at a growth progress: linear between the (progress %, share) keyframes. */
export function weightShare(growthProgress: number, keyframes: readonly (readonly [number, number])[]): number {
  const p = Math.min(100, Math.max(0, growthProgress));
  const next = keyframes.findIndex(([at]) => at >= p);
  if (next <= 0) return keyframes[Math.max(0, next)]![1];
  const [a, wa] = keyframes[next - 1]!;
  const [b, wb] = keyframes[next]!;
  return wa + ((wb - wa) * (p - a)) / (b - a);
}

/** Display-only weight in kg: at least 1 kg, the species' max weight when Mature. */
export const displayWeight = (growthProgress: number, maxWeight: number, keyframes: readonly (readonly [number, number])[]): number =>
  Math.max(1, maxWeight * weightShare(growthProgress, keyframes));
