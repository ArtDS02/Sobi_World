// Map Builder GĐ8 (decision 047): an area made in the Admin and published is a real area of the game. The game loads the published
// world (builderWorld.ts in place of maps.json / zones.json) with its own schema and cross-checks, the area passes every map and
// graph check, and a trip walks into it through the real exit (`takeExit`), lands on the spawn the exit names, walks in it, and
// walks back the same way — then a save holding that trip still loads and stands where it stood.
import { describe, expect, it, vi } from 'vitest';
import { moveTo, startRun, takeExit, travel } from '../../src/areas/adventure/logic/actions/run';
import { MAPS, MAP_LIST, ZONE_LIST, zoneAreas, ZONES } from '../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { mapProblems, tileCenter } from '../../src/areas/adventure/logic/maps';
import { settleWalker } from '../../src/areas/adventure/logic/simulate';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { parseWorldSave } from '../../src/app/saveCodec';
import type { WorldSave } from '../../src/core/save/world';
import { T0, adventureWorld, ctxAt, keys, ok, squad, standBy, strong, walkTrip } from './adventureKit';
import { CAVE, DEEP, TO_CAVE, TO_DEEP } from './builderWorld';

vi.mock('../../content/adventure/maps.json', async (original) => {
  const real = (await original()) as { default: { maps: never[] } };
  const { builderMaps } = await import('./builderWorld');
  return { default: builderMaps(real.default) };
});
vi.mock('../../content/adventure/zones.json', async (original) => {
  const real = (await original()) as { default: { zones: never[] } };
  const { builderZones } = await import('./builderWorld');
  return { default: builderZones(real.default) };
});

/** A trip in Rừng Sâu: the forest walked once (its guardians down, its portals lit), then a new trip from Lõi Rừng's portal. */
function inDeepWoods(): WorldSave {
  let w = ok(startRun(strong(adventureWorld(), 14), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
  w = walkTrip(w);
  w = withAdventure(w, { ...adventureOf(w), run: null });
  w = ok(startRun(w, { zoneId: 'zone_forest', keys, roster: squad, mapId: 'map_forest_heart' }, ctxAt(T0)));
  const heart = MAPS.map_forest_heart!;
  return ok(travel(w, { ...tileCenter(heart, heart.spawn.x, heart.spawn.y), to: DEEP }, ctxAt(T0)));
}

describe('an area published by the Map Builder', () => {
  it('is loaded by the game as one of its own areas, in its zone, and passes every check', () => {
    expect(MAPS[CAVE]).toBeDefined();
    expect(MAP_LIST).toHaveLength(19);
    expect(zoneAreas(ZONES.zone_forest!)).toContain(CAVE);
    for (const m of MAP_LIST) expect(mapProblems(m), m.id).toEqual([]);
    expect(mapGraphProblems(MAP_LIST, ZONE_LIST)).toEqual([]);
  });

  it('is walked into through the real exit, landing on the named spawn, and walked out the same way', () => {
    let w = inDeepWoods();
    expect(adventureOf(w).run!.mapId).toBe(DEEP);
    w = ok(takeExit(w, { ...standBy(w, DEEP, TO_CAVE), exitId: TO_CAVE }, ctxAt(T0)));
    const cave = MAPS[CAVE]!;
    const arrive = cave.spawns!.find((s) => s.id === MAPS[DEEP]!.exits.find((e) => e.id === TO_CAVE)!.arrive)!;
    expect(adventureOf(w).run).toMatchObject({ mapId: CAVE, zoneId: 'zone_forest', ...tileCenter(cave, arrive.x, arrive.y), facing: arrive.facing });
    // It walks there like any area.
    const inside = tileCenter(cave, 10, 10);
    w = ok(moveTo(w, inside, ctxAt(T0)));
    expect(adventureOf(w).run).toMatchObject({ mapId: CAVE, ...inside });
    w = ok(takeExit(w, { ...standBy(w, CAVE, TO_DEEP), exitId: TO_DEEP }, ctxAt(T0)));
    const deep = MAPS[DEEP]!;
    const back = deep.spawns!.find((s) => s.id === 'spawn_from_it_cave')!;
    expect(adventureOf(w).run).toMatchObject({ mapId: DEEP, ...tileCenter(deep, back.x, back.y) });
  });

  it('keeps a trip standing in it through a save and a load', () => {
    let w = inDeepWoods();
    w = ok(takeExit(w, { ...standBy(w, DEEP, TO_CAVE), exitId: TO_CAVE }, ctxAt(T0)));
    const loaded = parseWorldSave(JSON.stringify(w));
    if (!loaded.ok) throw new Error('the save did not load');
    const a = settleWalker(adventureOf(loaded.save));
    expect(a.run).toEqual(adventureOf(w).run);
  });
});
