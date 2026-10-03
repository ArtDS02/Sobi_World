// Child species odds for a pair (spec §6.5 as rules, DECISIONS U00-1 D4, PS-2, MU-1). Layers,
// highest priority first (breedingRules.ts):
//   1. admin pair table (breedingPairs.ts, AD-1): an active row is the pair's whole odds;
//   2. special recipes (MUTATIONS): each named result takes its percent first;
//   3. random genetics (GENETICS) fills the rest — every valid pair has a child:
//      same rarity      → parent species · other species of that rarity · one tier up;
//      different rarity → parent species · species of the middle tiers · others of the higher one;
//      adjacent rarity  → parent species · others of either rarity · others of the higher one.
//      Rarity order comes from RARITY_VALUES; a tier or bucket with no species is dropped and the
//      rest rescale, so no rarity is invented and nothing jumps more than one tier.
// Inside a bucket the gene pool (engine/genePool.ts) weights species. Pure and deterministic: the
// same pair always gives the same table; the rng only draws from it.
import { PAIR_RULES, type PairRule } from '../config/breedingPairs';
import {
  BREEDING_RULES,
  GENETICS,
  MUTATIONS,
  type GeneticsBuckets,
  type GeneticsRules,
  type Mutation,
} from '../config/breedingRules';
import { BREED_IDS, BREEDS } from '../config/breeds';
import type { BreedId } from '../config/ids';
import { rarityRank, RARITY_VALUES } from '../config/rarity';
import { SPECIES_TRAITS, type Trait } from '../config/speciesTraits';
import { geneWeight, type GeneticsContext } from './genePool';

export interface BreedingOutcome {
  breed: BreedId;
  weight: number; // percent; a pair's outcomes sum to 100
}

/** Everything a caller may swap for a what-if (admin preview, tests); defaults = the game's data. */
export interface BreedingData {
  mutations?: readonly Mutation[];
  genetics?: GeneticsRules;
  genes?: GeneticsContext;
}

export type GeneticsCase = 'sameRarity' | 'differentRarity' | 'adjacentRarity';
export type BucketKind = 'parent' | 'sameRarity' | 'middle' | 'higher';

export interface GeneticsBucket {
  kind: BucketKind;
  /** Percent of the random-genetics share (buckets sum to 100). */
  percent: number;
  species: BreedId[];
}

const R = BREEDING_RULES;
const rank = (id: BreedId) => rarityRank(BREEDS[id].rarity);
const traitsOf = (id: BreedId): readonly Trait[] => SPECIES_TRAITS[id] ?? [];
/** Species a birth may produce: retired ones (enabled false) never come out (A7-1). */
const liveIds = () => BREED_IDS.filter((id) => BREEDS[id].enabled);
const isPair = (x: BreedId, y: BreedId, a: BreedId, b: BreedId) =>
  (x === a && y === b) || (x === b && y === a);

/** Special recipes of an unordered pair (live results only). */
export const recipesFor = (a: BreedId, b: BreedId, mutations: readonly Mutation[] = MUTATIONS) =>
  mutations.filter((m) => isPair(m.parents[0], m.parents[1], a, b) && BREEDS[m.result].enabled);

function sharedTraits(a: BreedId, b: BreedId): number {
  const tb = new Set(traitsOf(b));
  return traitsOf(a).filter((t) => tb.has(t)).length;
}

/**
 * How well two species match, 0..1: same family, shared traits, close rarities, a named recipe.
 * Same species = same family + all its traits. Never 0: any two breedable pigs may breed.
 */
export function compatibility(
  a: BreedId,
  b: BreedId,
  mutations: readonly Mutation[] = MUTATIONS,
): number {
  const C = R.COMPAT;
  const score =
    C.base +
    (BREEDS[a].family === BREEDS[b].family ? C.sameFamily : 0) +
    C.perSharedTrait * Math.min(sharedTraits(a, b), C.traitCap) -
    C.perRarityGap * Math.abs(rank(a) - rank(b)) +
    (recipesFor(a, b, mutations).length > 0 ? C.recipe : 0);
  return Math.max(0.05, Math.min(1, score));
}

/** Which random-genetics case a pair is. */
export function geneticsCase(a: BreedId, b: BreedId): GeneticsCase {
  const gap = Math.abs(rank(a) - rank(b));
  return gap === 0 ? 'sameRarity' : gap === 1 ? 'adjacentRarity' : 'differentRarity';
}

/**
 * The random-genetics buckets of a pair (empty ones dropped, percents rescaled to 100), most
 * important first. Exported for the admin explanation and tests.
 */
export function geneticsBuckets(
  a: BreedId,
  b: BreedId,
  data: BreedingData = {},
): GeneticsBucket[] {
  const rules = data.genetics ?? GENETICS;
  const kase = geneticsCase(a, b);
  const B: GeneticsBuckets = rules[kase];
  const live = liveIds();
  const lo = Math.min(rank(a), rank(b));
  const hi = Math.max(rank(a), rank(b));
  const others = (pred: (r: number) => boolean) =>
    live.filter((id) => id !== a && id !== b && pred(rank(id)));
  const parents = [...new Set([a, b])].filter((id) => BREEDS[id].enabled);
  const raw: GeneticsBucket[] = [{ kind: 'parent', percent: B.parentTypeChance, species: parents }];
  if (kase === 'sameRarity') {
    const scale = rules.compatScale;
    const up = scale.min + (scale.max - scale.min) * compatibility(a, b, data.mutations);
    raw.push(
      { kind: 'sameRarity', percent: B.sameRarityTypeChance, species: others((r) => r === lo) },
      // One tier up at most; past the top tier this bucket is empty (no invented rarity).
      {
        kind: 'higher',
        percent: B.higherRarityChance * up,
        species: hi + 1 < RARITY_VALUES.length ? others((r) => r === hi + 1) : [],
      },
    );
  } else if (kase === 'adjacentRarity') {
    raw.push(
      { kind: 'sameRarity', percent: B.sameRarityTypeChance, species: others((r) => r === lo || r === hi) },
      { kind: 'higher', percent: B.higherRarityChance, species: others((r) => r === hi) },
    );
  } else {
    raw.push(
      { kind: 'middle', percent: B.middleRarityChance, species: others((r) => r > lo && r < hi) },
      { kind: 'higher', percent: B.higherRarityChance, species: others((r) => r === hi) },
    );
  }
  const kept = raw.filter((x) => x.species.length > 0 && x.percent > 0);
  const total = kept.reduce((s, x) => s + x.percent, 0);
  return kept.map((x) => ({ ...x, percent: total > 0 ? (x.percent / total) * 100 : 0 }));
}

/** Random genetics alone (no pair table, no recipes): percent per species, sums to 100. */
export function geneticsOutcomes(a: BreedId, b: BreedId, data: BreedingData = {}): Map<BreedId, number> {
  const odds = new Map<BreedId, number>();
  const add = (id: BreedId, w: number) => odds.set(id, (odds.get(id) ?? 0) + w);
  for (const bucket of geneticsBuckets(a, b, data)) {
    if (bucket.kind === 'parent') {
      // Parent species split evenly (a same-species pair gets the whole bucket).
      for (const id of bucket.species) add(id, bucket.percent / bucket.species.length);
      continue;
    }
    // Middle tiers share their bucket evenly, then the gene pool weights species inside a tier.
    const tiers = [...new Set(bucket.species.map(rank))];
    for (const t of tiers) {
      const pool = bucket.species.filter((id) => rank(id) === t);
      const weights = pool.map((id) => geneWeight(id, a, b, data.genes));
      const total = weights.reduce((s, w) => s + w, 0);
      pool.forEach((id, i) => add(id, (bucket.percent / tiers.length) * (weights[i]! / total)));
    }
  }
  return odds;
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

/** Which layer decides a pair (admin label). */
export function breedingLayer(
  a: BreedId,
  b: BreedId,
  pairs: readonly PairRule[] = PAIR_RULES,
  data: BreedingData = {},
): 'pair' | 'recipe' | 'genetics' {
  if (pairRuleFor(a, b, pairs)) return 'pair';
  return recipesFor(a, b, data.mutations).length > 0 ? 'recipe' : 'genetics';
}

/**
 * Outcomes for a pair, most likely first; undefined when a parent cannot breed (caller fails
 * with BREEDING_COMBINATION_NOT_SUPPORTED — never a silent fallback).
 */
export function breedingOutcomes(
  a: BreedId,
  b: BreedId,
  pairs: readonly PairRule[] = PAIR_RULES,
  data: BreedingData = {},
): BreedingOutcome[] | undefined {
  if (!BREEDS[a].breedable || !BREEDS[b].breedable) return undefined;
  const rule = pairRuleFor(a, b, pairs);
  const table = rule && tableOutcomes(rule);
  if (table) return table;

  // Special recipes first: their percents are guaranteed (capped at 100 together).
  const odds = new Map<BreedId, number>();
  const recipes = recipesFor(a, b, data.mutations).filter((m) => m.weight > 0);
  const recipeTotal = recipes.reduce((s, m) => s + m.weight, 0);
  const cap = recipeTotal > 100 ? 100 / recipeTotal : 1;
  for (const m of recipes) odds.set(m.result, (odds.get(m.result) ?? 0) + m.weight * cap);
  // Random genetics fills what the recipes leave.
  const rest = 100 - Math.min(100, recipeTotal);
  if (rest > 0)
    for (const [id, p] of geneticsOutcomes(a, b, data))
      odds.set(id, (odds.get(id) ?? 0) + (p * rest) / 100);

  const total = [...odds.values()].reduce((s, w) => s + w, 0);
  if (total === 0) return undefined;
  return [...odds].map(([breed, w]) => ({ breed, weight: (w / total) * 100 })).sort(byWeight);
}

/** Percent of each child rarity rank for a pair (sums to 100), from the final outcomes. */
export function rarityOdds(a: BreedId, b: BreedId): Map<number, number> {
  const out = new Map<number, number>();
  for (const o of breedingOutcomes(a, b) ?? []) out.set(rank(o.breed), (out.get(rank(o.breed)) ?? 0) + o.weight);
  return out;
}

const PERCENT_EPSILON = 0.01;

/** Problems in a random-genetics table (admin save + coverage audit); empty = valid. */
export function geneticsIssues(rules: GeneticsRules): string[] {
  const issues: string[] = [];
  const cases: GeneticsCase[] = ['sameRarity', 'differentRarity', 'adjacentRarity'];
  for (const k of cases) {
    const b = rules[k];
    const values = Object.entries(b) as [keyof GeneticsBuckets, number][];
    for (const [key, v] of values)
      if (!Number.isFinite(v) || v < 0 || v > 100) issues.push(`${k}.${key}: ${v} ngoài 0…100`);
    const sum = values.reduce((s, [, v]) => s + v, 0);
    if (Math.abs(sum - 100) > PERCENT_EPSILON) issues.push(`${k}: tổng ${sum} % ≠ 100 %`);
    const second = k === 'differentRarity' ? b.middleRarityChance : b.sameRarityTypeChance;
    if (b.parentTypeChance < second || second < b.higherRarityChance)
      issues.push(`${k}: thứ tự ưu tiên phải là bố mẹ ≥ nhóm 2 ≥ nhóm 3`);
    if (k === 'sameRarity' && b.middleRarityChance !== 0) issues.push(`${k}: không có bậc giữa (phải 0)`);
    if (k === 'adjacentRarity' && b.middleRarityChance !== 0) issues.push(`${k}: không có bậc giữa (phải 0)`);
    if (k === 'differentRarity' && b.sameRarityTypeChance !== 0)
      issues.push(`${k}: nhóm cùng độ hiếm không dùng (phải 0)`);
  }
  const s = rules.compatScale;
  if (!(s.min > 0) || !(s.max >= s.min)) issues.push(`compatScale: cần 0 < min ≤ max`);
  const same = rules.sameRarity;
  if (same.higherRarityChance * s.max > same.sameRarityTypeChance)
    issues.push('sameRarity: lên bậc × compatScale.max vượt nhóm cùng độ hiếm (sai ưu tiên)');
  return issues;
}

/** Problems in the special recipes (percent range, per-pair total). */
export function recipeIssues(mutations: readonly Mutation[]): string[] {
  const issues: string[] = [];
  const perPair = new Map<string, number>();
  for (const m of mutations) {
    const key = [...m.parents].sort().join('+');
    if (!(m.weight > 0) || m.weight > 100) issues.push(`recipe ${key}>${m.result}: ${m.weight} % ngoài (0, 100]`);
    perPair.set(key, (perPair.get(key) ?? 0) + m.weight);
  }
  for (const [key, sum] of perPair) if (sum > 100) issues.push(`recipe ${key}: tổng ${sum} % > 100 %`);
  return issues;
}
