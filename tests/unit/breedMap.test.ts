import { describe, expect, it } from 'vitest';
import { BREEDING_RULES, MUTATIONS } from '../../src/core/config/breedingRules';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { breedingOutcomes } from '../../src/areas/farm/logic/breedingOdds';
import { breedMap, lineage } from '../../src/areas/farm/logic/breedMap';

const map = breedMap();
const node = (id: string) => map.nodes.find((n) => n.id === id)!;

describe('breed map (BR-2)', () => {
  it('has every live species once; shop species are generation 0', () => {
    const live = BREED_IDS.filter((id) => BREEDS[id].enabled);
    expect(map.nodes.map((n) => n.id).sort()).toEqual([...live].sort());
    for (const n of map.nodes) expect(n.generation === 0).toBe(BREEDS[n.id].buyGold !== null);
  });

  it('a route comes from earlier generations and its percent is the game odds', () => {
    for (const n of map.nodes.filter((x) => x.route)) {
      const { a, b, percent } = n.route!;
      expect(node(a).generation).toBeLessThan(n.generation);
      expect(node(b).generation).toBeLessThan(n.generation);
      expect(a === n.id || b === n.id).toBe(false);
      const real = breedingOutcomes(a, b)!.find((o) => o.breed === n.id)!.weight;
      expect(percent).toBeCloseTo(real, 9);
      expect(n.route!.strong).toBe(percent >= BREEDING_RULES.MAP_STRONG_PERCENT);
    }
  });

  it('every named recipe is an edge from both parents (no second source of data)', () => {
    for (const m of MUTATIONS) {
      for (const p of m.parents) {
        if (p === m.result) continue;
        expect(map.edges).toContainEqual(expect.objectContaining({ from: p, to: m.result, kind: 'recipe' }));
      }
    }
  });

  it('lineage: ancestors lead to the pig, descendants come from it', () => {
    const l = lineage(map, 'PIG_PHOENIX');
    expect(l.ancestors.has('PIG_DRAGONLING')).toBe(true);
    expect(l.ancestors.has('PIG_GALAXY')).toBe(true);
    expect(l.descendants.size).toBe(0); // legendary pigs cannot breed (D10)
    const root = lineage(map, 'PIG_EARTH_PINK');
    expect(root.ancestors.size).toBe(0);
    expect(root.descendants.size).toBeGreaterThan(0);
    for (const e of l.edges) expect(l.ancestors.has(e.from) || e.from === 'PIG_PHOENIX').toBe(true);
  });
});
