// Trait inheritance (GAME_BALANCE §4): each parent trait passes with `inheritChance`; a new COMMON trait may
// appear; a mutation adds a RARE / EPIC one; the species' signature trait is always there; the creature
// holds at most `maxTraits` and a RARE+ trait may be hidden. All randomness comes from the injected rng,
// drawn in a fixed order, so a seed always gives the same child.
import type { Rng } from '../../core/rng';
import { allTraits, traitMutation, type TraitTable } from './traits';
import type { BreedingRules, ChildTraits, ParentTraits, TraitTier } from './types';

/** Chance (0..100) that a birth of these parents mutates: base + the parents' traits + an outside boost (Cloud flowers, rainbow), capped. */
export function mutationChance(
  parents: readonly [ParentTraits, ParentTraits],
  table: TraitTable,
  rules: BreedingRules,
  boost = 0,
): number {
  const fromTraits = parents.reduce((n, p) => n + traitMutation(table, p, p.hiddenRevealed ? 5 : 0), 0);
  return Math.min(rules.mutation.cap, Math.max(0, rules.mutation.base + fromTraits + boost));
}

/** Weighted draw of an active trait of `tier` that is not in `exclude`; null when the tier has none left. */
export function drawTrait(rng: Rng, table: TraitTable, tier: TraitTier, exclude: readonly string[]): string | null {
  const pool = [...table.values()].filter((t) => t.active && t.tier === tier && !exclude.includes(t.id));
  if (pool.length === 0) return null;
  const total = pool.reduce((s, t) => s + t.weight, 0);
  let roll = rng.next() * total;
  for (const t of pool) {
    roll -= t.weight;
    if (roll < 0) return t.id;
  }
  return pool[pool.length - 1]!.id;
}

/** Fisher–Yates with the injected rng. */
function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export interface InheritOptions {
  /** Outside mutation boost, percentage points. */
  mutationBoost?: number;
  /** The child species' signature trait: always held, always visible. */
  signature?: string | undefined;
}

/** The traits of a child of `parents`. */
export function rollChildTraits(
  rng: Rng,
  parents: readonly [ParentTraits, ParentTraits],
  table: TraitTable,
  rules: BreedingRules,
  options: InheritOptions = {},
): ChildTraits {
  const known = (id: string) => table.has(id);
  // 1. Inheritance: one roll per trait per parent, in parent order.
  const passed: string[] = [];
  for (const parent of parents) {
    for (const id of allTraits(parent)) {
      if (!known(id)) continue;
      if (rng.next() * 100 < rules.inheritChance && !passed.includes(id)) passed.push(id);
    }
  }
  // 2. A brand-new common trait.
  const fresh: string[] = [];
  if (rng.next() * 100 < rules.newTraitChance) {
    const id = drawTrait(rng, table, 'COMMON', passed);
    if (id) fresh.push(id);
  }
  // 3. Mutation: one RARE or EPIC trait the parents did not pass.
  let mutatedTrait: string | null = null;
  if (rng.next() * 100 < mutationChance(parents, table, rules, options.mutationBoost ?? 0)) {
    const tier: TraitTier = rng.next() * 100 < rules.mutation.epicShare ? 'EPIC' : 'RARE';
    mutatedTrait = drawTrait(rng, table, tier, passed) ?? drawTrait(rng, table, 'RARE', passed);
  }
  // 4. Fit into the slots: signature first, then the mutation, then a random order of the rest.
  const signature = options.signature && known(options.signature) ? [options.signature] : [];
  const rest = shuffled(rng, [...passed, ...fresh].filter((id) => !signature.includes(id) && id !== mutatedTrait));
  const kept = [...new Set([...signature, ...(mutatedTrait ? [mutatedTrait] : []), ...rest])].slice(0, rules.maxTraits);
  // 5. Hide one RARE+ trait (never the signature) with `hiddenChance`.
  let hiddenTrait: string | undefined;
  const hideable = kept.filter((id) => id !== options.signature && table.get(id)!.tier !== 'COMMON');
  if (hideable.length > 0 && rng.next() * 100 < rules.hiddenChance) {
    hiddenTrait = hideable[Math.floor(rng.next() * hideable.length)]!;
  }
  return {
    traits: kept.filter((id) => id !== hiddenTrait),
    ...(hiddenTrait ? { hiddenTrait } : {}),
    mutated: mutatedTrait !== null && kept.includes(mutatedTrait),
  };
}
