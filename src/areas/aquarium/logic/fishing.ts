// The rod (spec V2 §8.3): what a cast brings up. The mini-game on screen gives a score 0..1 (how well the player
// timed it); the rest is a weighted draw over the species that bite now. Pure: the rng is injected.
import type { Rng } from '../../../core/rng';
import { rarityRank } from '../../../core/config/rarity';
import { AB, FISH_LIST, rarityStep, type FishSpecies } from './config/content';

/** What the sky gives the rod (GĐ12): rain at night favours rare fish, fog lifts every cast. */
export interface FishingSky {
  rareLuck: number;
  scoreBonus: number;
}

export const CLEAR_WATER: FishingSky = { rareLuck: 1, scoreBonus: 0 };

const RARE_RANK = 2; // RARE and above

export type Catch = { kind: 'miss' } | { kind: 'fish'; species: FishSpecies } | { kind: 'oyster'; item: string };

/** Where the line lands: 0 near the shore, 1 mid-lake, 2 far out (decision 035). */
export type CastDepth = 0 | 1 | 2;
export const isDepth = (d: unknown): d is CastDepth => d === 0 || d === 1 || d === 2;

/** Relative chance of each catch for this score, time of day and depth. */
export function catchTable(score: number, night: boolean, sky: FishingSky = CLEAR_WATER, depth: CastDepth = 0): { species: FishSpecies; weight: number }[] {
  const s = Math.min(1, score + sky.scoreBonus);
  return FISH_LIST.filter((f) => f.catchWeight > 0 && (night || !f.nightOnly)).map((species) => ({
    species,
    // A better cast favours rarer fish; at night the night fish are the point, so no penalty there. Rain at night lifts the rare ones.
    // Far out, the rare ones are likelier still.
    weight:
      species.catchWeight *
      (1 + AB.fishing.scoreLuck * s * rarityStep(species)) *
      (1 + AB.fishing.depthLuck[depth] * rarityStep(species)) *
      (rarityRank(species.rarity) >= RARE_RANK ? sky.rareLuck : 1),
  }));
}

/** Chance (0..1) of each outcome, for the screens and the balance report. */
export function catchOdds(score: number, night: boolean, sky: FishingSky = CLEAR_WATER, depth: CastDepth = 0): { species: FishSpecies | null; item: string | null; share: number }[] {
  const table = catchTable(score, night, sky, depth);
  const total = table.reduce((s, r) => s + r.weight, 0) + AB.fishing.oyster.weight;
  return [
    ...table.map((r) => ({ species: r.species, item: r.species.item, share: r.weight / total })),
    { species: null, item: AB.fishing.oyster.item, share: AB.fishing.oyster.weight / total },
  ];
}

/** One cast: a score under `missBelow` loses the fish; otherwise a fish (or an oyster) is drawn. */
export function cast(rng: Rng, score: number, night: boolean, sky: FishingSky = CLEAR_WATER, depth: CastDepth = 0): Catch {
  if (score + sky.scoreBonus < AB.fishing.missBelow) return { kind: 'miss' };
  const table = catchTable(score, night, sky, depth);
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
