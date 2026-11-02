// Map Builder model (decision 047): the pure operations behind "Quản lý map" — the status of each area (published / draft / off), new
// areas (blank or from a template), copies with fresh ids for everything a save may remember, the ways that lead into an area, and
// whether its id may still change. The page and the dev API (scripts/admin/mapDrafts.ts) both go through these, so they are tested.
import { DEFAULT_SPAWN, arrivalProblems, spawnIn } from '../../content/schemas/adventure/maps';
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
  const working = workingMaps(data);
  return working.map((m) => ({
    id: m.id,
    nameVi: m.nameVi,
    zoneId: m.zoneId,
    road: roadOf(data, m.id),
    cols: m.cols,
    rows: m.rows,
    status: statusOf(data, m.id),
    exitsOut: m.exits.length,
    exitsIn: referencesTo(data, m.id).length,
    problems: [...mapProblems(m, working), ...arrivalMismatches(working, m)],
    updatedAt: data.meta[m.id]?.updatedAt ?? null,
    descriptionVi: data.meta[m.id]?.descriptionVi ?? '',
  }));
}

// ---- Spawn points (GĐ3) ---------------------------------------------------------------------------------------------------

export type Facing = NonNullable<AreaMap['exits'][number]['facing']>;
export type Exit = AreaMap['exits'][number];
export type Spawn = NonNullable<AreaMap['spawns']>[number];

/** How the game turns the party arriving by an exit with no `facing` (explore.ts `takeExit`). */
export const arrivalFacing = (e: Exit): Facing => e.facing ?? (e.x <= 1 ? 'left' : 'right');

/** Every arrival point of an area, its own spawn first (`spawn_default`: the portal and the camp land there, facing down). */
export function spawnsOf(map: AreaMap): Spawn[] {
  return [{ id: DEFAULT_SPAWN, nameVi: 'Mặc định (cổng dịch chuyển, từ Trại)', x: map.spawn.x, y: map.spawn.y, facing: 'down' }, ...(map.spawns ?? [])];
}

/** An exit of another area that lands in `mapId`. */
export interface Arrival {
  from: string;
  fromName: string;
  exit: Exit;
}

/** The exits of `maps` that land in `mapId`. */
export function arrivalsInto(maps: readonly AreaMap[], mapId: string): Arrival[] {
  return maps.flatMap((m) => m.exits.filter((e) => e.to === mapId).map((exit) => ({ from: m.id, fromName: m.nameVi, exit })));
}

/** The arrivals that land on a spawn: named for it, or (unnamed) on its tile. */
export const arrivalsOn = (arrivals: readonly Arrival[], sp: Spawn): Arrival[] =>
  arrivals.filter((a) => (a.exit.arrive ? a.exit.arrive === sp.id : a.exit.arriveX === sp.x && a.exit.arriveY === sp.y && sp.id !== DEFAULT_SPAWN));

/** The problems of the exits landing in `map` against its spawns (missing spawn, moved spawn). */
export function arrivalMismatches(maps: readonly AreaMap[], map: AreaMap): string[] {
  return arrivalsInto(maps, map.id).flatMap((a) => arrivalProblems(a.exit, map).map((p) => `${a.from}: ${p}`));
}

/**
 * Exits that name a spawn take its tile and facing (the publish step, and after a spawn moves). Returns new rows for the areas that
 * changed and the ids of the exits that moved; an exit whose spawn is gone stays as it was (validation reports it).
 */
export function resolveArrivals(maps: readonly AreaMap[]): { maps: AreaMap[]; moved: string[] } {
  const byId = new Map(maps.map((m) => [m.id, m]));
  const moved: string[] = [];
  const out = maps.map((m) => {
    let changed = false;
    const exits = m.exits.map((e) => {
      const dest = byId.get(e.to);
      const sp = e.arrive && dest ? spawnIn(dest, e.arrive) : undefined;
      if (!sp) return e;
      const facing = sp.facing ?? e.facing;
      if (sp.x === e.arriveX && sp.y === e.arriveY && facing === e.facing) return e;
      changed = true;
      moved.push(e.id);
      return { ...e, arriveX: sp.x, arriveY: sp.y, ...(facing ? { facing } : {}) };
    });
    return changed ? { ...m, exits } : m;
  });
  return { maps: out, moved };
}

/**
 * Names every unnamed arrival (the content before decision 047): each exit landing in an area gets a spawn there,
 * `spawn_from_<source>` at its tile, facing as the game turns it now — exits from one area to the same tile share it. Nothing moves
 * and nobody turns differently: the exit keeps its tile and gets the facing it already had.
 */
export function nameArrivals(maps: readonly AreaMap[]): AreaMap[] {
  const out = maps.map((m) => structuredClone(m));
  const byId = new Map(out.map((m) => [m.id, m]));
  for (const src of out) {
    for (const e of src.exits) {
      const dest = byId.get(e.to);
      if (e.arrive || !dest) continue;
      const facing = arrivalFacing(e);
      const spawns = (dest.spawns ??= []);
      let sp = spawns.find((s) => s.x === e.arriveX && s.y === e.arriveY && s.facing === facing);
      if (!sp) {
        sp = { id: freeId('spawn', `from_${src.id.replace(/^map_/, '')}`, new Set(spawns.map((s) => s.id))), nameVi: `Từ ${src.nameVi}`, x: e.arriveX, y: e.arriveY, facing };
        spawns.push(sp);
      }
      e.arrive = sp.id;
      e.facing = facing;
    }
  }
  return out;
}

/** A new named spawn on the area's own spawn tile (moved after): `spawn_<name>`, free within the area. */
export function addSpawn(map: AreaMap, nameVi: string): Spawn {
  const sp: Spawn = { id: freeId('spawn', slugOf(nameVi), new Set([DEFAULT_SPAWN, ...(map.spawns ?? []).map((s) => s.id)])), nameVi, x: map.spawn.x, y: map.spawn.y, facing: 'down' };
  map.spawns = [...(map.spawns ?? []), sp];
  return sp;
}

/** Moves a spawn (`spawn_default` = the area's own spawn) to a tile. */
export function moveSpawn(map: AreaMap, id: string, x: number, y: number) {
  if (id === DEFAULT_SPAWN) map.spawn = { x, y };
  else map.spawns = (map.spawns ?? []).map((s) => (s.id === id ? { ...s, x, y } : s));
}

/** Drops a named spawn unless an exit lands on it by name (that exit would point at nothing): returns why not, or null. */
export function removeSpawn(map: AreaMap, id: string, arrivals: readonly Arrival[]): string | null {
  if (id === DEFAULT_SPAWN) return 'Điểm mặc định không xoá được';
  const users = arrivals.filter((a) => a.exit.arrive === id);
  if (users.length) return `Đang có lối ra dẫn tới điểm này: ${users.map((a) => `${a.fromName} · ${a.exit.id}`).join(', ')}`;
  map.spawns = (map.spawns ?? []).filter((s) => s.id !== id);
  if (map.spawns.length === 0) delete map.spawns;
  return null;
}
