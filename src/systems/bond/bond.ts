// Bond (GAME_BALANCE §3, spec V2 §7): five hearts between a creature and the player. It grows when the
// creature is petted, fed its favourite food or nursed; it never falls. Hearts lift Quality (systems/quality)
// and, later, open a hidden trait. Pure: the day and the rules come in as arguments.
import { hashSeed } from '../../core/rng';
import type { Creature } from '../creature/types';

export interface BondRules {
  maxBond: number;
  perHeart: number;
  pet: { gain: number; perDay: number };
  favorite: { gain: number; hunger: number };
  care: { gain: number };
  moodBoost: { hours: number; byItem: Readonly<Partial<Record<string, number>>> };
  favorites: readonly string[];
}

/** Whole hearts (0-5) of a bond value. */
export const heartsOf = (bond: number | undefined, rules: Pick<BondRules, 'perHeart'>): number =>
  Math.floor((bond ?? 0) / rules.perHeart);

/** `bond` plus `gain`, kept within 0..maxBond. */
export const raiseBond = (bond: number | undefined, gain: number, rules: Pick<BondRules, 'maxBond'>): number =>
  Math.min(rules.maxBond, Math.max(0, (bond ?? 0) + gain));

/** The creature's favourite food: one item of the pool, fixed for its life by its id. */
export function favoriteOf(id: string, rules: Pick<BondRules, 'favorites'>): string {
  return rules.favorites[hashSeed(id, 'favorite') % rules.favorites.length]!;
}

/** Pets still available to the creature on game day `day`. */
export const petsLeft = (c: Pick<Creature, 'petDay' | 'petCount'>, day: number, rules: Pick<BondRules, 'pet'>): number =>
  Math.max(0, rules.pet.perDay - (c.petDay === day ? (c.petCount ?? 0) : 0));

/** The creature after one pet on `day` (the caller checks `petsLeft` first). */
export function petted<C extends Creature>(c: C, day: number, rules: BondRules): C {
  const count = (c.petDay === day ? (c.petCount ?? 0) : 0) + 1;
  return { ...c, bond: raiseBond(c.bond, rules.pet.gain, rules), petDay: day, petCount: count };
}

/** The creature after a food-given mood boost: `amount` mood points from `at` for the rule's hours. */
export function withMoodBoost<C extends Creature>(c: C, amount: number, at: number, rules: Pick<BondRules, 'moodBoost'>): C {
  if (amount <= 0) return c;
  const until = at + rules.moodBoost.hours * 3_600_000;
  const current = c.moodBoost && c.moodBoost.until > at ? c.moodBoost : null;
  // A weaker snack never shortens or lowers a stronger boost that is still running.
  if (current && current.amount >= amount && current.until >= until) return c;
  return { ...c, moodBoost: { amount: current ? Math.max(amount, current.amount) : amount, until: Math.max(until, current?.until ?? 0) } };
}

/**
 * Mood points the boost adds on average over [from, to]: its amount times the share of the span it is
 * active. Linear in time, so the numbers do not depend on how a span is cut into slices.
 */
export function moodBoostOver(c: Pick<Creature, 'moodBoost'>, from: number, to: number): number {
  const boost = c.moodBoost;
  if (!boost || to <= from) return 0;
  const active = Math.max(0, Math.min(to, boost.until) - from);
  return (boost.amount * active) / (to - from);
}
