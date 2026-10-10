// Pity (GAME_BALANCE §4): every breeding that could have given a Rare+ child and did not raises the Rare+
// chance of the next one; a Rare+ child resets it. Pure percent arithmetic on the species odds.
import type { BreedingRules } from './types';

export interface WeightedOutcome {
  breed: string;
  /** Percent; a pair's outcomes sum to 100. */
  weight: number;
}

/**
 * `outcomes` with `pity` percentage points of probability moved from the non-Rare+ outcomes to the Rare+
 * ones, in proportion to their weights. Unchanged when the pair cannot give Rare+ (or only Rare+).
 */
export function applyPity<O extends WeightedOutcome>(outcomes: readonly O[], isRare: (breed: string) => boolean, pity: number): O[] {
  const rare = outcomes.filter((o) => isRare(o.breed));
  const rareShare = rare.reduce((s, o) => s + o.weight, 0);
  const total = outcomes.reduce((s, o) => s + o.weight, 0);
  if (pity <= 0 || rare.length === 0 || rare.length === outcomes.length || rareShare <= 0) return [...outcomes];
  const move = Math.min(pity, total - rareShare);
  const common = total - rareShare;
  return outcomes.map((o) => ({
    ...o,
    weight: isRare(o.breed) ? o.weight + (move * o.weight) / rareShare : o.weight - (move * o.weight) / common,
  }));
}

/** Whether the pair could give a Rare+ child at all (pity only counts then). */
export const couldBeRare = (outcomes: readonly WeightedOutcome[], isRare: (breed: string) => boolean): boolean =>
  outcomes.some((o) => o.weight > 0 && isRare(o.breed));

/** Pity after a breeding: reset on a Rare+ child, +step (capped) when one was possible and missed, unchanged otherwise. */
export function nextPity(pity: number, rules: Pick<BreedingRules, 'pity'>, possible: boolean, gotRare: boolean): number {
  if (gotRare) return 0;
  if (!possible) return pity;
  return Math.min(rules.pity.cap, pity + rules.pity.step);
}
