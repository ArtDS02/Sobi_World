// Adventure V2 exploration areas (decision 037, spec §3.10): every area passes the map checks — nothing stands on a wall or on another
// thing, every chest / gate / spring / traveller is reachable (no dead corner), the main road never needs an element gate, arrivals land
// on walkable ground; the walker's ground is the grid; patrols and touches.
import { describe, expect, it } from 'vitest';
import { canStand } from '../../src/systems/character';
import { startRun, takeExit } from '../../src/areas/adventure/logic/actions/run';
import { exitLock } from '../../src/areas/adventure/logic/actions/trip';
import { contentProblems, MAP_LIST, MAPS, PROPS, ZONE_LIST, zoneAreas, type AreaMap, type Zone } from '../../src/areas/adventure/logic/config/content';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { T0, adventureWorld, ctxAt, keys, ok, squad, standBy, strong } from './adventureKit';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { settleWalker } from '../../src/areas/adventure/logic/simulate';
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
    const map = MAP_LIST.find((m) => m.props.some((q) => PROPS[q.prop]!.w >= 2))!;
    const p = map.props.find((q) => PROPS[q.prop]!.w >= 2)!;
    const blocked = blockedTiles(map);
    for (let dy = 0; dy < PROPS[p.prop]!.h; dy += 1) for (let dx = 0; dx < PROPS[p.prop]!.w; dx += 1) expect(blocked[(p.y + dy) * map.cols + p.x + dx]).toBe(true);
    const walk = walkableOf(map);
    expect(canStand(tileCenter(map, p.x + 1, p.y + 1), walk)).toBe(false);
  });

  it('the walker can stand on the spawn of every area', () => {
    for (const map of MAP_LIST) expect(canStand(tileCenter(map, map.spawn.x, map.spawn.y), walkableOf(map)), map.id).toBe(true);
  });

  it('groups stand still on their own tile and the touch check measures from there (adventure-big-update-1 §12)', () => {
    const map = MAP_LIST[0]!;
    const g = map.groups[0]!;
    const at = groupPosition(map, g);
    expect(at).toEqual(tileCenter(map, g.x, g.y));
    expect(groupDistance(map, g, at)).toBe(0);
  });

  it('every forward gate stands behind its area guardian; zones are chained gate to gate', () => {
    for (const map of MAP_LIST) for (const e of map.exits.filter((x) => x.lock === 'guardian')) expect(map.groups.some((g) => g.kind !== 'normal'), `${map.id} ${e.id}`).toBe(true);
    expect(MAPS.map_forest_heart!.exits.find((e) => e.lock === 'guardian')?.to).toBe('map_mountain_foot');
    expect(MAPS.map_mountain_peak!.exits.find((e) => e.lock === 'guardian')?.to).toBe('map_ruins_gate');
  });

  it('lists every usable thing of an area', () => {
    const kinds = new Set(thingsOf(MAPS.map_forest_heart!).map((t) => t.kind));
    for (const k of ['chest', 'gate', 'spring', 'lore', 'shrine', 'portal', 'exit']) expect(kinds.has(k as never), k).toBe(true);
  });
});

describe('ways between areas (decision 043)', () => {
  const clone = <T>(x: T): T => structuredClone(x);

  it('the content passes: every exit has a way back, every area of a zone is walked to from its entrance', () => {
    expect(mapGraphProblems()).toEqual([]);
    expect(contentProblems()).toEqual([]);
  });

  it('finds an exit without a way back, a shortcut nobody can open and an area cut off from its zone', () => {
    const maps = clone(MAP_LIST) as AreaMap[];
    const edge = maps.find((m) => m.id === 'map_forest_edge')!;
    const deep = maps.find((m) => m.id === 'map_forest_deep')!;
    deep.exits = deep.exits.filter((e) => e.to !== 'map_forest_edge');
    expect(mapGraphProblems(maps).some((p) => p.includes('exit_f1_east has no way back'))).toBe(true);
    const both = clone(MAP_LIST) as AreaMap[];
    for (const m of both.filter((x) => x.id === 'map_forest_edge' || x.id === 'map_forest_deep')) for (const e of m.exits) if (e.to === 'map_forest_edge' || e.to === 'map_forest_deep') e.lock = 'shortcut';
    expect(mapGraphProblems(both).some((p) => p.includes('can never be opened'))).toBe(true);
    const zones = clone(ZONE_LIST) as Zone[];
    zones[0]!.branches = ['map_forest_side'];
    const side = { ...clone(edge), id: 'map_forest_side', exits: [] };
    expect(mapGraphProblems([...MAP_LIST, side])).toContain('map_forest_side is in no zone');
    expect(mapGraphProblems([...MAP_LIST, side], zones)).toContain('zone_forest: map_forest_side cannot be walked to from map_forest_edge');
  });

  it('a zone counts its side areas in what has been found', () => {
    expect(zoneAreas({ ...ZONE_LIST[0]!, branches: ['map_x'] })).toEqual([...ZONE_LIST[0]!.maps, 'map_x']);
  });

  it('a shortcut stays shut until the party walks the way back from its other side, then stays open for good', () => {
    const deep = MAPS.map_forest_deep!;
    const back = deep.exits.find((e) => e.to === 'map_forest_edge')!;
    const saved = back.lock;
    back.lock = 'shortcut';
    try {
      let w = ok(startRun(strong(adventureWorld()), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
      w = withAdventure(w, { ...adventureOf(w), beaten: ['map_forest_edge/g_f1_elite'] });
      expect(exitLock(w, adventureOf(w), deep, back)).toBe('shortcut');
      const edge = MAPS.map_forest_edge!;
      const exit = edge.exits[0]!;
      const r = takeExit(w, { ...standBy(w, edge.id, exit.id), exitId: exit.id }, ctxAt(T0));
      w = ok(r);
      expect(adventureOf(w).openedExits).toEqual([back.id]);
      expect(r.ok && r.events).toContainEqual({ type: 'ADVENTURE_SHORTCUT_OPENED', mapId: deep.id, exitId: back.id, to: edge.id });
      expect(exitLock(w, adventureOf(w), deep, back)).toBeNull();
      expect(adventureOf(w).run!.facing).toBe('right');
    } finally {
      if (saved) back.lock = saved;
      else delete back.lock;
    }
  });

  it('a shut way into a zone not open yet says so', () => {
    const w = adventureWorld();
    const heart = MAPS.map_forest_heart!;
    const next = heart.exits.find((e) => e.to === 'map_mountain_foot')!;
    const a = { ...adventureOf(w), beaten: [`map_forest_heart/${heart.groups.find((g) => g.kind === 'boss')!.id}`] };
    expect(exitLock(w, a, heart, next)).toBe('zone');
    expect(exitLock(w, adventureOf(w), heart, next)).toBe('guardian');
  });
});

describe('every area its own layout (decision 043, wave 1)', () => {
  it('no two areas share a layout: each pair differs on at least a sixth of its tiles (the old copies differed on 0–13%)', () => {
    for (const [i, a] of MAP_LIST.entries()) {
      for (const b of MAP_LIST.slice(i + 1)) {
        // Areas of another size are another layout by their size (decision 045).
        if (a.cols !== b.cols || a.rows !== b.rows) continue;
        let diff = 0;
        a.terrain.forEach((row, y) => [...row].forEach((c, x) => (diff += c === b.terrain[y]![x] ? 0 : 1)));
        expect(diff, `${a.id} / ${b.id}`).toBeGreaterThan((a.cols * a.rows) / 6);
      }
    }
  });

  it('a walker left on ground that is no longer walkable goes back to the spawn; elsewhere nothing moves', () => {
    const w = ok(startRun(strong(adventureWorld()), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
    const a = adventureOf(w);
    expect(settleWalker(a)).toBe(a);
    const peak = MAPS.map_mountain_peak!;
    const y = peak.terrain.findIndex((row, i) => i > 0 && /[#~Fw]/.test(row.slice(1, -1)));
    const lava = tileCenter(peak, peak.terrain[y]!.slice(1, -1).search(/[#~Fw]/) + 1, y);
    const stuck = { ...a, run: { ...a.run!, zoneId: 'zone_mountain', mapId: peak.id, ...lava } };
    expect(settleWalker(stuck).run).toMatchObject({ mapId: peak.id, ...tileCenter(peak, peak.spawn.x, peak.spawn.y) });
    const rift = { ...stuck, run: { ...stuck.run, rift: { floor: 0, ruleId: 'x' } } };
    expect(settleWalker(rift)).toBe(rift);
  });
});
