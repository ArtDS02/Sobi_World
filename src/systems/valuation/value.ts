// Valuation (spec §6, GAME_BALANCE §2.5): a value is a base price times named factors, floored to a
// whole coin. Each Area picks its factors: Sobi Farm (GĐ1) uses base × care factor; the Sobi World
// formula (rarity × quality × weight × health × market) plugs in as more factors in GĐ2.

// Guards floor() against binary float error (e.g. 1200 * 0.95 landing at 1139.999...).
const FLOOR_EPSILON = 1e-9;

export type ValueFactors = Readonly<Record<string, number>>;

export function valueOf(base: number, factors: ValueFactors = {}): number {
  const raw = Object.values(factors).reduce((v, f) => v * f, base);
  return Math.floor(raw + FLOOR_EPSILON);
}

/** A factor that rises linearly from `min` (score 0) to `min + span` (score 100). */
export const linearFactor = (score: number, min: number, span: number): number => min + (span * score) / 100;

/** Sobi World weight factor: min(weight / standard, cap) (GAME_BALANCE §2.5). */
export const weightFactor = (weight: number, standard: number, cap: number): number => Math.min(weight / standard, cap);

/** Sobi World health factor: −perDay per day ill, floored (GAME_BALANCE §2.5). */
export const healthFactor = (daysIll: number, perDay: number, floor: number): number => Math.max(floor, 1 - perDay * daysIll);
