// Child species odds for a pair (spec §6.5 as rules, DECISIONS U00-1 D4, PS-2): parent
// validation → compatibility → child rarity → species inside that rarity (inheritance, family,
// traits) → named recipes (MUTATIONS) → normalised weights. The admin pair table
// (breedingPairs.ts, DECISIONS AD-1) wins for a pair that has an active row. Pure and
// deterministic: the same pair always gives the same table; the rng only draws from it.
import { PAIR_RULES, type PairRule } from '../config/breedingPairs';
import { BREEDING_RULES, MUTATIONS } from '../config/breedingRules';
import { BREED_IDS, BREEDS } from '../config/breeds';
import type { BreedId } from '../config/ids';
import { rarityRank, RARITY_VALUES } from '../config/rarity';
import { SPECIES_TRAITS, type Trait } from '../config/speciesTraits';

export interface BreedingOutcome {
  breed: BreedId;
  weight: number; // percent; a pair's outcomes sum to 100
}

const R = BREEDING_RULES;
const rank = (id: BreedId) => rarityRank(BREEDS[id].rarity);
const traitsOf = (id: BreedId): readonly Trait[] => SPECIES_TRAITS[id] ?? [];
/** Species a birth may produce: retired ones (enabled false) never come out (A7-1). */
const liveIds = () => BREED_IDS.filter((id) => BREEDS[id].enabled);
const isPair = (x: BreedId, y: BreedId, a: BreedId, b: BreedId) =>
  (x === a && y === b) || (x === b && y === a);

/** Named recipes of an unordered pair (live results only). */
export const recipesFor = (a: BreedId, b: BreedId) =>
  MUTATIONS.filter((m) => isPair(m.parents[0], m.parents[1], a, b) && BREEDS[m.result].enabled);

function sharedTraits(a: BreedId, b: BreedId): number {
  const tb = new Set(traitsOf(b));
  return traitsOf(a).filter((t) => tb.has(t)).length;
}

/**
 * How well two species match, 0..1: same family, shared traits, close rarities, a named recipe.
 * Same species = same family + all its traits. Never 0: any two breedable pigs may breed.
 */
export function compatibility(a: BreedId, b: BreedId): number {
  const C = R.COMPAT;
  const score =
    C.base +
    (BREEDS[a].family === BREEDS[b].family ? C.sameFamily : 0) +
    C.perSharedTrait * Math.min(sharedTraits(a, b), C.traitCap) -
    C.perRarityGap * Math.abs(rank(a) - rank(b)) +
    (recipesFor(a, b).length > 0 ? C.recipe : 0);
  return Math.max(0.05, Math.min(1, score));
}

/** Percent of each child rarity rank for a pair (sums to 100; only ranks that exist). */
export function rarityOdds(a: BreedId, b: BreedId): Map<number, number> {
  const lo = Math.min(rank(a), rank(b));
  const hi = Math.max(rank(a), rank(b));
  const up = R.UP_SCALE.min + (R.UP_SCALE.max - R.UP_SCALE.min) * compatibility(a, b);
  const raw = new Map<number, number>();
  const add = (r: number, w: number) => raw.set(r, (raw.get(r) ?? 0) + w);
  if (lo === hi) {
    const S = R.RARITY_SAME;
    add(lo - 1, S.down);
    add(lo, S.same);
    add(lo + 1, S.up * up);
    add(lo + 2, S.up2 * up);
  } else {
    const M = R.RARITY_MIXED;
    add(lo, M.low);
    for (let r = lo + 1; r < hi; r++) add(r, M.between / (hi - lo - 1));
    add(hi, M.high);
    add(hi + 1, M.above * up);
  }
  const live = new Set(liveIds().map(rank));
  const kept = [...raw].filter(([r]) => r >= 0 && r < RARITY_VALUES.length && live.has(r));
  const total = kept.reduce((s, [, w]) => s + w, 0);
  return new Map(kept.map(([r, w]) => [r, (w / total) * 100]));
}

/** Weight of one candidate species inside its rarity, for parents a × b. */
function speciesWeight(id: BreedId, a: BreedId, b: BreedId): number {
  const S = R.SPECIES;
  const parentTraits = new Set([...traitsOf(a), ...traitsOf(b)]);
  const shared = traitsOf(id).filter((t) => parentTraits.has(t)).length;
  const family = BREEDS[id].family === BREEDS[a].family || BREEDS[id].family === BREEDS[b].family;
  return (
    S.BASE +
    (id === a || id === b ? S.PARENT : 0) +
    (family ? S.FAMILY : 0) +
    S.TRAIT * Math.min(shared, S.TRAIT_CAP)
  );
}

/** The active pair-table row of an unordered pair, if any. */
export function pairRuleFor(
  a: BreedId,
  b: BreedId,
  rules: readonly PairRule[] = PAIR_RULES,
): PairRule | undefined {
  return rules.find((r) => r.active && isPair(r.parents[0], r.parents[1], a, b));
}

const byWeight = (p: BreedingOutcome, q: BreedingOutcome) =>
  q.weight - p.weight || BREED_IDS.indexOf(p.breed) - BREED_IDS.indexOf(q.breed);

/** A pair-table row's live outcomes (retired species drop out, the rest rescale to 100). */
function tableOutcomes(rule: PairRule): BreedingOutcome[] | undefined {
  const live = rule.outcomes.filter((o) => BREEDS[o.breed].enabled && o.percent > 0);
  const total = live.reduce((s, o) => s + o.percent, 0);
  if (total === 0) return undefined;
  return live.map((o) => ({ breed: o.breed, weight: (o.percent / total) * 100 })).sort(byWeight);
}

/**
 * Outcomes for a pair, most likely first; undefined when a parent cannot breed (caller fails
 * with BREEDING_COMBINATION_NOT_SUPPORTED — never a silent fallback).
 */
export function breedingOutcomes(
  a: BreedId,
  b: BreedId,
  pairs: readonly PairRule[] = PAIR_RULES,
): BreedingOutcome[] | undefined {
  if (!BREEDS[a].breedable || !BREEDS[b].breedable) return undefined;
  const rule = pairRuleFor(a, b, pairs);
  const table = rule && tableOutcomes(rule);
  if (table) return table;

  const odds = new Map<BreedId, number>();
  const live = liveIds();
  for (const [r, percent] of rarityOdds(a, b)) {
    const pool = live.filter((id) => rank(id) === r);
    const weights = pool.map((id) => speciesWeight(id, a, b));
    const total = weights.reduce((s, w) => s + w, 0);
    pool.forEach((id, i) => odds.set(id, (percent * weights[i]!) / total));
  }
  for (const m of recipesFor(a, b)) odds.set(m.result, (odds.get(m.result) ?? 0) + m.weight);

  const total = [...odds.values()].reduce((s, w) => s + w, 0);
  if (total === 0) return undefined;
  return [...odds].map(([breed, w]) => ({ breed, weight: (w / total) * 100 })).sort(byWeight);
}
