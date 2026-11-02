// Map Builder model (decision 047): the pure operations behind "Quản lý map" — the status of each area (published / draft / off), new
// areas (blank or from a template), copies with fresh ids for everything a save may remember, the ways that lead into an area, and
// whether its id may still change. The page and the dev API (scripts/admin/mapDrafts.ts) both go through these, so they are tested.
import type { AreaMap, Zone } from '../../src/areas/adventure/logic/config/content';
import { mapProblems } from '../../src/areas/adventure/logic/maps';

/** What the builder keeps beside an area (tools/admin/data/adventure/meta.json): never read by the game. */
export interface MapMeta {
  descriptionVi: string;
  /** Put aside: an area never published that cannot be published until switched on again. */
  disabled?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  /** Where its node sits on the map network (GĐ5): layout only, no gameplay. */
  node?: { x: number; y: number };
}

/** An area being designed: the whole row of maps.json (problems allowed) and where it goes in its zone once published. */
export interface MapDraft {
  map: AreaMap;
  road: 'main' | 'branch';
}

export interface BuilderData {
  published: readonly AreaMap[];
  zones: readonly Zone[];
  drafts: Readonly<Record<string, MapDraft>>;
  meta: Readonly<Record<string, MapMeta>>;
}

export type MapStatus = 'published' | 'changed' | 'draft' | 'disabled';

export const STATUS_LABEL: Record<MapStatus, string> = {
  published: 'Đã publish',
  changed: 'Đã publish · có nháp',
  draft: 'Nháp',
  disabled: 'Tạm tắt',
};

/** Size limits of a new area, in tiles. */
export const MAP_SIZE = { minCols: 16, maxCols: 160, minRows: 12, maxRows: 90 } as const;

export const isPublished = (data: BuilderData, id: string): boolean => data.published.some((m) => m.id === id);

export function statusOf(data: BuilderData, id: string): MapStatus {
  if (isPublished(data, id)) return data.drafts[id] ? 'changed' : 'published';
  return data.meta[id]?.disabled ? 'disabled' : 'draft';
}

/** Every area as the builder sees it: published rows with their drafts laid over, then the new drafts. */
export function workingMaps(data: BuilderData): AreaMap[] {
  const out = data.published.map((m) => data.drafts[m.id]?.map ?? m);
  for (const [id, d] of Object.entries(data.drafts)) if (!isPublished(data, id)) out.push(d.map);
  return out;
}

/** The zone an area belongs to and whether it walks its main road. */
export function roadOf(data: BuilderData, id: string): 'main' | 'branch' | null {
  const draft = data.drafts[id];
  if (draft && !isPublished(data, id)) return draft.road;
  const zone = data.zones.find((z) => z.maps.includes(id) || z.branches?.includes(id));
  return zone ? (zone.maps.includes(id) ? 'main' : 'branch') : (draft?.road ?? null);
}

/** A name as an id stem: no accents, lower case, `_` between words ("Rừng Đêm" → "rung_dem"). */
export function slugOf(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
    .replace(/_+$/, '');
  return slug || 'moi';
}

/** `<prefix>_<stem>`, or with `_2`, `_3`… when taken. */
export function freeId(prefix: string, stem: string, taken: ReadonlySet<string>): string {
  const base = `${prefix}_${stem}`;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) if (!taken.has(`${base}_${n}`)) return `${base}_${n}`;
}

/** The lists of an area whose rows carry their own id (unique across the game: saves hold them). */
const LISTS = ['exits', 'chests', 'nodes', 'gates', 'covers', 'puzzles', 'springs', 'npcs', 'lore', 'groups'] as const;

/** Every id of the things standing on these areas. */
export function thingIds(maps: readonly AreaMap[]): Set<string> {
  const out = new Set<string>();
  for (const m of maps) {
    for (const key of LISTS) for (const row of m[key]) out.add(row.id);
    if (m.shrine) out.add(m.shrine.id);
  }
  return out;
}

/** Every map id in use, published or draft. */
export const mapIds = (data: BuilderData): Set<string> => new Set([...data.published.map((m) => m.id), ...Object.keys(data.drafts)]);

export interface NewMapArgs {
  id: string;
  nameVi: string;
  zoneId: string;
  cols: number;
  rows: number;
}

/** A blank area: blocked rim, open ground inside, the spawn in the middle and the portal beside it. */
export function blankMap(a: NewMapArgs): AreaMap {
  const cols = Math.min(MAP_SIZE.maxCols, Math.max(MAP_SIZE.minCols, Math.round(a.cols)));
  const rows = Math.min(MAP_SIZE.maxRows, Math.max(MAP_SIZE.minRows, Math.round(a.rows)));
  const inner = `#${'.'.repeat(cols - 2)}#`;
  const rim = '#'.repeat(cols);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  return {
    id: a.id,
    zoneId: a.zoneId,
    nameVi: a.nameVi,
    corruption: 0,
    tile: 40,
    cols,
    rows,
    terrain: Array.from({ length: rows }, (_, y) => (y === 0 || y === rows - 1 ? rim : inner)),
    spawn: { x: cx, y: cy },
    portal: { x: cx + 2, y: cy - 1 },
    exits: [],
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

/**
 * A copy of `src` as a new area: its ground, background and everything on it, each thing under a fresh id (`chest_<stem>_1`…) so no
 * save confuses the two, the puzzles pointing at the copied gates. Its exits are left out: a connection is set up on purpose, at both
 * ends, never copied.
 */
export function copyMap(src: AreaMap, a: { id: string; nameVi: string; zoneId?: string }, taken: ReadonlySet<string>): AreaMap {
  const map = structuredClone(src);
  const stem = a.id.replace(/^map_/, '');
  const used = new Set(taken);
  const fresh = (prefix: string) => {
    let n = 1;
    while (used.has(`${prefix}_${stem}_${n}`)) n += 1;
    const id = `${prefix}_${stem}_${n}`;
    used.add(id);
    return id;
  };
  const gateIds = new Map<string, string>();
  map.id = a.id;
  map.nameVi = a.nameVi;
  map.zoneId = a.zoneId ?? src.zoneId;
  map.exits = [];
  map.chests = map.chests.map((r) => ({ ...r, id: fresh('chest') }));
  map.nodes = map.nodes.map((r) => ({ ...r, id: fresh(r.kind) }));
  map.gates = map.gates.map((r) => {
    const id = fresh('gate');
    gateIds.set(r.id, id);
    return { ...r, id };
  });
  map.covers = map.covers.map((r) => ({ ...r, id: fresh('cover') }));
  map.puzzles = map.puzzles.map((r) => ({ ...r, id: fresh('puzzle'), gate: gateIds.get(r.gate) ?? r.gate }));
  map.springs = map.springs.map((r) => ({ ...r, id: fresh('spring') }));
  map.npcs = map.npcs.map((r) => ({ ...r, id: fresh('npc') }));
  map.lore = map.lore.map((r) => ({ ...r, id: fresh('lore') }));
  map.groups = map.groups.map((r) => ({ ...r, id: fresh('g') }));
  if (map.shrine) map.shrine = { ...map.shrine, id: fresh('shrine') };
  return map;
}

/** A way into an area: the exit `exitId` of `from` leads to it. */
export interface MapRef {
  from: string;
  fromName: string;
  exitId: string;
  /** Only in a draft of `from` (not in the published game). */
  draftOnly: boolean;
}

/** Every exit that leads to `mapId`, published or in a draft. */
export function referencesTo(data: BuilderData, mapId: string): MapRef[] {
  const out: MapRef[] = [];
  const seen = new Set<string>();
  for (const m of workingMaps(data))
    for (const e of m.exits)
      if (e.to === mapId && m.id !== mapId) {
        seen.add(`${m.id}/${e.id}`);
        const live = data.published.find((p) => p.id === m.id)?.exits.some((x) => x.id === e.id && x.to === mapId) ?? false;
        out.push({ from: m.id, fromName: m.nameVi, exitId: e.id, draftOnly: !live });
      }
  // A published exit its draft has since removed still leads there in the game.
  for (const m of data.published)
    for (const e of m.exits)
      if (e.to === mapId && m.id !== mapId && !seen.has(`${m.id}/${e.id}`)) out.push({ from: m.id, fromName: m.nameVi, exitId: e.id, draftOnly: false });
  return out;
}

/** The id of an area may change only while nobody can know it: never published, no exit leading to it. */
export const canChangeId = (data: BuilderData, id: string): boolean => !isPublished(data, id) && referencesTo(data, id).length === 0;

/** Why `id` cannot be the id of an area (or null). */
export function mapIdProblem(data: BuilderData, id: string, previousId?: string): string | null {
  if (!/^map_[a-z0-9_]+$/.test(id)) return 'Id map phải dạng map_ten_khu (chữ thường không dấu, số, dấu _)';
  if (id !== previousId && mapIds(data).has(id)) return `Id ${id} đã có map khác dùng`;
  return null;
}

/** One row of the "Quản lý map" table. */
export interface MapSummary {
  id: string;
  nameVi: string;
  zoneId: string;
  road: 'main' | 'branch' | null;
  cols: number;
  rows: number;
  status: MapStatus;
  exitsOut: number;
  exitsIn: number;
  problems: string[];
  updatedAt: string | null;
  descriptionVi: string;
}

export function summaries(data: BuilderData): MapSummary[] {
  return workingMaps(data).map((m) => ({
    id: m.id,
    nameVi: m.nameVi,
    zoneId: m.zoneId,
    road: roadOf(data, m.id),
    cols: m.cols,
    rows: m.rows,
    status: statusOf(data, m.id),
    exitsOut: m.exits.length,
    exitsIn: referencesTo(data, m.id).length,
    problems: mapProblems(m),
    updatedAt: data.meta[m.id]?.updatedAt ?? null,
    descriptionVi: data.meta[m.id]?.descriptionVi ?? '',
  }));
}
