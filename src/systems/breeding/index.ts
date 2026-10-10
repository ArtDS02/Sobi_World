// Advanced breeding (GĐ7): traits and inheritance, mutation, pity, family trees, rumours. Pure, rules injected.
import { BREEDING_BALANCE, TRAIT_ROWS } from '../../core/config/breeding';
import { traitTable } from './traits';

export * from './inherit';
export * from './lineage';
export * from './pity';
export * from './rumors';
export * from './traits';
export * from './types';

/** The shipped rules and trait table (content/breeding/). */
export const BREEDING_RULES_DEFAULT = BREEDING_BALANCE;
export const TRAITS = traitTable(TRAIT_ROWS);
