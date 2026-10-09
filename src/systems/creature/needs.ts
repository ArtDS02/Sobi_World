// Needs (spec §7): the care level of a 0-100 need.
import { NEED_LEVELS, type NeedLevel } from '../../../content/schemas/vocab';

export { NEED_LEVELS, type NeedLevel };

/** Care level of a value: the first level (best first) whose lowest value it reaches. */
export function needLevel(value: number, levelMin: Readonly<Record<NeedLevel, number>>): NeedLevel {
  return NEED_LEVELS.find((l) => value >= levelMin[l]) ?? 'critical';
}

/** 0 = best. */
export const needRank = (level: NeedLevel): number => NEED_LEVELS.indexOf(level);

