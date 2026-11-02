// Map Builder (decision 047): the pure model of "Quản lý map" (new areas, copies, references, status; GĐ2), the spawn points exits land
// on (GĐ3), the connections between areas (GĐ4), the map network (GĐ5), the editor's operations (GĐ6), publish plans and history (GĐ7), the save-held ids a content save may never drop, and the draft store of the dev API (in a throw-away folder).
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as mapsSchemaModule from '../../content/schemas/adventure/maps';
import { mapSchema, mapsFileSchema } from '../../content/schemas/adventure/maps';
import { MAP_LIST, MAPS, ZONE_LIST } from '../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { mapProblems } from '../../src/areas/adventure/logic/maps';
import { appendPropRow, assetUse } from '../../scripts/admin/mapAssets';
import { deleteMapDraft, readDrafts, readMeta, saveMapDraft, saveMapMeta } from '../../scripts/admin/mapDrafts';
import { savedIdProblems, savedMapIds } from '../../scripts/admin/mapIds';
import { mapHistory, restoreVersion } from '../../scripts/admin/mapPublishApi';
import * as E from '../../tools/admin/mapEditModel';
import * as L from '../../tools/admin/mapLinks';
import * as M from '../../tools/admin/mapModel';
import * as N from '../../tools/admin/mapNetwork';
import * as P from '../../tools/admin/mapPublish';

const load = async () => mapsSchemaModule as unknown as Record<string, unknown>;
const data = (drafts: M.BuilderData['drafts'] = {}, meta: M.BuilderData['meta'] = {}): M.BuilderData => ({ published: MAP_LIST, zones: ZONE_LIST, drafts, meta });
const zoneId = ZONE_LIST[0]!.id;

describe('map builder model', () => {
  it('turns names into id stems and finds a free id', () => {
    expect(M.slugOf('Rừng Đêm Huyền Bí!')).toBe('rung_dem_huyen_bi');
    expect(M.slugOf('   ')).toBe('moi');
    expect(M.freeId('map', 'forest_edge', new Set(['map_forest_edge', 'map_forest_edge_2']))).toBe('map_forest_edge_3');
  });

  it('makes a blank area the game accepts with no map problem', () => {
    const map = M.blankMap({ id: 'map_test_blank', nameVi: 'Thử', zoneId, cols: 40, rows: 20 });
    expect(mapSchema.safeParse(map).success).toBe(true);
    expect(mapProblems(map)).toEqual([]);
    expect(M.blankMap({ id: 'map_x', nameVi: 'x', zoneId, cols: 1, rows: 999 })).toMatchObject({ cols: M.MAP_SIZE.minCols, rows: M.MAP_SIZE.maxRows });
  });

  it('copies an area with fresh ids, its puzzles on the copied gates, and no exits', () => {
    const src = MAP_LIST.find((m) => m.puzzles.length > 0 && m.chests.length > 0)!;
    const taken = M.thingIds(MAP_LIST);
    const copy = M.copyMap(src, { id: 'map_copy_test', nameVi: 'Bản sao' }, taken);
    expect(mapSchema.safeParse(copy).success).toBe(true);
    expect(copy.exits).toEqual([]);
    expect(copy.terrain).toEqual(src.terrain);
    for (const id of M.thingIds([copy])) expect(taken.has(id)).toBe(false);
    for (const p of copy.puzzles) expect(copy.gates.some((g) => g.id === p.gate)).toBe(true);
    expect(mapProblems(copy)).toEqual([]);
    expect(src.id).not.toBe(copy.id); // the source is untouched
    expect(MAPS[src.id]!.exits.length).toBeGreaterThan(0);
  });

  it('tells published, changed, draft and switched-off areas apart, and who leads where', () => {
    const fresh = M.blankMap({ id: 'map_new_one', nameVi: 'Mới', zoneId, cols: 30, rows: 20 });
    const first = MAP_LIST[0]!;
    const linked = structuredClone(first);
    linked.exits.push({ id: 'exit_test_to_new', x: 1, y: 1, w: 1, h: 1, to: fresh.id, arriveX: 5, arriveY: 5 });
    const d = data({ [fresh.id]: { map: fresh, road: 'branch' }, [first.id]: { map: linked, road: 'main' } }, { [fresh.id]: { descriptionVi: '', createdAt: '', updatedAt: '', disabled: true } });
    expect(M.statusOf(d, first.id)).toBe('changed');
    expect(M.statusOf(d, MAP_LIST[1]!.id)).toBe('published');
    expect(M.statusOf(d, fresh.id)).toBe('disabled');
    expect(M.referencesTo(d, fresh.id)).toEqual([{ from: first.id, fromName: first.nameVi, exitId: 'exit_test_to_new', draftOnly: true }]);
    expect(M.canChangeId(d, fresh.id)).toBe(false);
    expect(M.canChangeId(data({ [fresh.id]: { map: fresh, road: 'branch' } }), fresh.id)).toBe(true);
    expect(M.canChangeId(d, first.id)).toBe(false);
    expect(M.mapIdProblem(d, first.id)).toMatch(/đã có/);
    expect(M.mapIdProblem(d, 'Map Bad')).toMatch(/map_ten_khu/);
    expect(M.summaries(d)).toHaveLength(MAP_LIST.length + 1);
  });

  it('keeps the published game clean (the checks the builder will run before a publish)', () => {
    expect(mapGraphProblems(MAP_LIST, ZONE_LIST)).toEqual([]);
  });
});

describe('save-held ids', () => {
  const before = JSON.parse(readFileSync('content/adventure/maps.json', 'utf8')) as { maps: { id: string; chests: { id: string; x: number }[] }[] };

  it('lets a content save move things but never drop a published id', () => {
    const moved = structuredClone(before);
    moved.maps[0]!.chests[0]!.x += 1;
    expect(savedIdProblems('adventure/maps.json', before, moved)).toEqual([]);
    const lost = structuredClone(before);
    const chest = lost.maps[0]!.chests.shift()!;
    expect(savedIdProblems('adventure/maps.json', before, lost)[0]).toContain(chest.id);
    const noMap = { maps: before.maps.slice(1) };
    expect(savedIdProblems('adventure/maps.json', before, noMap)[0]).toContain(before.maps[0]!.id);
    expect(savedIdProblems('adventure/zones.json', { zones: [{ id: 'zone_a' }] }, { zones: [] })[0]).toContain('zone_a');
    expect(savedIdProblems('farm/species.json', before, {})).toEqual([]);
  });

  it('counts guardians and bosses by area, not every group', () => {
    const ids = savedMapIds(before);
    const boss = MAP_LIST.flatMap((m) => m.groups.filter((g) => g.kind === 'boss').map((g) => `${m.id}/${g.id}`));
    for (const k of boss) expect(ids.has(k)).toBe(true);
    const normal = MAP_LIST.flatMap((m) => m.groups.filter((g) => g.kind === 'normal').map((g) => `${m.id}/${g.id}`));
    for (const k of normal) expect(ids.has(k)).toBe(false);
  });
});

describe('draft store', () => {
  const dir = () => mkdtempSync(join(tmpdir(), 'sobi-mapdrafts-'));
  const blank = (id: string) => ({ map: M.blankMap({ id, nameVi: 'Thử', zoneId, cols: 30, rows: 20 }), road: 'branch' as const });

  it('creates, refuses a taken id, renames a never-published area and deletes it', async () => {
    const d = dir();
    expect((await saveMapDraft({ draft: blank('map_store_a'), create: true }, load, d)).status).toBe(200);
    expect((await saveMapDraft({ draft: blank('map_store_a'), create: true }, load, d)).status).toBe(400);
    expect((await saveMapDraft({ draft: blank(MAP_LIST[0]!.id), create: true }, load, d)).status).toBe(400);
    expect((await saveMapDraft({ draft: blank('map_store_missing') }, load, d)).status).toBe(400);
    expect(readMeta(d).map_store_a?.createdAt).toBeTruthy();
    expect((await saveMapDraft({ draft: blank('map_store_b'), previousId: 'map_store_a' }, load, d)).status).toBe(200);
    expect(Object.keys(readDrafts(d))).toEqual(['map_store_b']);
    expect(Object.keys(readMeta(d))).toEqual(['map_store_b']);
    expect(deleteMapDraft({ id: 'map_store_b' }, d).body).toEqual({ ok: true, discarded: false });
    expect(readDrafts(d)).toEqual({});
    expect(readMeta(d)).toEqual({});
  });

  it('refuses a broken shape, an unknown zone, a new id or a switch-off for a published area', async () => {
    const d = dir();
    const broken = blank('map_store_c');
    broken.map.terrain = broken.map.terrain.slice(1);
    expect((await saveMapDraft({ draft: broken, create: true }, load, d)).status).toBe(400);
    expect((await saveMapDraft({ draft: { ...blank('map_store_c'), map: { ...blank('map_store_c').map, zoneId: 'zone_nowhere' } }, create: true }, load, d)).status).toBe(400);
    const pub = MAP_LIST[0]!;
    expect((await saveMapDraft({ draft: { map: { ...structuredClone(pub), id: 'map_store_new_id' }, road: 'main' }, previousId: pub.id }, load, d)).status).toBe(400);
    expect(saveMapMeta({ id: pub.id, patch: { disabled: true } }, d).status).toBe(400);
    expect(deleteMapDraft({ id: pub.id }, d).status).toBe(400);
  });

  it('keeps a change of a published area as a draft that can be dropped', async () => {
    const d = dir();
    const pub = structuredClone(MAP_LIST[0]!);
    pub.nameVi = 'Tên mới';
    expect((await saveMapDraft({ draft: { map: pub, road: 'main' } }, load, d)).status).toBe(200);
    expect(saveMapMeta({ id: pub.id, patch: { descriptionVi: 'ghi chú', node: { x: 10, y: 20 } } }, d).status).toBe(200);
    expect(readMeta(d)[pub.id]).toMatchObject({ descriptionVi: 'ghi chú', node: { x: 10, y: 20 } });
    expect(deleteMapDraft({ id: pub.id }, d).body).toEqual({ ok: true, discarded: true });
    expect(readDrafts(d)).toEqual({});
    expect(readMeta(d)[pub.id]?.descriptionVi).toBe('ghi chú');
    // A dropped draft with no notes leaves nothing behind.
    const other = structuredClone(MAP_LIST[1]!);
    expect((await saveMapDraft({ draft: { map: other, road: 'main' } }, load, d)).status).toBe(200);
    deleteMapDraft({ id: other.id }, d);
    expect(readMeta(d)[other.id]).toBeUndefined();
  });
});

describe('spawn points', () => {
  const raw = () => JSON.parse(readFileSync('content/adventure/maps.json', 'utf8')) as { maps: typeof MAP_LIST };

  it('names every arrival of the game, at the tile and facing it had', () => {
    for (const m of MAP_LIST) for (const e of m.exits) {
      expect(e.arrive, e.id).toBeTruthy();
      const sp = M.spawnsOf(MAPS[e.to]!).find((s) => s.id === e.arrive)!;
      expect([sp.x, sp.y, sp.facing]).toEqual([e.arriveX, e.arriveY, e.facing]);
    }
    expect(M.nameArrivals(MAP_LIST)).toEqual(MAP_LIST.map((m) => structuredClone(m)));
  });

  it('names unnamed arrivals without moving or turning anybody', () => {
    const bare = raw().maps.map((m) => ({ ...m, spawns: undefined, exits: m.exits.map(({ arrive: _a, facing: _f, ...e }) => e) }));
    const named = M.nameArrivals(bare as typeof MAP_LIST);
    named.forEach((m, i) =>
      m.exits.forEach((e, j) => {
        const before = bare[i]!.exits[j]!;
        expect([e.arriveX, e.arriveY]).toEqual([before.arriveX, before.arriveY]);
        expect(e.facing).toBe(M.arrivalFacing(before as M.Exit));
      }),
    );
    expect(mapsFileSchema.safeParse({ maps: named }).success).toBe(true);
  });

  it('adds, moves and removes spawns; a spawn an exit names stays', () => {
    const map = structuredClone(MAPS.map_forest_deep!);
    const sp = M.addSpawn(map, 'Từ Hang Bí Mật');
    expect(sp.id).toBe('spawn_tu_hang_bi_mat');
    M.moveSpawn(map, sp.id, map.spawn.x + 1, map.spawn.y);
    expect(map.spawns!.find((s) => s.id === sp.id)).toMatchObject({ x: map.spawn.x + 1 });
    M.moveSpawn(map, 'spawn_default', 3, 4);
    expect(map.spawn).toEqual({ x: 3, y: 4 });
    const arrivals = M.arrivalsInto(MAP_LIST, map.id);
    const used = arrivals[0]!.exit.arrive!;
    expect(M.removeSpawn(map, used, arrivals)).toMatch(/Đang có lối ra/);
    expect(M.removeSpawn(map, sp.id, arrivals)).toBeNull();
    expect(M.removeSpawn(map, 'spawn_default', arrivals)).toMatch(/không xoá/);
  });

  it('flags a spawn on a wall and exits left behind by a moved spawn, then moves those exits along', () => {
    const maps = MAP_LIST.map((m) => structuredClone(m));
    const deep = maps.find((m) => m.id === 'map_forest_deep')!;
    const target = deep.spawns![0]!;
    const wall = { x: 0, y: 0 };
    M.moveSpawn(deep, target.id, wall.x, wall.y);
    expect(mapProblems(deep, maps).some((p) => p.includes(`spawn ${target.id} stands where nobody can walk`))).toBe(true);
    M.moveSpawn(deep, target.id, deep.spawn.x, deep.spawn.y + 1);
    expect(M.arrivalMismatches(maps, deep).length).toBeGreaterThan(0);
    expect(mapsFileSchema.safeParse({ maps }).success).toBe(false);
    const { maps: fixed, moved } = M.resolveArrivals(maps);
    expect(moved.length).toBeGreaterThan(0);
    expect(M.arrivalMismatches(fixed, fixed.find((m) => m.id === deep.id)!)).toEqual([]);
    expect(mapsFileSchema.safeParse({ maps: fixed }).success).toBe(true);
  });

  it('refuses an exit naming a spawn its area does not have, or a taken spawn id', () => {
    const maps = MAP_LIST.map((m) => structuredClone(m));
    maps[0]!.exits[0]!.arrive = 'spawn_nowhere';
    expect(mapsFileSchema.safeParse({ maps }).success).toBe(false);
    const dup = MAP_LIST.map((m) => structuredClone(m));
    dup[1]!.spawns = [...dup[1]!.spawns!, { ...dup[1]!.spawns![0]! }];
    expect(mapsFileSchema.safeParse({ maps: dup }).success).toBe(false);
  });
});

describe('connections', () => {
  const fresh = () => M.blankMap({ id: 'map_link_test', nameVi: 'Nối Thử', zoneId: MAPS.map_forest_deep!.zoneId, cols: 30, rows: 20 });

  it('makes an exit, lands it on a spawn picked or made in the destination, and its way back at a chosen place', () => {
    const a = fresh();
    const b = structuredClone(MAPS.map_forest_deep!);
    const d = data({ [a.id]: { map: a, road: 'branch' }, [b.id]: { map: b, road: 'main' } });
    const exit = L.newExit(a, b, { x: 28, y: 9 }, L.takenIds(d));
    expect(exit.id).toBe('exit_link_test_to_forest_deep');
    expect([exit.arriveX, exit.arriveY, exit.arrive]).toEqual([b.spawn.x, b.spawn.y, 'spawn_default']);
    const spawnId = L.spawnAt(b, a, 30, 20);
    expect(spawnId).toBe('spawn_from_link_test');
    expect(L.spawnAt(b, a, 30, 20)).toBe(spawnId); // the same tile picks the same spawn
    L.landOn(exit, b, spawnId);
    expect(exit).toMatchObject({ arrive: spawnId, arriveX: 30, arriveY: 20, facing: 'down' });
    // No way back yet: the graph says so, unless the exit is one-way.
    expect(L.graphProblems(d)(a.id).some((p) => p.includes('no way back'))).toBe(true);
    exit.oneWay = true;
    expect(L.graphProblems(d)(a.id).some((p) => p.includes('no way back'))).toBe(false);
    delete exit.oneWay;
    const back = L.newExit(b, a, { x: 1, y: 20 }, L.takenIds(d));
    L.landOn(back, a, L.spawnAt(a, b, 27, 9));
    expect(L.waysBack(b, a)).toEqual([back]);
    expect(L.graphProblems(d)(a.id)).toEqual([]);
    expect(mapProblems(a, [a, b]).filter((p) => /exit|arrival|spawn/.test(p))).toEqual([]);
  });

  it('keeps published exits, drops new ones, and leaves inactive exits and switched-off areas out of the graph', () => {
    const b = structuredClone(MAPS.map_forest_deep!);
    const d = data({ [b.id]: { map: b, road: 'main' } });
    expect(L.removeExit(d, b, b.exits[0]!.id)).toMatch(/không xoá/);
    const a = fresh();
    const d2 = data({ [a.id]: { map: a, road: 'branch' }, [b.id]: { map: b, road: 'main' } });
    const exit = L.newExit(a, b, { x: 28, y: 9 }, L.takenIds(d2));
    const withNote = { ...d2, meta: { [a.id]: { descriptionVi: '', createdAt: '', updatedAt: '', exits: { [exit.id]: { inactive: true } } } } };
    expect(L.liveMaps(withNote).find((m) => m.id === a.id)!.exits).toEqual([]);
    expect(L.removeExit(d2, a, exit.id)).toBeNull();
    expect(a.exits).toEqual([]);
    const off = { ...d2, meta: { [a.id]: { descriptionVi: '', createdAt: '', updatedAt: '', disabled: true } } };
    expect(L.liveMaps(off).some((m) => m.id === a.id)).toBe(false);
  });

  it('puts new areas in their zone for the checks, and faces arrivals into the area', () => {
    const a = fresh();
    const zones = L.workingZones(data({ [a.id]: { map: a, road: 'branch' } }));
    expect(zones.find((z) => z.id === a.zoneId)!.branches).toContain(a.id);
    expect(L.facingInto(a, 0, 5)).toBe('right');
    expect(L.facingInto(a, a.cols - 1, 5)).toBe('left');
    expect(L.facingInto(a, 5, a.rows - 1)).toBe('up');
  });

  it('never lets a shortcut be one-way', () => {
    const maps = MAP_LIST.map((m) => structuredClone(m));
    Object.assign(maps[0]!.exits[0]!, { lock: 'shortcut', oneWay: true });
    expect(mapsFileSchema.safeParse({ maps }).success).toBe(false);
  });
});

describe('map network', () => {
  const note = (exits: Record<string, M.ExitNote>) => ({ descriptionVi: '', createdAt: '', updatedAt: '', exits });

  it('draws the published world as two-way edges, laid out by zone, with no warning', () => {
    const d = data();
    const edges = N.networkEdges(d);
    const pairs = new Set(MAP_LIST.flatMap((m) => m.exits.map((e) => [m.id, e.to].sort().join('|'))));
    expect(edges.map((e) => e.key).sort()).toEqual([...pairs].sort());
    expect(edges.every((e) => e.twoWay && !e.inactive && e.problems.length === 0)).toBe(true);
    const pos = N.nodePositions(d);
    expect(Object.keys(pos).sort()).toEqual(MAP_LIST.map((m) => m.id).sort());
    expect(new Set(Object.values(pos).map((p) => `${p.x},${p.y}`)).size).toBe(MAP_LIST.length);
    expect(N.networkWarnings(d)).toEqual([]);
  });

  it('keeps the admin placement and warns about an area with no connection', () => {
    const lone = M.blankMap({ id: 'map_net_lone', nameVi: 'Một Mình', zoneId, cols: 30, rows: 20 });
    const d = data({ [lone.id]: { map: lone, road: 'branch' } }, { [lone.id]: { descriptionVi: '', createdAt: '', updatedAt: '', node: { x: 5, y: 6 } } });
    expect(N.nodePositions(d)[lone.id]).toEqual({ x: 5, y: 6 });
    const w = N.networkWarnings(d).filter((x) => x.mapId === lone.id);
    expect(w.some((x) => x.text.includes('chưa có kết nối'))).toBe(true);
    expect(w.some((x) => x.text === 'Một Mình: không đi tới được từ cửa vùng Bìa Rừng')).toBe(true);
  });

  it('flags one-way edges, a missing spawn, and an inactive exit that is the only way in', () => {
    const a = M.blankMap({ id: 'map_net_a', nameVi: 'Nối A', zoneId: MAPS.map_forest_deep!.zoneId, cols: 30, rows: 20 });
    const b = structuredClone(MAPS.map_forest_deep!);
    const d = data({ [a.id]: { map: a, road: 'branch' }, [b.id]: { map: b, road: 'main' } });
    const go = L.newExit(b, a, { x: 60, y: 8 }, L.takenIds(d));
    L.landOn(go, a, L.spawnAt(a, b, 2, 9));
    const back = L.newExit(a, b, { x: 1, y: 9 }, L.takenIds(d));
    L.landOn(back, b, 'spawn_default');
    expect(N.networkEdges(d).find((e) => e.key === `${b.id}|${a.id}`.split('|').sort().join('|'))!.twoWay).toBe(true);
    expect(N.networkWarnings(d).filter((w) => w.mapId === a.id || w.mapId === b.id)).toEqual([]);
    // The way in switched off: it is the only way to A.
    const off = { ...d, meta: { [b.id]: note({ [go.id]: { inactive: true } }) } };
    expect(N.networkWarnings(off).some((w) => w.exitId === go.id && w.text.includes('lối đi duy nhất'))).toBe(true);
    expect(N.networkEdges(off).find((e) => e.exits.some((x) => x.exit.id === go.id))!.twoWay).toBe(false);
    // Landing on a spawn A does not have.
    go.arrive = 'spawn_gone';
    expect(N.networkWarnings(d).some((w) => w.exitId === go.id && w.level === 'error')).toBe(true);
  });
});

describe('map editor model', () => {
  const area = () => structuredClone(MAPS.map_forest_deep!);

  it('lists every object once, hits the top one, and selects by rectangle', () => {
    const m = area();
    const objs = E.objectsOf(m);
    const count = m.covers.length + m.props.length + m.exits.length + m.gates.length + 1 + (m.shrine ? 1 : 0) + m.chests.length + m.nodes.length + m.puzzles.length + m.springs.length + m.npcs.length + m.lore.length + m.groups.length + (m.spawns?.length ?? 0) + 1;
    expect(objs).toHaveLength(count);
    expect(E.objectAt(m, m.spawn.x, m.spawn.y)!.kind).toBe('spawn');
    const chest = m.chests[0]!;
    expect(E.objectAt(m, chest.x, chest.y)).toMatchObject({ kind: 'chests', id: chest.id });
    expect(E.objectsIn(m, chest.x - 1, chest.y - 1, chest.x + 1, chest.y + 1).some((o) => o.id === chest.id)).toBe(true);
  });

  it('moves, resizes and duplicates objects in the game grid, keeping a group inside the area', () => {
    const m = area();
    const gate = m.gates[0]!;
    E.setBox(m, { kind: 'gates', id: gate.id }, { x: 5, y: 6, w: 3, h: 2 });
    expect(m.gates[0]).toMatchObject({ x: 5, y: 6, w: 3, h: 2 });
    E.setBox(m, { kind: 'chests', id: m.chests[0]!.id }, { x: 9999, y: -5 });
    expect(m.chests[0]).toMatchObject({ x: m.cols - 1, y: 0 });
    const refs = [{ kind: 'chests' as const, id: m.chests[0]!.id }, { kind: 'spawn' as const, id: 'spawn_default' }];
    const before = m.spawn.x;
    E.moveObjects(m, refs, 50, 0); // the chest is at the right edge: nothing moves
    expect(m.spawn.x).toBe(before);
    const taken = M.thingIds(MAP_LIST);
    const copy = E.duplicateObject(m, { kind: 'chests', id: m.chests[1]!.id }, { x: 3, y: 3 }, taken)!;
    expect(copy.id).toMatch(/^chest_forest_deep_/);
    expect(m.chests.find((c) => c.id === copy.id)).toMatchObject({ x: 3, y: 3, table: m.chests[1]!.table });
    expect(E.duplicateObject(m, { kind: 'portal', id: m.id }, { x: 1, y: 1 }, taken)).toBeNull();
  });

  it('removes only what no save holds and nothing points at', () => {
    const m = area();
    const pub = MAPS.map_forest_deep!;
    const why = E.removeObjects(m, [{ kind: 'chests', id: m.chests[0]!.id }, { kind: 'portal', id: m.id }], pub);
    expect(why).toHaveLength(2);
    expect(m.chests).toHaveLength(pub.chests.length);
    const copy = E.duplicateObject(m, { kind: 'springs', id: m.springs[0]!.id }, { x: 3, y: 3 }, M.thingIds(MAP_LIST))!;
    expect(E.removeObjects(m, [copy], pub)).toEqual([]);
    expect(m.springs.some((s) => s.id === copy.id)).toBe(false);
    const used = m.spawns![0]!.id;
    expect(E.removeObjects(m, [{ kind: 'spawns', id: used }], pub, new Set([used]))[0]).toMatch(/lối ra/);
    const props = m.props.length;
    E.removeObjects(m, [{ kind: 'props', id: '0' }], pub);
    expect(m.props).toHaveLength(props - 1);
  });

  it('paints ground by stroke, rectangle and flood, and heights on painted areas', () => {
    const m = M.blankMap({ id: 'map_paint', nameVi: 'Tô', zoneId, cols: 20, rows: 12 });
    E.paintTerrain(m, E.strokeTiles({ x: 2, y: 2 }, { x: 6, y: 2 }, 1), '~');
    expect(m.terrain[2]!.slice(2, 7)).toBe('~~~~~');
    E.paintTerrain(m, E.rectTiles({ x: 10, y: 8 }, { x: 8, y: 6 }), ',');
    expect(m.terrain[7]!.slice(8, 11)).toBe(',,,');
    expect(E.floodTiles(m, { x: 4, y: 2 })).toHaveLength(5);
    expect(E.strokeTiles({ x: 0, y: 0 }, { x: 0, y: 0 }, 3)).toHaveLength(9);
    expect(mapSchema.safeParse(m).success).toBe(true);
    expect(E.paintElevation(m, [{ x: 1, y: 1 }], 4)).toBe(false);
    const painted = area();
    expect(E.paintElevation(painted, [{ x: 1, y: 1 }], 12)).toBe(true);
    expect(painted.scene!.elevation![1]![1]).toBe('9');
  });

  it('undoes and redoes whole copies', () => {
    const h = new E.EditHistory<{ n: number }>(2);
    let s = { n: 0 };
    for (const n of [1, 2, 3]) {
      h.record(s);
      s = { n };
    }
    s = h.undo(s)!;
    s = h.undo(s)!;
    expect(s.n).toBe(1);
    expect(h.undo(s)).toBeNull(); // only 2 kept
    s = h.redo(s)!;
    expect(s.n).toBe(2);
  });
});

describe('decorations in the editor', () => {
  it('places, moves by whole tiles keeping the fraction, duplicates and removes a decoration', () => {
    const m = structuredClone(MAPS.map_forest_deep!);
    const taken = M.thingIds(MAP_LIST);
    const ref = E.addDecor(m, 'decor_forest_oak', { x: 10.3, y: 12.8 }, taken);
    expect(m.scenery).toEqual([{ id: ref.id, asset: 'decor_forest_oak', x: 10.5, y: 13 }]);
    const box = E.decorBox(m.scenery![0]!);
    expect(E.objectAt(m, box.x + 1, box.y + 1)).toMatchObject({ kind: 'scenery', id: ref.id });
    E.moveObjects(m, [ref], 2, -1);
    expect(m.scenery![0]).toMatchObject({ x: 12.5, y: 12 });
    const copy = E.duplicateObject(m, ref, { x: box.x + 5, y: box.y + 3 }, taken)!;
    // The box moved by (2, -1): the copy lands (3, 4) tiles from it, the same fraction kept.
    expect(m.scenery!.find((d) => d.id === copy.id)).toMatchObject({ asset: 'decor_forest_oak', x: 15.5, y: 16 });
    expect(E.removeObjects(m, [ref, copy], MAPS.map_forest_deep)).toEqual([]);
    expect(m.scenery).toBeUndefined();
  });

  it('appends a picture to the manifest in its own layout and counts where assets stand', () => {
    const text = '{\n  "props": [\n    {\n      "id": "a",\n      "status": "production",\n      "asset": "props/a.png"\n    }\n  ],\n  "ui": []\n}\n';
    const out = appendPropRow(text, { id: 'adv_decor_x', asset: 'props/adventure_decor/adv_decor_x.png' });
    expect(JSON.parse(out).props.map((r: { id: string }) => r.id)).toEqual(['a', 'adv_decor_x']);
    expect(out).toContain('    {\n      "id": "adv_decor_x",\n      "status": "production",');
    expect(assetUse(mkdtempSync(join(tmpdir(), 'sobi-assetuse-')))).toEqual({});
  });
});

describe('publish plan', () => {
  const en = JSON.parse(readFileSync('content/i18n/en.json', 'utf8'))['adventure/maps.json'] as Record<string, string>;

  it('publishes nothing new over the shipped world cleanly', () => {
    const plan = P.planPublish(data(), [], en);
    expect(plan.checks).toEqual([]);
    expect(plan.english).toEqual([]);
    expect(plan.maps).toHaveLength(MAP_LIST.length);
  });

  it('adds a connected new area to its zone, asks for its English, and moves exits onto a moved spawn', () => {
    const a = M.blankMap({ id: 'map_pub_new', nameVi: 'Hang Mới', zoneId: MAPS.map_forest_deep!.zoneId, cols: 30, rows: 20 });
    const b = structuredClone(MAPS.map_forest_deep!);
    const d = data({ [a.id]: { map: a, road: 'branch' }, [b.id]: { map: b, road: 'main' } });
    const go = L.newExit(b, a, { x: 60, y: 8 }, L.takenIds(d));
    L.landOn(go, a, L.spawnAt(a, b, 2, 9));
    const back = L.newExit(a, b, { x: 1, y: 9 }, L.takenIds(d));
    L.landOn(back, b, b.spawns![0]!.id);
    // Move the spawn the old exit of Bìa Rừng lands on: that published area's exit follows.
    const sp = b.spawns![0]!;
    M.moveSpawn(b, sp.id, sp.x, sp.y + 1);
    L.landOn(back, b, sp.id);
    const plan = P.planPublish(d, [a.id, b.id], en);
    expect(plan.checks.filter((c) => c.level === 'error')).toEqual([]);
    expect(plan.zones.find((z) => z.id === a.zoneId)!.branches).toContain(a.id);
    expect(plan.moved.length).toBeGreaterThan(0);
    expect(plan.changed).toEqual(expect.arrayContaining([a.id, b.id]));
    const paths = plan.english.map((t) => t.path);
    expect(paths).toEqual(expect.arrayContaining([`maps/${a.id}/nameVi`, `maps/${a.id}/spawns/spawn_from_forest_deep/nameVi`]));
    expect(P.blockingChecks(plan, {}).length).toBe(plan.english.length);
    const answers = Object.fromEntries(plan.english.map((t) => [t.path, 'x']));
    expect(P.blockingChecks(plan, answers)).toEqual([]);
  });

  it('refuses a draft whose exit leads to an unpublished area, a dropped saved id, and a zone change', () => {
    const a = M.blankMap({ id: 'map_pub_alone', nameVi: 'Một Mình', zoneId: MAPS.map_forest_deep!.zoneId, cols: 30, rows: 20 });
    const b = structuredClone(MAPS.map_forest_deep!);
    const d = data({ [a.id]: { map: a, road: 'branch' }, [b.id]: { map: b, road: 'main' } });
    L.newExit(b, a, { x: 60, y: 8 }, L.takenIds(d));
    b.chests = b.chests.slice(1);
    b.zoneId = 'zone_mountain';
    const errors = P.planPublish(d, [b.id], en).checks.filter((c) => c.level === 'error').map((c) => c.text).join('\n');
    expect(errors).toMatch(/chưa publish/);
    expect(errors).toMatch(/Không được xoá id/);
    expect(errors).toMatch(/không đổi vùng/);
  });

  it('leaves inactive exits and switched-off drafts out', () => {
    const b = structuredClone(MAPS.map_forest_deep!);
    const a = M.blankMap({ id: 'map_pub_off', nameVi: 'Tắt', zoneId: b.zoneId, cols: 30, rows: 20 });
    const d0 = data({ [a.id]: { map: a, road: 'branch' }, [b.id]: { map: b, road: 'main' } });
    const go = L.newExit(b, a, { x: 60, y: 8 }, L.takenIds(d0));
    const d = { ...d0, meta: { [b.id]: { descriptionVi: '', createdAt: '', updatedAt: '', exits: { [go.id]: { inactive: true } } }, [a.id]: { descriptionVi: '', createdAt: '', updatedAt: '', disabled: true } } };
    const plan = P.planPublish(d, [a.id, b.id], en);
    expect(plan.ids).toEqual([b.id]);
    expect(plan.maps.find((m) => m.id === b.id)!.exits.some((e) => e.id === go.id)).toBe(false);
    expect(plan.checks.filter((c) => c.level === 'error')).toEqual([]);
  });
});

describe('history', () => {
  it('lists the earlier versions of an area and brings one back as its draft', async () => {
    const d = mkdtempSync(join(tmpdir(), 'sobi-history-'));
    const at = '2026-11-02T10:00:00.000Z';
    const folder = join(d, 'history', 'map_forest_deep');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, '2026-11-02T10-00-00-000Z.json'), JSON.stringify({ at, map: { ...MAPS.map_forest_deep!, nameVi: 'Rừng Sâu cũ' } }));
    expect(mapHistory('map_forest_deep', d).body).toEqual({ versions: [at] });
    expect(mapHistory('../etc', d).status).toBe(400);
    expect((await restoreVersion({ id: 'map_forest_deep', at }, load, d)).status).toBe(200);
    expect(readDrafts(d).map_forest_deep).toMatchObject({ road: 'main', map: { nameVi: 'Rừng Sâu cũ' } });
    expect((await restoreVersion({ id: 'map_forest_deep', at: 'nope' }, load, d)).status).toBe(400);
  });
});
