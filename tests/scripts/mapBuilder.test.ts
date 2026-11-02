// Map Builder GĐ2 (decision 047): the pure model of "Quản lý map" (new areas, copies, references, status), the save-held ids a content
// save may never drop, and the draft store of the dev API (in a throw-away folder).
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as mapsSchemaModule from '../../content/schemas/adventure/maps';
import { mapSchema } from '../../content/schemas/adventure/maps';
import { MAP_LIST, MAPS, ZONE_LIST } from '../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { mapProblems } from '../../src/areas/adventure/logic/maps';
import { deleteMapDraft, readDrafts, readMeta, saveMapDraft, saveMapMeta } from '../../scripts/admin/mapDrafts';
import { savedIdProblems, savedMapIds } from '../../scripts/admin/mapIds';
import * as M from '../../tools/admin/mapModel';

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
  });
});
