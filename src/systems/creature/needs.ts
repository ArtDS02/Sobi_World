// Needs (spec §7): care levels of a 0-100 need and the care budget (full → 0 time) of a species.
import { NEED_LEVELS, type NeedLevel } from '../../../content/schemas/vocab';

export { NEED_LEVELS, type NeedLevel };

/** Care level of a value: the first level (best first) whose lowest value it reaches. */
export function needLevel(value: number, levelMin: Readonly<Record<NeedLevel, number>>): NeedLevel {
  return NEED_LEVELS.find((l) => value >= levelMin[l]) ?? 'critical';
}

/** 0 = best. */
export const needRank = (level: NeedLevel): number => NEED_LEVELS.indexOf(level);

/** Seconds a full need lasts (NH-1): derived from growth time with a floor, never hand-tuned. */
export const careBudget = (growthSec: number, ratio: number, minSec: number): number =>
  Math.max(minSec, growthSec * ratio);
