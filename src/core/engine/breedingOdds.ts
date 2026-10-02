// Child species odds for a pair (spec §6.5 as rules, DECISIONS U00-1 D4): same species, same
// family, one and two rarities up, plus the special pairs of MUTATIONS — unless the admin pair
// table (breedingPairs.ts, DECISIONS AD-1) has an active row for the pair: that row wins.
import { PAIR_RULES, type PairRule } from '../config/breedingPairs';
import { BREEDING_RULES, MUTATIONS } from '../config/breedingRules';
import { BREED_IDS, BREEDS } from '../config/breeds';
import type { BreedId } from '../config/ids';
import { rarityRank } from '../config/rarity';

export interface BreedingOutcome {
  breed: BreedId;
  weight: number; // percent; a pair's outcomes sum to 100
}

const rank = (id: BreedId) => rarityRank(BREEDS[id].rarity);
/** Species a birth may produce: retired ones (enabled false) never come out (A7-1). */
const liveIds = () => BREED_IDS.filter((id) => BREEDS[id].enabled);

/** Spreads `points` evenly over `pool` (nothing when the pool is empty). */
function spread(odds: Map<BreedId, number>, pool: readonly BreedId[], points: number) {
  for (const id of pool) odds.set(id, (odds.get(id) ?? 0) + points / pool.length);
}

/** Species `steps` rarities above `top`, from the parents' families when any exist there. */
function tierUp(families: Set<string>, top: number, steps: number): BreedId[] {
  const tier = liveIds().filter((id) => rank(id) === top + steps);
  const related = tier.filter((id) => families.has(BREEDS[id].family));
  return related.length > 0 ? related : tier;
}

/** The active pair-table row of an unordered pair, if any. */
export function pairRuleFor(
  a: BreedId,
  b: BreedId,
  rules: readonly PairRule[] = PAIR_RULES,
): PairRule | undefined {
  return rules.find(
    (r) => r.active && ((r.parents[0] === a && r.parents[1] === b) || (r.parents[0] === b && r.parents[1] === a)),
  );
}

/** A pair-table row's live outcomes (retired species drop out, the rest rescale to 100). */
function tableOutcomes(rule: PairRule): BreedingOutcome[] | undefined {
  const live = rule.outcomes.filter((o) => BREEDS[o.breed].enabled && o.percent > 0);
  const total = live.reduce((s, o) => s + o.percent, 0);
  if (total === 0) return undefined;
  return live
    .map((o) => ({ breed: o.breed, weight: (o.percent / total) * 100 }))
    .sort((p, q) => q.weight - p.weight || BREED_IDS.indexOf(p.breed) - BREED_IDS.indexOf(q.breed));
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
  const R = BREEDING_RULES;
  const odds = new Map<BreedId, number>();
  const top = Math.max(rank(a), rank(b));
  const families = new Set([BREEDS[a].family, BREEDS[b].family]);

  spread(odds, (a === b ? [a] : [a, b]).filter((id) => BREEDS[id].enabled), R.SAME_PARENT);
  const kin = liveIds().filter(
    (id) => id !== a && id !== b && families.has(BREEDS[id].family) && rank(id) <= top,
  );
  spread(odds, kin, R.SAME_FAMILY);
  spread(odds, tierUp(families, top, 1), R.TIER_UP);
  spread(odds, tierUp(families, top, 2), R.TIER_UP_2);
  for (const m of MUTATIONS) {
    const [x, y] = m.parents;
    const pair = (x === a && y === b) || (x === b && y === a);
    if (pair && BREEDS[m.result].enabled) spread(odds, [m.result], m.weight);
  }

  const total = [...odds.values()].reduce((s, w) => s + w, 0);
  if (total === 0) return undefined;
  return [...odds]
    .map(([breed, w]) => ({ breed, weight: (w / total) * 100 }))
    .sort((p, q) => q.weight - p.weight || BREED_IDS.indexOf(p.breed) - BREED_IDS.indexOf(q.breed));
}
