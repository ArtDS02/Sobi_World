// Breeding coverage validation (DECISIONS PS-2): the breeding data as a graph — pair → child —
// checked for orphans (species no route reaches), invalid / duplicate rules and probability
// errors. Run by tests (must stay clean) and printed by `npm run breeding:report`.
import { PAIR_PERCENT_EPSILON, PAIR_RULES, type PairRule } from '../../../core/config/breedingPairs';
import { GENETICS, MUTATIONS, type GeneticsRules, type Mutation } from '../../../core/config/breedingRules';
import { BREED_IDS, BREEDS } from '../../../core/config/breeds';
import type { BreedId } from '../../../core/config/ids';
import { RARITY_VALUES, type Rarity } from '../../../core/config/rarity';
import { breedingOutcomes, geneticsIssues, recipeIssues } from './breedingOdds';

/** A route below this percent still counts, but the report flags species whose best is weaker. */
export const WEAK_ROUTE_PERCENT = 0.2;

export interface SpeciesRoutes {
  /** Parent pairs (unordered, breedable, live) that can give this species. */
  pairs: number;
  /** The most likely pair for it without itself as a parent (how it is first discovered). */
  best: { a: BreedId; b: BreedId; percent: number } | null;
  /** Breeding rounds needed from the shop species (0 = sold in the shop). */
  depth: number | null;
  shop: boolean;
}

export interface BreedingCoverage {
  total: number;
  byRarity: Record<Rarity, number>;
  /** Species a pair of pigs can give. */
  breedable: number;
  /** Species bought or bred from a reachable pair (the whole collection when clean). */
  obtainable: number;
  /** Species that can be parents (LEGENDARY cannot, D10). */
  parents: number;
  /** Pair → child edges with a chance above 0. */
  routes: number;
  species: Record<BreedId, SpeciesRoutes>;
  orphans: BreedId[];
  weak: BreedId[];
  invalidRules: string[];
  duplicateRules: string[];
  probabilityErrors: string[];
}

const live = () => BREED_IDS.filter((id) => BREEDS[id].enabled);
const pairKey = (a: string, b: string) => [a, b].sort().join('+');

function ruleIssues(mutations: readonly Mutation[], pairs: readonly PairRule[]) {
  const invalid: string[] = [];
  const dupes: string[] = [];
  const seen = new Set<string>();
  for (const m of mutations) {
    const key = `${pairKey(m.parents[0], m.parents[1])}>${m.result}`;
    if (seen.has(key)) dupes.push(`mutation ${key}`);
    seen.add(key);
    for (const id of [...m.parents, m.result])
      if (!BREEDS[id]) invalid.push(`mutation ${key}: unknown ${id}`);
    if (m.parents.some((p) => BREEDS[p] && !BREEDS[p].breedable))
      invalid.push(`mutation ${key}: parent cannot breed`);
    if (!(m.weight > 0)) invalid.push(`mutation ${key}: weight ${m.weight}`);
  }
  const active = new Set<string>();
  for (const r of pairs) {
    const key = pairKey(r.parents[0], r.parents[1]);
    for (const id of [...r.parents, ...r.outcomes.map((o) => o.breed)])
      if (!BREEDS[id]) invalid.push(`pair ${r.id}: unknown ${id}`);
    const sum = r.outcomes.reduce((s, o) => s + o.percent, 0);
    if (Math.abs(sum - 100) > PAIR_PERCENT_EPSILON) invalid.push(`pair ${r.id}: ${sum}% ≠ 100%`);
    if (!r.active) continue;
    if (active.has(key)) dupes.push(`pair ${key}: two active rows`);
    active.add(key);
  }
  return { invalid, dupes };
}

export function breedingCoverage(
  mutations: readonly Mutation[] = MUTATIONS,
  pairs: readonly PairRule[] = PAIR_RULES,
  genetics: GeneticsRules = GENETICS,
): BreedingCoverage {
  const ids = live();
  const parents = ids.filter((id) => BREEDS[id].breedable);
  const producers = new Map<BreedId, { a: BreedId; b: BreedId; percent: number }[]>();
  const probabilityErrors: string[] = [];
  let routes = 0;
  for (let i = 0; i < parents.length; i++) {
    for (let j = i; j < parents.length; j++) {
      const a = parents[i]!,
        b = parents[j]!;
      const out = breedingOutcomes(a, b, pairs, { mutations, genetics }) ?? [];
      const sum = out.reduce((s, o) => s + o.weight, 0);
      if (out.length === 0 || Math.abs(sum - 100) > 1e-6 || out.some((o) => !(o.weight >= 0)))
        probabilityErrors.push(`${a} × ${b}: ${sum}%`);
      for (const o of out) {
        if (!(o.weight > 0)) continue;
        routes++;
        producers.set(o.breed, [...(producers.get(o.breed) ?? []), { a, b, percent: o.weight }]);
      }
    }
  }
  // Reachability from the shop: each round adds the children of pairs already reachable.
  const depth = new Map<BreedId, number>(
    ids.filter((id) => BREEDS[id].buyGold !== null).map((id) => [id, 0]),
  );
  for (let round = 1, grew = true; grew; round++) {
    grew = false;
    for (const [child, list] of producers) {
      if (depth.has(child)) continue;
      if (
        list.some(
          (p) => (depth.get(p.a) ?? Infinity) < round && (depth.get(p.b) ?? Infinity) < round,
        )
      ) {
        depth.set(child, round);
        grew = true;
      }
    }
  }
  const species = {} as Record<BreedId, SpeciesRoutes>;
  for (const id of ids) {
    const list = producers.get(id) ?? [];
    const best = list
      .filter((p) => p.a !== id && p.b !== id)
      .reduce<SpeciesRoutes['best']>((m, p) => (!m || p.percent > m.percent ? p : m), null);
    species[id] = {
      pairs: list.length,
      best,
      depth: depth.get(id) ?? null,
      shop: BREEDS[id].buyGold !== null,
    };
  }
  const byRarity = Object.fromEntries(
    RARITY_VALUES.map((r) => [r, ids.filter((id) => BREEDS[id].rarity === r).length]),
  ) as Record<Rarity, number>;
  const { invalid, dupes } = ruleIssues(mutations, pairs);
  invalid.push(...recipeIssues(mutations), ...geneticsIssues(genetics));
  return {
    total: ids.length,
    byRarity,
    breedable: ids.filter((id) => species[id].pairs > 0).length,
    obtainable: ids.filter((id) => species[id].depth !== null).length,
    parents: parents.length,
    routes,
    species,
    orphans: ids.filter((id) => species[id].depth === null),
    weak: ids.filter(
      (id) => !species[id].shop && (species[id].best?.percent ?? 0) < WEAK_ROUTE_PERCENT,
    ),
    invalidRules: invalid,
    duplicateRules: dupes,
    probabilityErrors,
  };
}
