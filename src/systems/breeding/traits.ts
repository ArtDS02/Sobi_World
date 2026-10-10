// Trait lookup and effects (GAME_BALANCE §4). Pure: the trait table and the hearts come in as arguments.
import type { Heredity, TraitDef, TraitEffect } from './types';

export type TraitTable = ReadonlyMap<string, TraitDef>;

export const traitTable = (rows: readonly TraitDef[]): TraitTable => new Map(rows.map((t) => [t.id, t]));

/** Every trait the creature holds, hidden one last. */
export const allTraits = (h: Heredity): string[] => [...(h.traits ?? []), ...(h.hiddenTrait ? [h.hiddenTrait] : [])];

/** The hidden trait is open from this many hearts of Bond (GAME_BALANCE §3). */
export const REVEAL_HEARTS = 5;
export const isRevealed = (hearts: number): boolean => hearts >= REVEAL_HEARTS;

/** Traits the player can see and that take effect: the visible ones, plus the hidden one once revealed. */
export const knownTraits = (h: Heredity, hearts: number): string[] =>
  isRevealed(hearts) ? allTraits(h) : [...(h.traits ?? [])];

/** Product of the multiplier effects (`growth`, `sellValue`, `bondGain`) of the known traits; 1 when none. */
export function traitMultiplier(table: TraitTable, h: Heredity, hearts: number, effect: Exclude<TraitEffect, 'mutation'>): number {
  return knownTraits(h, hearts).reduce((m, id) => m * (table.get(id)?.effects[effect] ?? 1), 1);
}

/** Sum of the flat `mutation` points of the known traits. */
export function traitMutation(table: TraitTable, h: Heredity, hearts: number): number {
  return knownTraits(h, hearts).reduce((n, id) => n + (table.get(id)?.effects.mutation ?? 0), 0);
}
