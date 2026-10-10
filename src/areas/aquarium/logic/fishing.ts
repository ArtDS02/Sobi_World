// The rod (spec V2 §8.3): what a cast brings up. The mini-game on screen gives a score 0..1 (how well the player
// timed it); the rest is a weighted draw over the species that bite now. Pure: the rng is injected.
import type { Rng } from '../../../core/rng';
import { AB, FISH_LIST, rarityStep, type FishSpecies } from './config/content';

export type Catch = { kind: 'miss' } | { kind: 'fish'; species: FishSpecies } | { kind: 'oyster'; item: string };

/** Relative chance of each catch for this score and time of day. */
export function catchTable(score: number, night: boolean): { species: FishSpecies; weight: number }[] {
  return FISH_LIST.filter((f) => f.catchWeight > 0 && (night || !f.nightOnly)).map((species) => ({
    species,
    // A better cast favours rarer fish; at night the night fish are the point, so no penalty there.
    weight: species.catchWeight * (1 + AB.fishing.scoreLuck * score * rarityStep(species)),
  }));
}

/** Chance (0..1) of each outcome, for the screens and the balance report. */
export function catchOdds(score: number, night: boolean): { species: FishSpecies | null; item: string | null; share: number }[] {
  const table = catchTable(score, night);
  const total = table.reduce((s, r) => s + r.weight, 0) + AB.fishing.oyster.weight;
  return [
    ...table.map((r) => ({ species: r.species, item: r.species.item, share: r.weight / total })),
    { species: null, item: AB.fishing.oyster.item, share: AB.fishing.oyster.weight / total },
  ];
}

/** One cast: a score under `missBelow` loses the fish; otherwise a fish (or an oyster) is drawn. */
export function cast(rng: Rng, score: number, night: boolean): Catch {
  if (score < AB.fishing.missBelow) return { kind: 'miss' };
  const table = catchTable(score, night);
  const total = table.reduce((s, r) => s + r.weight, 0) + AB.fishing.oyster.weight;
  let roll = rng.next() * total;
  for (const r of table) {
    roll -= r.weight;
    if (roll < 0) return { kind: 'fish', species: r.species };
  }
  return { kind: 'oyster', item: AB.fishing.oyster.item };
}

/** Seconds of the cooldown a cast leaves: a miss only costs part of it. */
export const cooldownAfter = (c: Catch): number =>
  c.kind === 'miss' ? AB.fishing.cooldownSec * AB.fishing.missCooldownShare : AB.fishing.cooldownSec;
