// Publishing the Map Builder's drafts on the dev API (decision 047, GĐ7): all or nothing. The plan (tools/admin/mapPublish.ts, the
// same one the page shows) must have no error and every English text answered; then maps.json, zones.json and en.json are written
// together and the game loads every content module again — any failure puts all three files back. On success each replaced area's
// previous row goes to history/<mapId>/<time>.json, the published drafts leave the store (one with inactive exits keeps them as a
// draft), and the notes get the publish time. A version from the history comes back as a draft, to be published like any other.
//   POST /adventure/maps/publish { ids, english }   GET /adventure/maps/history?id=   POST /adventure/maps/restore { id, at }
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import type { BuilderData, MapDraft } from '../../tools/admin/mapModel';
import type * as Publish from '../../tools/admin/mapPublish';
import { contentJson } from '../content/format';
import { writeText } from './artFiles';
import { readContent } from './contentFiles';
import { CONTENT_MODULES, type SaveDeps } from './contentSave';
import { MAP_DATA_DIR, readDrafts, readMeta, saveMapDraft } from './mapDrafts';

type Mod = Record<string, unknown>;
type Result = { status: number; body: unknown };
type Raw = Record<string, unknown> & { id: string };

const MAPS = 'content/adventure/maps.json';
const ZONES = 'content/adventure/zones.json';
const EN = 'content/i18n/en.json';
const refuse = (error: string): Result => ({ status: 400, body: { error } });
const historyDir = (dir: string, id: string) => join(dir, 'history', id);
const stamp = (iso: string) => iso.replace(/[:.]/g, '-');

/** The builder's data parsed by the game's schemas (defaults filled in), as the page sees it. */
export async function builderData(load: (p: string) => Promise<Mod>, dir: string): Promise<BuilderData> {
  const maps = (await load('/content/schemas/adventure/maps.ts')) as { mapSchema: { parse: (v: unknown) => AreaMap } };
  const zones = (await load('/content/schemas/adventure/zones.ts')) as { zoneSchema: { parse: (v: unknown) => BuilderData['zones'][number] } };
  const drafts = readDrafts(dir);
  return {
    published: (readContent('adventure/maps.json') as { maps: unknown[] }).maps.map((m) => maps.mapSchema.parse(m)),
    zones: (readContent('adventure/zones.json') as { zones: unknown[] }).zones.map((z) => zones.zoneSchema.parse(z)),
    drafts: Object.fromEntries(Object.entries(drafts).map(([id, d]) => [id, { road: d.road, map: maps.mapSchema.parse(d.map) }])),
    meta: readMeta(dir),
  };
}

export async function publishMaps(body: { ids: string[]; english: Record<string, string> }, deps: SaveDeps, dir = MAP_DATA_DIR): Promise<Result> {
  const P = (await deps.load('/tools/admin/mapPublish.ts')) as unknown as typeof Publish;
  const data = await builderData(deps.load, dir);
  const enBefore = readFileSync(EN, 'utf8');
  const en = JSON.parse(enBefore) as Record<string, Record<string, string>>;
  const plan = P.planPublish(data, body.ids ?? [], en[P.MAPS_FILE] ?? {});
  if (plan.ids.length === 0) return refuse('Chưa chọn bản nháp nào để publish');
  const answers = body.english ?? {};
  const blocking = P.blockingChecks(plan, answers);
  if (blocking.length) return refuse(blocking.map((c) => c.text).join('\n'));

  // maps.json: untouched rows as written, chosen drafts as planned, other areas only their moved exits.
  const mapsBefore = readFileSync(MAPS, 'utf8');
  const zonesBefore = readFileSync(ZONES, 'utf8');
  const raw = (JSON.parse(mapsBefore) as { maps: Raw[] }).maps;
  const rows = plan.maps.map((m): unknown => {
    const was = raw.find((r) => r.id === m.id);
    if (plan.ids.includes(m.id) || !was) return m;
    if (!plan.changed.includes(m.id)) return was;
    const exits = (was.exits as Raw[]).map((e) => {
      const now = m.exits.find((x) => x.id === e.id);
      return now && plan.moved.includes(e.id) ? { ...e, arriveX: now.arriveX, arriveY: now.arriveY, ...(now.facing ? { facing: now.facing } : {}) } : e;
    });
    return { ...was, exits };
  });
  const zonesFile = JSON.parse(zonesBefore) as { zones: Raw[] } & Record<string, unknown>;
  const zones = zonesFile.zones.map((z) => {
    const planned = plan.zones.find((x) => x.id === z.id)!;
    return { ...z, maps: planned.maps, ...(planned.branches ? { branches: planned.branches } : {}) };
  });
  const texts = { ...en[P.MAPS_FILE] };
  for (const t of plan.english) texts[t.path] = (answers[t.path] ?? t.en).trim();
  const restore = () => {
    writeText(MAPS, mapsBefore);
    writeText(ZONES, zonesBefore);
    writeText(EN, enBefore);
    deps.invalidate();
  };
  try {
    writeText(MAPS, contentJson({ maps: rows }));
    writeText(ZONES, contentJson({ ...zonesFile, zones }));
    writeText(EN, contentJson({ ...en, [P.MAPS_FILE]: texts }));
    deps.invalidate();
    for (const mod of CONTENT_MODULES) await deps.load(mod);
  } catch (e) {
    restore();
    return refuse(`Game không nạp được dữ liệu mới, đã khôi phục: ${e instanceof Error ? e.message : String(e)}`);
  }

  // History, drafts, notes.
  const at = new Date().toISOString();
  const meta = readMeta(dir);
  for (const id of plan.ids) {
    const was = raw.find((r) => r.id === id);
    if (was) {
      mkdirSync(historyDir(dir, id), { recursive: true });
      writeText(join(historyDir(dir, id), `${stamp(at)}.json`), contentJson({ at, map: was }));
    }
    const notes = meta[id]?.exits ?? {};
    const draft = data.drafts[id]!;
    const kept = draft.map.exits.filter((e) => notes[e.id]?.inactive);
    const file = join(dir, 'drafts', `${id}.json`);
    if (kept.length === 0) rmSync(file, { force: true });
    else writeText(file, contentJson({ road: draft.road, map: { ...plan.maps.find((m) => m.id === id)!, exits: [...plan.maps.find((m) => m.id === id)!.exits, ...kept] } }));
    meta[id] = { descriptionVi: '', createdAt: at, ...meta[id], updatedAt: at, publishedAt: at };
  }
  mkdirSync(dir, { recursive: true });
  writeText(join(dir, 'meta.json'), contentJson({ maps: Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b))) }));
  return { status: 200, body: { ok: true, published: plan.ids, moved: plan.moved, at } };
}

/** GET /adventure/maps/history?id=: the earlier published versions of an area, newest first. */
export function mapHistory(id: string, dir = MAP_DATA_DIR): Result {
  if (!/^map_[a-z0-9_]+$/.test(id)) return refuse('Id map không hợp lệ');
  const folder = historyDir(dir, id);
  const versions = existsSync(folder)
    ? readdirSync(folder)
        .filter((f) => f.endsWith('.json'))
        .map((f) => (JSON.parse(readFileSync(join(folder, f), 'utf8')) as { at: string }).at)
        .sort()
        .reverse()
    : [];
  return { status: 200, body: { versions } };
}

/** POST /adventure/maps/restore { id, at }: that earlier version becomes the area's draft (published later like any draft). */
export async function restoreVersion(body: { id: string; at: string }, load: (p: string) => Promise<Mod>, dir = MAP_DATA_DIR): Promise<Result> {
  if (!/^map_[a-z0-9_]+$/.test(body.id)) return refuse('Id map không hợp lệ');
  const file = join(historyDir(dir, body.id), `${stamp(String(body.at))}.json`);
  if (!existsSync(file)) return refuse('Không có phiên bản đó');
  const { map } = JSON.parse(readFileSync(file, 'utf8')) as { map: AreaMap };
  const maps = (await load('/content/schemas/adventure/maps.ts')) as { mapSchema: { parse: (v: unknown) => AreaMap } };
  const zones = (readContent('adventure/zones.json') as { zones: { id: string; maps: string[] }[] }).zones;
  const draft: MapDraft = { map: maps.mapSchema.parse(map), road: zones.some((z) => z.maps.includes(body.id)) ? 'main' : 'branch' };
  return saveMapDraft({ draft }, load, dir);
}
