// Adventure V2 exploration areas (decision 037, spec §3.10): every area passes the map checks — nothing stands on a wall or on another
// thing, every chest / gate / spring / traveller is reachable (no dead corner), the main road never needs an element gate, arrivals land
// on walkable ground; the walker's ground is the grid; patrols and touches.
import { describe, expect, it } from 'vitest';
import { canStand } from '../../src/systems/character';
import { MAP_LIST, MAPS, PROPS, ZONE_LIST } from '../../src/areas/adventure/logic/config/content';
import { blockedTiles, groupDistance, groupPosition, mapProblems, reachableTiles, thingsOf, tileCenter, walkableOf } from '../../src/areas/adventure/logic/maps';

describe('exploration areas (§3.10)', () => {
  it('has three areas per zone, the last with the boss', () => {
    for (const z of ZONE_LIST) {
      expect(z.maps).toHaveLength(3);
      expect(MAPS[z.maps[2]!]!.groups.some((g) => g.kind === 'boss')).toBe(true);
    }
  });

  for (const map of MAP_LIST) {
    it(`${map.id} passes every check`, () => {
      expect(mapProblems(map)).toEqual([]);
    });
  }

  it('every hidden chest has a reachable tile next to it once its gate is open', () => {
    for (const map of MAP_LIST) {
      const reach = reachableTiles(map, map.spawn, new Set(map.gates.map((g) => g.id)));
      for (const c of map.chests) {
        const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (c.y + dy!) * map.cols + c.x + dx!);
        expect(around.some((i) => reach.has(i)), `${map.id} ${c.id}`).toBe(true);
      }
    }
  });

  it('a closed gate blocks its tiles; opening it frees them', () => {
    const map = MAPS.map_forest_edge!;
    const gate = map.gates[0]!;
    const i = gate.y * map.cols + gate.x;
    expect(blockedTiles(map)[i]).toBe(true);
    expect(blockedTiles(map, new Set([gate.id]))[i]).toBe(false);
  });

  it('a prop blocks its whole footprint, not one tile', () => {
    const map = MAPS.map_forest_edge!;
    const p = map.props.find((q) => PROPS[q.prop]!.w === 2)!;
    const blocked = blockedTiles(map);
    for (let dy = 0; dy < PROPS[p.prop]!.h; dy += 1) for (let dx = 0; dx < PROPS[p.prop]!.w; dx += 1) expect(blocked[(p.y + dy) * map.cols + p.x + dx]).toBe(true);
    const walk = walkableOf(map);
    expect(canStand(tileCenter(map, p.x + 1, p.y + 1), walk)).toBe(false);
  });

  it('the walker can stand on the spawn of every area', () => {
    for (const map of MAP_LIST) expect(canStand(tileCenter(map, map.spawn.x, map.spawn.y), walkableOf(map)), map.id).toBe(true);
  });

  it('patrolling groups walk their legs and the touch check follows them', () => {
    const map = MAP_LIST.find((m) => m.groups.some((g) => g.patrol))!;
    const g = map.groups.find((gg) => gg.patrol)!;
    const a = groupPosition(map, g, 0);
    const b = groupPosition(map, g, 2500);
    expect(a).not.toEqual(b);
    expect(groupDistance(map, g, b)).toBeLessThan(1);
  });

  it('lists every usable thing of an area', () => {
    const kinds = new Set(thingsOf(MAPS.map_forest_heart!).map((t) => t.kind));
    for (const k of ['chest', 'gate', 'spring', 'lore', 'shrine', 'portal', 'exit']) expect(kinds.has(k as never), k).toBe(true);
  });
});
