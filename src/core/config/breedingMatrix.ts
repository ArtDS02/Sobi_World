// Breeding outcome weights (spec §6.5). Weights per key sum to 100.
import type { BreedId } from './ids';

export interface BreedingOutcome {
  breed: BreedId;
  weight: number;
}

export const BREEDING_MATRIX: Record<string, BreedingOutcome[]> = {
  'PIG_EARTH_PINK:PIG_EARTH_PINK': [
    { breed: 'PIG_EARTH_PINK', weight: 90 },
    { breed: 'PIG_STRIPED_MELON', weight: 10 },
  ],
  'PIG_EARTH_PINK:PIG_STRIPED_MELON': [
    { breed: 'PIG_EARTH_PINK', weight: 55 },
    { breed: 'PIG_STRIPED_MELON', weight: 43 },
    { breed: 'PIG_SUPERMAN', weight: 2 },
  ],
  'PIG_EARTH_PINK:PIG_SUPERMAN': [
    { breed: 'PIG_EARTH_PINK', weight: 45 },
    { breed: 'PIG_STRIPED_MELON', weight: 45 },
    { breed: 'PIG_SUPERMAN', weight: 10 },
  ],
  'PIG_STRIPED_MELON:PIG_STRIPED_MELON': [
    { breed: 'PIG_STRIPED_MELON', weight: 75 },
    { breed: 'PIG_EARTH_PINK', weight: 20 },
    { breed: 'PIG_SUPERMAN', weight: 5 },
  ],
  'PIG_STRIPED_MELON:PIG_SUPERMAN': [
    { breed: 'PIG_STRIPED_MELON', weight: 60 },
    { breed: 'PIG_SUPERMAN', weight: 35 },
    { breed: 'PIG_MYTHICAL', weight: 5 },
  ],
  'PIG_SUPERMAN:PIG_SUPERMAN': [
    { breed: 'PIG_SUPERMAN', weight: 55 },
    { breed: 'PIG_STRIPED_MELON', weight: 35 },
    { breed: 'PIG_MYTHICAL', weight: 10 },
  ],
};

/** Canonical key: both ids sorted alphabetically, joined with ':'. */
export const matrixKey = (a: BreedId, b: BreedId): string => [a, b].sort().join(':');

/** Outcomes for a pair, or undefined (caller must fail with BREEDING_COMBINATION_NOT_SUPPORTED). */
export const breedingOutcomes = (a: BreedId, b: BreedId): BreedingOutcome[] | undefined =>
  BREEDING_MATRIX[matrixKey(a, b)];
