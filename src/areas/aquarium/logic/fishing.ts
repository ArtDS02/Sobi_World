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

/** The shadow under the water that tells a fish's size (decision 035); the rod's screen draws it, the log keeps its cm. */
export type ShadowSize = 'small' | 'medium' | 'big' | 'golden';
export const isShadow = (s: unknown): s is ShadowSize => s === 'small' || s === 'medium' || s === 'big' || s === 'golden';

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Length in cm of a catch (decision 061): the species' range by rarity, the shadow picks where in it (`roll` 0..1 within). */
export function sizeCmOf(species: FishSpecies, shadow: ShadowSize, roll: number): number {
  const [lo, hi] = AB.fishing.size.byRarity[species.rarity];
  const [from, to] = AB.fishing.size.byShadow[shadow];
  return Math.round(lerp(lo, hi, lerp(from, to, Math.min(1, Math.max(0, roll)))));
}

/** What a cast may bring besides its fish (decision 061): at most one. */
export type CastEvent =
  | { kind: 'school'; extra: number }
  | { kind: 'giant'; coins: number }
  | { kind: 'bottle'; coins: number }
  | { kind: 'chest'; items: Readonly<Record<string, number>> };

/** One draw over the events (chances add up), skipping those that need a deeper cast; `null` = nothing special. */
export function drawCastEvent(rng: Rng, depth: CastDepth): CastEvent | null {
  const E = AB.fishing.events;
  let roll = rng.next();
  const pickInt = (lo: number, hi: number) => lo + Math.floor(rng.next() * (hi - lo + 1));
  if ((roll -= E.school.chance) < 0) return { kind: 'school', extra: pickInt(E.school.extra[0], E.school.extra[1]) };
  if (depth >= E.giant.minDepth && (roll -= E.giant.chance) < 0) return { kind: 'giant', coins: E.giant.coins };
  if ((roll -= E.bottle.chance) < 0) return { kind: 'bottle', coins: pickInt(E.bottle.coins[0], E.bottle.coins[1]) };
  if (depth >= E.chest.minDepth && roll - E.chest.chance < 0) return { kind: 'chest', items: E.chest.items };
  return null;
}

/** A species' entry of the catch book (areas.sobi_aquarium.catchBook). */
export interface CatchRecord {
  count: number;
  bestCm: number;
  firstAt: number;
}

/** The entry after one more catch of `cm`, and whether it beat an earlier best (the first catch is no record). */
export function recordCatch(prev: CatchRecord | undefined, cm: number, now: number): { entry: CatchRecord; record: boolean } {
  if (!prev) return { entry: { count: 1, bestCm: cm, firstAt: now }, record: false };
  return { entry: { ...prev, count: prev.count + 1, bestCm: Math.max(prev.bestCm, cm) }, record: cm > prev.bestCm };
}
