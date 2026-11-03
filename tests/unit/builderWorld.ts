// The world after a Map Builder publish (decision 047, GĐ8), as raw JSON: a new side area of the forest, "Hang Kiểm Thử", joined to
// Rừng Sâu both ways — each exit landing on a named spawn — and listed in the zone's side areas. Built from the shipped files with
// plain JSON only, so a test can hand it to the game in place of maps.json / zones.json (vi.mock) before any content loads.
// tests/scripts/mapBuilder.test.ts checks that the builder's own publish makes exactly these rows.
type Raw = Record<string, unknown> & { id: string };

export const CAVE = 'map_it_cave';
export const DEEP = 'map_forest_deep';
export const TO_CAVE = 'exit_forest_deep_to_it_cave';
export const TO_DEEP = 'exit_it_cave_to_forest_deep';

/** The new area as the builder publishes it (a blank 30 × 20 area with one exit back). */
export function caveRow(): Raw {
  const cols = 30;
  const rows = 20;
  return {
    id: CAVE,
    zoneId: 'zone_forest',
    nameVi: 'Hang Kiểm Thử',
    corruption: 0,
    tile: 40,
    cols,
    rows,
    terrain: Array.from({ length: rows }, (_, y) => (y === 0 || y === rows - 1 ? '#'.repeat(cols) : `#${'.'.repeat(cols - 2)}#`)),
    spawn: { x: 15, y: 10 },
    spawns: [{ id: 'spawn_from_forest_deep', nameVi: 'Từ Rừng Sâu', x: 2, y: 9, facing: 'down' }],
    portal: { x: 17, y: 9 },
    exits: [{ id: TO_DEEP, x: 1, y: 9, w: 1, h: 2, to: DEEP, arriveX: 61, arriveY: 7, kind: 'trail', arrive: 'spawn_from_it_cave', facing: 'down' }],
    props: [],
    groups: [],
    chests: [],
    nodes: [],
    gates: [],
    covers: [],
    puzzles: [],
    springs: [],
    npcs: [],
    lore: [],
  };
}

/** Rừng Sâu's new exit and the spawn the way back lands on. */
export const deepExit = { id: TO_CAVE, x: 60, y: 8, w: 1, h: 2, to: CAVE, arriveX: 2, arriveY: 9, kind: 'trail', arrive: 'spawn_from_forest_deep', facing: 'down' };
export const deepSpawn = { id: 'spawn_from_it_cave', nameVi: 'Từ Hang Kiểm Thử', x: 61, y: 7, facing: 'down' };

export function builderMaps(file: { maps: Raw[] }): { maps: Raw[] } {
  const maps = file.maps.map((m) =>
    m.id === DEEP ? { ...m, exits: [...(m.exits as Raw[]), deepExit], spawns: [...((m.spawns as Raw[]) ?? []), deepSpawn] } : m,
  );
  return { maps: [...maps, caveRow()] };
}

export function builderZones<T extends { zones: Raw[] }>(file: T): T {
  return { ...file, zones: file.zones.map((z) => (z.id === 'zone_forest' ? { ...z, branches: [...((z.branches as string[]) ?? []), CAVE] } : z)) };
}
