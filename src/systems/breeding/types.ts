// Shared shapes of advanced breeding (GAME_BALANCE §4): traits, inheritance results, family trees.
import type { z } from 'zod';
import type { breedingBalanceFileSchema } from '../../../content/schemas/breeding/balance';
import type { traitSchema } from '../../../content/schemas/breeding/traits';
import type { Gender } from '../../core/config/ids';

export type BreedingRules = z.infer<typeof breedingBalanceFileSchema>;
export type TraitDef = z.infer<typeof traitSchema>;
export type TraitTier = TraitDef['tier'];
export type TraitEffect = keyof TraitDef['effects'];

/** What a creature carries: visible traits plus at most one hidden trait (shown from 5 hearts of Bond). */
export interface Heredity {
  traits?: readonly string[] | undefined;
  hiddenTrait?: string | undefined;
}

/** A parent as inheritance sees it: its traits and whether its hidden one is open (effects need that). */
export interface ParentTraits extends Heredity {
  hiddenRevealed: boolean;
}

export interface ChildTraits {
  traits: string[];
  hiddenTrait?: string;
  /** The birth mutated: it holds a RARE / EPIC trait it was not given by a parent. */
  mutated: boolean;
}

/** One ancestor in a family tree, frozen at the moment of the birth (the real pig may be sold since). */
export interface Ancestor {
  name: string;
  breed: string;
  gender: Gender;
  generation: number;
  /** Visible traits only: a hidden trait is the owner's secret until revealed. */
  traits?: string[] | undefined;
  mother?: Ancestor | undefined;
  father?: Ancestor | undefined;
}
