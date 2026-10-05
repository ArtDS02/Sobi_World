// Breed map (DECISIONS BR-2): the game's breeding data as a generation-layered graph for the admin
// dashboard. Nothing here is a second source of odds: every edge comes from breedingOutcomes (the
// rules of breedingRules.ts, the admin pair table, the named recipes).
//   Generation 0 = species sold in the shop. Round by round, a species joins generation g when a
//   pair of species from earlier generations gives it with at least MAP_STRONG_PERCENT; when no
//   strong route is left, the rest join through their best (weaker) route — rare discovery branches.
//   Edges: each species' chosen route (both parents → child), every named recipe and every active
//   pair-table outcome of that strength. Pure and deterministic.
import { PAIR_RULES, type PairRule } from '../../../core/config/breedingPairs';
import { BREEDING_RULES, MUTATIONS, type Mutation } from '../../../core/config/breedingRules';
import { BREED_IDS, BREEDS } from '../../../core/config/breeds';
import type { BreedId } from '../../../core/config/ids';
import { rarityRank } from '../../../core/config/rarity';
import { breedingOutcomes } from './breedingOdds';

export type BreedEdgeKind = 'route' | 'recipe' | 'pair';

export interface BreedMapNode {
  id: BreedId;
  generation: number;
  shop: boolean;
  /** The route that places it (null for shop species): parents and the child's percent. */
  route: { a: BreedId; b: BreedId; percent: number; strong: boolean } | null;
}

export interface BreedMapEdge {
  from: BreedId;
  to: BreedId;
  kind: BreedEdgeKind;
  /** The other parent of the pair (same as `from` for a same-species pair). */
  partner: BreedId;
  percent: number;
}

export interface BreedMap {
  nodes: BreedMapNode[];
  edges: BreedMapEdge[];
  generations: number;
}

const pairKey = (a: BreedId, b: BreedId) => (a < b ? `${a}+${b}` : `${b}+${a}`);
const KIND_RANK: Record<BreedEdgeKind, number> = { recipe: 3, pair: 2, route: 1 };

export function breedMap(
  mutations: readonly Mutation[] = MUTATIONS,
  pairs: readonly PairRule[] = PAIR_RULES,
): BreedMap {
  const live = BREED_IDS.filter((id) => BREEDS[id].enabled);
  const parents = live.filter((id) => BREEDS[id].breedable);
  const odds = new Map<string, Map<BreedId, number>>();
  for (let i = 0; i < parents.length; i++)
    for (let j = i; j < parents.length; j++) {
      const a = parents[i]!,
        b = parents[j]!;
      odds.set(pairKey(a, b), new Map((breedingOutcomes(a, b, pairs, { mutations }) ?? []).map((o) => [o.breed, o.weight])));
    }
  const chance = (a: BreedId, b: BreedId, child: BreedId) => odds.get(pairKey(a, b))?.get(child) ?? 0;

  const gen = new Map<BreedId, number>();
  const nodes = new Map<BreedId, BreedMapNode>();
  for (const id of live.filter((x) => BREEDS[x].buyGold !== null)) {
    gen.set(id, 0);
    nodes.set(id, { id, generation: 0, shop: true, route: null });
  }
  /** Best pair of already-placed parents (gen < g) for `child`, never itself as a parent. */
  const best = (child: BreedId, g: number) => {
    let top: { a: BreedId; b: BreedId; percent: number } | null = null;
    const placed = parents.filter((p) => p !== child && (gen.get(p) ?? Infinity) < g);
    for (let i = 0; i < placed.length; i++)
      for (let j = i; j < placed.length; j++) {
        const percent = chance(placed[i]!, placed[j]!, child);
        if (percent > (top?.percent ?? 0)) top = { a: placed[i]!, b: placed[j]!, percent };
      }
    return top;
  };
  const strong = BREEDING_RULES.MAP_STRONG_PERCENT;
  const place = (id: BreedId, g: number, r: { a: BreedId; b: BreedId; percent: number }) => {
    gen.set(id, g);
    nodes.set(id, { id, generation: g, shop: false, route: { ...r, strong: r.percent >= strong } });
  };
  /** Layers species round by round through routes of at least `floor` percent. */
  const layer = (floor: number) => {
    for (let g = 1, grew = true; grew || g <= Math.max(0, ...gen.values()) + 1; g++) {
      grew = false;
      for (const id of live.filter((x) => !gen.has(x))) {
        const r = best(id, g);
        if (r && r.percent >= floor) {
          place(id, g, r);
          grew = true;
        }
      }
      if (g > live.length) break;
    }
  };
  layer(strong);
  // The discovery tail: species with only weaker routes, at the earliest generation one reaches.
  layer(BREEDING_RULES.MAP_WEAK_PERCENT);
  layer(Number.MIN_VALUE);

  const edges = new Map<string, BreedMapEdge>();
  const add = (from: BreedId, partner: BreedId, to: BreedId, kind: BreedEdgeKind) => {
    if (from === to || !nodes.has(from) || !nodes.has(to)) return;
    const key = `${from}>${to}`;
    const prev = edges.get(key);
    if (prev && KIND_RANK[prev.kind] >= KIND_RANK[kind]) return;
    edges.set(key, { from, to, kind, partner, percent: chance(from, partner, to) });
  };
  for (const n of nodes.values()) {
    if (!n.route) continue;
    add(n.route.a, n.route.b, n.id, 'route');
    add(n.route.b, n.route.a, n.id, 'route');
  }
  for (const r of pairs.filter((p) => p.active))
    for (const o of r.outcomes.filter((x) => x.percent >= strong)) {
      add(r.parents[0], r.parents[1], o.breed, 'pair');
      add(r.parents[1], r.parents[0], o.breed, 'pair');
    }
  for (const m of mutations.filter((x) => BREEDS[x.result].enabled)) {
    add(m.parents[0], m.parents[1], m.result, 'recipe');
    add(m.parents[1], m.parents[0], m.result, 'recipe');
  }

  const byPlace = (x: BreedMapNode, y: BreedMapNode) =>
    x.generation - y.generation ||
    rarityRank(BREEDS[x.id].rarity) - rarityRank(BREEDS[y.id].rarity) ||
    BREED_IDS.indexOf(x.id) - BREED_IDS.indexOf(y.id);
  const list = [...nodes.values()].sort(byPlace);
  return {
    nodes: list,
    edges: [...edges.values()],
    generations: Math.max(0, ...list.map((n) => n.generation)) + 1,
  };
}

/** Everything related to `id`: ancestors (parents, theirs, …), descendants and the edges between. */
export function lineage(map: BreedMap, id: BreedId) {
  const walk = (dir: 'up' | 'down') => {
    const seen = new Set<BreedId>([id]);
    const queue = [id];
    while (queue.length) {
      const cur = queue.pop()!;
      for (const e of map.edges) {
        const next = dir === 'up' ? (e.to === cur ? e.from : null) : e.from === cur ? e.to : null;
        if (next && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    seen.delete(id);
    return seen;
  };
  const ancestors = walk('up');
  const descendants = walk('down');
  const inUp = (x: BreedId) => x === id || ancestors.has(x);
  const inDown = (x: BreedId) => x === id || descendants.has(x);
  const edges = new Set(
    map.edges.filter((e) => (inUp(e.from) && inUp(e.to)) || (inDown(e.from) && inDown(e.to))),
  );
  return { ancestors, descendants, edges };
}
