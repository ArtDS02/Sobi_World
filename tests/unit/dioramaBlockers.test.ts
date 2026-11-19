// The diorama's fit to the grid (docs/maps/MAP_SCENE_STANDARD.md §1.2): on all six Forest maps every tile the game blocks shows a
// blocker, no tile that walks does, trunks / bushes / rocks stand only in blocked tiles with their whole foot ring inside, and the
// drawn edge of woods and water strays from the tile boundary by no more than a quarter of a tile.
import { describe, expect, it } from 'vitest';
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { blockedTiles } from '../../src/areas/adventure/logic/maps';
import { FOOT_KINDS, blockerPlan, marginTrees, placeFeet } from '../../src/areas/adventure/scene/diorama/blockers';
import { CONTRACTS, CONTRACT_IDS, reviewSpots } from '../../src/areas/adventure/scene/diorama/contracts';
import { WARP_MAX, gridOf, warp, weightsAt } from '../../src/areas/adventure/scene/diorama/field';

describe.each(CONTRACT_IDS)('diorama blockers on %s', (id) => {
  const map = MAPS[id]!;
  const blocked = blockedTiles(map);
  const plan = blockerPlan(map);
  const opts = { mix: CONTRACTS[id]!.trees, corrupt: CONTRACTS[id]!.corrupt };
  const feet = placeFeet(plan, opts);
  const isBlocked = (x: number, y: number) => x < 0 || y < 0 || x >= map.cols || y >= map.rows || blocked[Math.floor(y) * map.cols + Math.floor(x)]!;

  it('gives every blocked tile a blocker, and no walkable tile one', () => {
    for (let i = 0; i < blocked.length; i += 1) expect(plan.kind[i] !== null, `tile ${i % map.cols},${Math.floor(i / map.cols)}`).toBe(blocked[i]);
  });

  it('puts at least one visible foot in every tree, bush and rock tile', () => {
    const covered = new Set(feet.map((f) => f.tile));
    plan.kind.forEach((k, i) => {
      if (k && FOOT_KINDS.includes(k)) expect(covered.has(i), `tile ${i % map.cols},${Math.floor(i / map.cols)} (${k})`).toBe(true);
    });
  });

  it('stands no trunk, bush, rock or stump foot on a walkable tile', () => {
    for (const f of [...feet, ...marginTrees(map, opts)]) {
      expect(f.r).toBeLessThanOrEqual(0.3);
      // The centre and eight points of the foot ring must all be in blocked tiles (or in the forest beyond the area).
      for (let k = -1; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2;
        const [x, y] = k < 0 ? [f.x, f.z] : [f.x + Math.cos(a) * f.r, f.z + Math.sin(a) * f.r];
        expect(isBlocked(x, y), `${f.kind} at ${f.x.toFixed(2)},${f.z.toFixed(2)}`).toBe(true);
      }
    }
  });

  it('is the same every time', () => {
    expect(placeFeet(blockerPlan(map), opts)).toEqual(feet);
  });

  it('draws the 0.5 edge of woods, water and rock within a quarter tile of a tile of its own kind', () => {
    const g = gridOf(map);
    const near = (x: number, y: number, ch: 1 | 2 | 3) => {
      // Distance (tiles) from the point to the nearest tile that is forest / water / rock in the grid (outside = forest).
      let best = 9;
      for (let ty = Math.floor(y) - 1; ty <= Math.floor(y) + 1; ty += 1)
        for (let tx = Math.floor(x) - 1; tx <= Math.floor(x) + 1; tx += 1) {
          const out = tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows;
          const k = out ? 2 : g.kind[(ty + 10) * g.W + tx + 10]!;
          if (!(ch === 1 ? k === 2 : ch === 2 ? k === 3 || k === 5 : k === 4)) continue;
          const dx = Math.max(tx - x, 0, x - (tx + 1));
          const dy = Math.max(ty - y, 0, y - (ty + 1));
          best = Math.min(best, Math.hypot(dx, dy));
        }
      return best;
    };
    for (let y = 0.125; y < map.rows; y += 0.25)
      for (let x = 0.125; x < map.cols; x += 0.25) {
        const [, forest, water, rock] = weightsAt(g, x, y);
        if (forest > 0.5) expect(near(x, y, 1), `forest at ${x},${y}`).toBeLessThanOrEqual(0.25 + 1e-6);
        if (water > 0.5) expect(near(x, y, 2), `water at ${x},${y}`).toBeLessThanOrEqual(0.25 + 1e-6);
        if (rock > 0.5) expect(near(x, y, 3), `rock at ${x},${y}`).toBeLessThanOrEqual(0.25 + 1e-6);
      }
  });

  it('has review points a party can reach', () => {
    expect(reviewSpots(map).length).toBeGreaterThanOrEqual(5);
  });
});

describe('field bend', () => {
  it('never bends a point by more than the allowed distance', () => {
    for (let y = 0; y < 60; y += 0.37)
      for (let x = 0; x < 60; x += 0.41) {
        const [u, v] = warp(x, y);
        expect(Math.abs(u - x)).toBeLessThanOrEqual(WARP_MAX);
        expect(Math.abs(v - y)).toBeLessThanOrEqual(WARP_MAX);
      }
  });
});
