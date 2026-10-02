// Breeding pair table (DECISIONS AD-1): explicit results for one parent pair, on top of the rules
// of breedingRules.ts. When an active row exists for a pair (order of parents ignored), its
// outcomes ARE the pair's odds; every other pair keeps the rule system. Percents sum to 100.
// The block between the admin markers is rewritten by the admin dashboard (→ Phối giống).
import type { BreedId } from './ids';

export interface PairOutcome {
  breed: BreedId;
  percent: number;
}

export interface PairRule {
  id: string;
  parents: readonly [BreedId, BreedId]; // unordered
  outcomes: readonly PairOutcome[];
  active: boolean;
  note?: string;
}

/** Tolerance of the 100 % check (decimals typed in the dashboard). */
export const PAIR_PERCENT_EPSILON = 0.01;

// <admin:breedingPairs>
export const PAIR_RULES: readonly PairRule[] = [
];
// </admin:breedingPairs>
