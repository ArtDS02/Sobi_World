// Care mood (spec §5.4 happiness, D18): weighted cleanliness + hunger, minus a sick penalty, plus a
// bonus (decorations), clamped 0-100. Derived, never stored.
import type { CreatureCare } from './types';

export interface MoodRules {
  cleanWeight: number;
  hungerWeight: number;
  sickPenalty: number;
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function careMood(c: CreatureCare, rules: MoodRules, bonus = 0): number {
  const care = Math.round(rules.cleanWeight * c.cleanliness + rules.hungerWeight * c.hunger);
  return clamp(care - (c.isSick ? rules.sickPenalty : 0) + bonus, 0, 100);
}
