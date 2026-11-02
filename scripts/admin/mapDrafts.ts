// Map Builder store on the dev API (decision 047): the drafts of Adventure areas and the builder's own notes, kept in
// tools/admin/data/adventure/ — never read by the game, so nothing here changes what is played until it is published.
//   drafts/<mapId>.json  { road, map }   one area being designed (the whole maps.json row; map problems allowed)
//   meta.json            { maps: { <mapId>: MapMeta } }   description, switched off, times, network node
// A draft must keep the shape of maps.json (the game's own schema) and belong to a known zone; the id of a published area never
// changes; deleting the draft of a published area only drops its unpublished changes.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { MapDraft, MapMeta } from '../../tools/admin/mapModel';
import { contentJson } from '../content/format';
import { writeText } from './artFiles';
import { readContent, schemaProblems } from './contentFiles';

type Mod = Record<string, unknown>;
type Result = { status: number; body: unknown };

export const MAP_DATA_DIR = 'tools/admin/data/adventure';

const ID = /^map_[a-z0-9_]+$/;
const refuse = (error: string): Result => ({ status: 400, body: { error } });
const draftsDir = (dir: string) => join(dir, 'drafts');
const draftFile = (dir: string, id: string) => join(draftsDir(dir), `${id}.json`);
const metaFile = (dir: string) => join(dir, 'meta.json');
const nowIso = () => new Date().toISOString();

const publishedIds = (): Set<string> => new Set(((readContent('adventure/maps.json') as { maps: { id: string }[] }).maps ?? []).map((m) => m.id));
const zoneIds = (): Set<string> => new Set(((readContent('adventure/zones.json') as { zones: { id: string }[] }).zones ?? []).map((z) => z.id));

export function readDrafts(dir = MAP_DATA_DIR): Record<string, MapDraft> {
  const folder = draftsDir(dir);
  if (!existsSync(folder)) return {};
  const out: Record<string, MapDraft> = {};
  for (const f of readdirSync(folder).filter((n) => n.endsWith('.json')).sort()) {
    const draft = JSON.parse(readFileSync(join(folder, f), 'utf8')) as MapDraft;
    out[draft.map.id] = draft;
  }
  return out;
}

export function readMeta(dir = MAP_DATA_DIR): Record<string, MapMeta> {
  return existsSync(metaFile(dir)) ? (JSON.parse(readFileSync(metaFile(dir), 'utf8')) as { maps: Record<string, MapMeta> }).maps : {};
}

function writeMeta(dir: string, maps: Record<string, MapMeta>) {
  mkdirSync(dir, { recursive: true });
  const sorted = Object.fromEntries(Object.entries(maps).sort(([a], [b]) => a.localeCompare(b)));
  writeText(metaFile(dir), contentJson({ maps: sorted }));
}

/** GET /adventure/maps: the published areas and zones (read from disk, not the page's bundle), the drafts, the notes. */
export function readMapBuilder(dir = MAP_DATA_DIR): Result {
  const maps = readContent('adventure/maps.json') as { maps: unknown[] };
  const zones = readContent('adventure/zones.json') as { zones: unknown[] };
  return { status: 200, body: { published: maps.maps, zones: zones.zones, drafts: readDrafts(dir), meta: readMeta(dir) } };
}

/**
 * POST /adventure/maps/draft { draft, create?, previousId? }: keep a draft — a new area (`create`: its id must be free), a change, or a
 * new id for a never-published one (`previousId`).
 */
export async function saveMapDraft(body: { draft: MapDraft; create?: boolean; previousId?: string }, load: (p: string) => Promise<Mod>, dir = MAP_DATA_DIR): Promise<Result> {
  const { draft, previousId } = body;
  const id = draft?.map?.id;
  if (typeof id !== 'string' || !ID.test(id)) return refuse('Id map phải dạng map_ten_khu (chữ thường không dấu, số, dấu _)');
  if (draft.road !== 'main' && draft.road !== 'branch') return refuse('Vị trí trong vùng phải là đường chính hoặc nhánh');
  if (!zoneIds().has(draft.map.zoneId)) return refuse(`Vùng ${draft.map.zoneId} không có trong zones.json`);
  const published = publishedIds();
  const renamed = previousId !== undefined && previousId !== id;
  if (renamed) {
    if (!ID.test(previousId)) return refuse('Id cũ không hợp lệ');
    if (published.has(previousId)) return refuse(`${previousId} đã publish: id không đổi được nữa`);
  }
  const exists = published.has(id) || existsSync(draftFile(dir, id));
  if (exists && (renamed || body.create)) return refuse(`Id ${id} đã có map khác dùng`);
  if (!exists && !renamed && !body.create) return refuse(`Không có map ${id}`);
  if (renamed && !existsSync(draftFile(dir, previousId))) return refuse(`Không có bản nháp ${previousId}`);
  const schema = await load('/content/schemas/adventure/maps.ts');
  const problems = schemaProblems(schema.mapSchema, draft.map);
  if (!problems.length) problems.push(...(schema.mapShapeProblems as (m: MapDraft['map']) => string[])(draft.map));
  if (problems.length) return refuse(`Bản nháp sai cấu trúc maps.json:\n${problems.join('\n')}`);

  mkdirSync(draftsDir(dir), { recursive: true });
  writeText(draftFile(dir, id), contentJson({ road: draft.road, map: draft.map }));
  const meta = readMeta(dir);
  const at = nowIso();
  const before = meta[renamed ? previousId : id];
  if (renamed) {
    rmSync(draftFile(dir, previousId), { force: true });
    delete meta[previousId];
  }
  meta[id] = { descriptionVi: '', ...before, createdAt: before?.createdAt ?? at, updatedAt: at };
  writeMeta(dir, meta);
  return { status: 200, body: { ok: true, id } };
}

/** POST /adventure/maps/delete { id }: a never-published area goes (draft and notes); a published one only loses its draft. */
export function deleteMapDraft(body: { id: string }, dir = MAP_DATA_DIR): Result {
  const { id } = body;
  if (typeof id !== 'string' || !ID.test(id)) return refuse('Id map không hợp lệ');
  const published = publishedIds().has(id);
  if (!existsSync(draftFile(dir, id)) && published) return refuse(`${id} đã publish và không có bản nháp: map đã publish không xoá được`);
  rmSync(draftFile(dir, id), { force: true });
  const meta = readMeta(dir);
  // A published area keeps its notes; an empty one (only the times of the dropped draft) goes with the draft.
  const note = meta[id];
  if (note && (!published || (!note.descriptionVi && !note.node && Object.keys(note.exits ?? {}).length === 0))) {
    delete meta[id];
    writeMeta(dir, meta);
  }
  return { status: 200, body: { ok: true, discarded: published } };
}

export type MetaPatch = Partial<Pick<MapMeta, 'descriptionVi' | 'disabled' | 'node' | 'exits'>>;

/** POST /adventure/maps/meta { id, patch }: the builder's notes on an area (description, switched off, network node, exit notes — `exits` replaces them all). */
export function saveMapMeta(body: { id: string; patch: MetaPatch }, dir = MAP_DATA_DIR): Result {
  const { id, patch } = body;
  if (typeof id !== 'string' || !ID.test(id)) return refuse('Id map không hợp lệ');
  const published = publishedIds().has(id);
  if (!published && !existsSync(draftFile(dir, id))) return refuse(`Không có map ${id}`);
  if (patch.descriptionVi !== undefined && (typeof patch.descriptionVi !== 'string' || patch.descriptionVi.length > 500)) return refuse('Mô tả tối đa 500 ký tự');
  if (patch.disabled !== undefined && (typeof patch.disabled !== 'boolean' || (published && patch.disabled))) return refuse('Map đã publish không tắt được');
  if (patch.node !== undefined && !(Number.isFinite(patch.node?.x) && Number.isFinite(patch.node?.y))) return refuse('Vị trí node không hợp lệ');
  if (patch.exits !== undefined) {
    const live = new Set(((readContent('adventure/maps.json') as { maps: { id: string; exits: { id: string }[] }[] }).maps.find((m) => m.id === id)?.exits ?? []).map((e) => e.id));
    for (const [exitId, note] of Object.entries(patch.exits ?? {})) {
      if (!/^exit_[a-z0-9_]+$/.test(exitId)) return refuse(`Id lối ra ${exitId} không hợp lệ`);
      if (note.nameVi !== undefined && (typeof note.nameVi !== 'string' || note.nameVi.length > 80)) return refuse('Tên lối ra tối đa 80 ký tự');
      if (note.inactive !== undefined && typeof note.inactive !== 'boolean') return refuse('inactive phải là true / false');
      if (note.inactive && live.has(exitId)) return refuse(`${exitId} đã publish: không tắt được (save giữ id)`);
    }
  }
  const meta = readMeta(dir);
  const at = nowIso();
  const keep = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as MetaPatch;
  // A node moved on the network is layout only: it does not count as a change of the area.
  const touched = patch.descriptionVi !== undefined || patch.disabled !== undefined || patch.exits !== undefined;
  const before = meta[id];
  meta[id] = { descriptionVi: '', createdAt: before?.createdAt ?? at, ...before, ...keep, updatedAt: touched || !before ? at : before.updatedAt };
  if (meta[id].disabled === false) delete meta[id].disabled;
  writeMeta(dir, meta);
  return { status: 200, body: { ok: true } };
}
