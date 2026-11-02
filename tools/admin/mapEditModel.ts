// The Map Editor's operations (decision 047, Map Builder GĐ6), pure: every object on an area as one list (spawns, portal, exits,
// groups, chests, nodes, gates, covers, puzzles, springs, travellers, lore, shrine, props), hit-testing, moving / resizing / removing /
// duplicating them, and the ground tools — brush lines, rectangles, flood fill, elevation. Coordinates are always the game's own tiles:
// the editor's zoom only changes the drawing. Undo / redo keep whole copies of the area (an area is a few kB).
import { DEFAULT_SPAWN } from '../../content/schemas/adventure/maps';
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { DECOR, PROPS } from '../../src/areas/adventure/logic/config/content';
import { savedMapIds } from '../../scripts/admin/mapIds';
import { freeId } from './mapModel';

/** The lists of rows with an id and a tile on an area. */
export const ROW_LISTS = ['exits', 'groups', 'chests', 'nodes', 'gates', 'covers', 'puzzles', 'springs', 'npcs', 'lore', 'spawns'] as const;
export type RowList = (typeof ROW_LISTS)[number];
export type ObjKind = RowList | 'spawn' | 'portal' | 'shrine' | 'props' | 'scenery';

/** One object on the grid: `id` = its row id (`spawn_default` / the area id for the spawn / portal, the index for a prop). */
export interface ObjRef {
  kind: ObjKind;
  id: string;
}

export interface EditObj extends ObjRef {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Its size can change (gates, covers, exits). */
  sizable: boolean;
}

export const OBJ_LABEL: Record<ObjKind, string> = {
  spawn: 'Điểm mặc định',
  spawns: 'Điểm tới',
  portal: 'Cổng dịch chuyển',
  shrine: 'Đền Guardian',
  exits: 'Lối ra',
  groups: 'Nhóm quái',
  chests: 'Rương',
  nodes: 'Điểm tài nguyên',
  gates: 'Cổng nguyên tố',
  covers: 'Lớp che (lối ẩn)',
  puzzles: 'Câu đố',
  springs: 'Suối hồi',
  npcs: 'Người lữ hành',
  lore: 'Bia lore',
  props: 'Vật trang trí (ô)',
  scenery: 'Asset trang trí',
};

const SIZABLE = new Set<ObjKind>(['exits', 'gates', 'covers']);
const sameRef = (a: ObjRef, b: ObjRef) => a.kind === b.kind && a.id === b.id;
export const refKey = (r: ObjRef) => `${r.kind}:${r.id}`;

type Row = { id: string; x: number; y: number; w?: number; h?: number };
const rowsOf = (map: AreaMap, kind: RowList): Row[] => (map[kind] ?? []) as Row[];

/**
 * The box of a decoration in whole tiles, for picking and moving: as wide as drawn, as tall as drawn (or as wide, when its height
 * follows the picture), standing on its foot.
 */
export function decorBox(d: NonNullable<AreaMap['scenery']>[number]): { x: number; y: number; w: number; h: number } {
  const w = d.w ?? DECOR[d.asset]?.w ?? 1;
  const h = d.h ?? w;
  const x = Math.floor(d.x - w / 2);
  const y = Math.floor(d.y - h);
  return { x, y, w: Math.max(1, Math.ceil(d.x + w / 2) - x), h: Math.max(1, Math.ceil(d.y) - y) };
}

const DECOR_ORDER = { normal: 0, occluder: 1, foreground: 2, cover: 3 } as const;

/** Every object of an area, bottom first (decorations on the ground, covers, props, exits… the spawn, the decorations over all): drawn in
 * this order, hit from the top. */
export function objectsOf(map: AreaMap): EditObj[] {
  const out: EditObj[] = [];
  const add = (kind: ObjKind, id: string, x: number, y: number, w = 1, h = 1) => out.push({ kind, id, x, y, w, h, sizable: SIZABLE.has(kind) });
  const decor = [...(map.scenery ?? [])].map((d) => ({ d, mode: d.mode ?? DECOR[d.asset]?.mode ?? 'occluder' }));
  const addDecor = (keep: (mode: keyof typeof DECOR_ORDER) => boolean) =>
    decor.filter((x) => keep(x.mode)).sort((a, b) => a.d.y - b.d.y).forEach(({ d }) => {
      const b = decorBox(d);
      add('scenery', d.id, b.x, b.y, b.w, b.h);
    });
  addDecor((m) => m === 'normal');
  for (const c of map.covers) add('covers', c.id, c.x, c.y, c.w, c.h);
  map.props.forEach((p, i) => add('props', String(i), p.x, p.y, PROPS[p.prop]?.w ?? 1, PROPS[p.prop]?.h ?? 1));
  for (const e of map.exits) add('exits', e.id, e.x, e.y, e.w, e.h);
  for (const g of map.gates) add('gates', g.id, g.x, g.y, g.w, g.h);
  add('portal', map.id, map.portal.x, map.portal.y, 2, 2);
  if (map.shrine) add('shrine', map.shrine.id, map.shrine.x, map.shrine.y, 2, 2);
  for (const kind of ['chests', 'nodes', 'puzzles', 'springs', 'npcs', 'lore', 'groups'] as const) for (const r of rowsOf(map, kind)) add(kind, r.id, r.x, r.y);
  addDecor((m) => m === 'occluder');
  for (const s of map.spawns ?? []) add('spawns', s.id, s.x, s.y);
  add('spawn', DEFAULT_SPAWN, map.spawn.x, map.spawn.y);
  addDecor((m) => DECOR_ORDER[m] >= 2);
  return out;
}

/** The top-most object on a tile. */
export function objectAt(map: AreaMap, x: number, y: number): EditObj | undefined {
  return objectsOf(map)
    .reverse()
    .find((o) => x >= o.x && y >= o.y && x < o.x + o.w && y < o.y + o.h);
}

/** The objects whose box meets a rectangle of tiles (a drag-select). */
export function objectsIn(map: AreaMap, x0: number, y0: number, x1: number, y1: number): EditObj[] {
  const [ax, bx] = [Math.min(x0, x1), Math.max(x0, x1)];
  const [ay, by] = [Math.min(y0, y1), Math.max(y0, y1)];
  return objectsOf(map).filter((o) => o.x <= bx && o.x + o.w - 1 >= ax && o.y <= by && o.y + o.h - 1 >= ay);
}

export const findObject = (map: AreaMap, ref: ObjRef): EditObj | undefined => objectsOf(map).find((o) => sameRef(o, ref));

/** Puts an object's top-left on a tile, and its size for the sizable ones. */
export function setBox(map: AreaMap, ref: ObjRef, box: { x: number; y: number; w?: number; h?: number }) {
  const o = findObject(map, ref);
  if (!o) return;
  const w = o.sizable ? Math.max(1, Math.round(box.w ?? o.w)) : o.w;
  const h = o.sizable ? Math.max(1, Math.round(box.h ?? o.h)) : o.h;
  const x = Math.min(Math.max(0, Math.round(box.x)), map.cols - w);
  const y = Math.min(Math.max(0, Math.round(box.y)), map.rows - h);
  if (ref.kind === 'spawn') map.spawn = { x, y };
  else if (ref.kind === 'portal') map.portal = { x, y };
  else if (ref.kind === 'shrine') {
    if (map.shrine) map.shrine = { ...map.shrine, x, y };
  }
  else if (ref.kind === 'props') map.props = map.props.map((p, i) => (String(i) === ref.id ? { ...p, x, y } : p));
  // A decoration moves by the same whole tiles as its box and keeps its fraction.
  else if (ref.kind === 'scenery') map.scenery = map.scenery?.map((d) => (d.id === ref.id ? { ...d, x: d.x + (x - o.x), y: d.y + (y - o.y) } : d));
  else {
    const row = rowsOf(map, ref.kind).find((r) => r.id === ref.id)!;
    Object.assign(row, { x, y }, o.sizable ? { w, h } : {});
  }
}

/** Moves objects by whole tiles, all or none: the group keeps its shape at the area's edge. */
export function moveObjects(map: AreaMap, refs: readonly ObjRef[], dx: number, dy: number) {
  const objs = refs.map((r) => findObject(map, r)).filter((o): o is EditObj => !!o);
  if (objs.length === 0) return;
  const minX = Math.min(...objs.map((o) => o.x));
  const minY = Math.min(...objs.map((o) => o.y));
  const maxX = Math.max(...objs.map((o) => o.x + o.w));
  const maxY = Math.max(...objs.map((o) => o.y + o.h));
  const cx = Math.max(-minX, Math.min(dx, map.cols - maxX));
  const cy = Math.max(-minY, Math.min(dy, map.rows - maxY));
  for (const o of objs) setBox(map, o, { x: o.x + cx, y: o.y + cy });
}

/** The ids of this area a save may hold, as published (they never go: decision 047). */
export const publishedIds = (published: AreaMap | undefined): Set<string> => (published ? savedMapIds({ maps: [published] }) : new Set());

/** Why an object cannot be removed, or null when it can (`landedOn` = named spawns exits of other areas land on). */
export function cannotRemove(ref: ObjRef, map: AreaMap, published: AreaMap | undefined, landedOn: ReadonlySet<string> = new Set()): string | null {
  if (ref.kind === 'spawn' || ref.kind === 'portal') return 'Điểm mặc định và cổng dịch chuyển luôn có, chỉ dời được';
  if (ref.kind === 'spawns' && landedOn.has(ref.id)) return `Có lối ra đang tới điểm ${ref.id}: đổi điểm tới của lối đó trước`;
  if (ref.kind === 'exits') return 'Lối ra sửa / xoá ở hộp "Lối ra" (có kiểm tra lối về)';
  const kept = publishedIds(published);
  if (kept.has(ref.id) || kept.has(`${map.id}/${ref.id}`)) return `${ref.id} đã publish: không xoá được (save giữ id), chỉ dời được`;
  if (ref.kind === 'gates' && map.puzzles.some((p) => p.gate === ref.id)) return `Câu đố đang trỏ tới ${ref.id}: xoá câu đố trước`;
  return null;
}

/** Removes objects that may go; returns the reasons for those that stay. */
export function removeObjects(map: AreaMap, refs: readonly ObjRef[], published: AreaMap | undefined, landedOn: ReadonlySet<string> = new Set()): string[] {
  const why: string[] = [];
  // Props by index: highest first so the others keep theirs.
  const props = refs.filter((r) => r.kind === 'props').map((r) => Number(r.id)).sort((a, b) => b - a);
  for (const i of props) map.props.splice(i, 1);
  for (const ref of refs.filter((r) => r.kind !== 'props')) {
    const no = cannotRemove(ref, map, published, landedOn);
    if (no) why.push(no);
    else if (ref.kind === 'shrine') delete map.shrine;
    else if (ref.kind === 'scenery') {
      map.scenery = map.scenery?.filter((d) => d.id !== ref.id);
      if (map.scenery?.length === 0) delete map.scenery;
    }
    else if (ref.kind !== 'spawn' && ref.kind !== 'portal') {
      const list = map[ref.kind] as Row[] | undefined;
      if (list) (map as unknown as Record<string, Row[]>)[ref.kind] = list.filter((r) => r.id !== ref.id);
      if (ref.kind === 'spawns' && map.spawns?.length === 0) delete map.spawns;
    }
  }
  return why;
}

const PREFIX: Partial<Record<ObjKind, string>> = { groups: 'g', chests: 'chest', gates: 'gate', covers: 'cover', puzzles: 'puzzle', springs: 'spring', npcs: 'npc', lore: 'lore', spawns: 'spawn' };

/** The kinds one may add by copying a row (its kind, look, table, pool… unchanged — no new rules). */
export const ADDABLE = ['chests', 'nodes', 'springs', 'npcs', 'lore', 'groups', 'gates', 'covers', 'puzzles', 'spawns'] as const;
export type Addable = (typeof ADDABLE)[number];

/**
 * Adds a copy of `row` (from this area or another) on a tile under a fresh id unique in the game (`taken`, which gains it). A puzzle
 * keeps its gate when this area has it, else takes this area's first gate (none: not added). Returns the new ref, or null.
 */
export function addRow(map: AreaMap, kind: Addable, row: Row & Record<string, unknown>, at: Tile, taken: Set<string>): ObjRef | null {
  const list = ((map as unknown as Record<string, Row[] | undefined>)[kind] ??= []) as (Row & Record<string, unknown>)[];
  const copy = { ...structuredClone(row), x: at.x, y: at.y } as Row & Record<string, unknown>;
  if (kind === 'puzzles' && !map.gates.some((g) => g.id === copy.gate)) {
    if (!map.gates[0]) return null;
    copy.gate = map.gates[0].id;
  }
  const stem = map.id.replace(/^map_/, '');
  const prefix = kind === 'nodes' ? String(row.kind) : PREFIX[kind]!;
  copy.id = freeId(prefix, `${stem}_${list.length + 1}`, new Set([...taken, DEFAULT_SPAWN, ...list.map((r) => r.id)]));
  taken.add(copy.id);
  list.push(copy);
  return { kind, id: copy.id };
}

/** A copy of an object of this area on another tile (not the spawn, portal, shrine or exits: one each / their own dialog). */
export function duplicateObject(map: AreaMap, ref: ObjRef, at: Tile, taken: Set<string>): ObjRef | null {
  if (ref.kind === 'props') {
    const p = map.props[Number(ref.id)];
    if (!p) return null;
    map.props.push({ ...p, x: at.x, y: at.y });
    return { kind: 'props', id: String(map.props.length - 1) };
  }
  if (ref.kind === 'scenery') {
    const d = map.scenery?.find((x) => x.id === ref.id);
    const box = d && decorBox(d);
    return d && box ? addDecor(map, d.asset, { x: d.x + (at.x - box.x), y: d.y + (at.y - box.y) }, taken, d) : null;
  }
  if (!(ADDABLE as readonly string[]).includes(ref.kind)) return null;
  const row = (map[ref.kind as Addable] as (Row & Record<string, unknown>)[] | undefined)?.find((r) => r.id === ref.id);
  return row ? addRow(map, ref.kind as Addable, row, at, taken) : null;
}

/**
 * A decoration of the library on the area, its foot at `foot` (tiles; snapped to half tiles), copying `like` (another placement's
 * size, turn, stance…) when given. Returns its ref.
 */
export function addDecor(map: AreaMap, asset: string, foot: { x: number; y: number }, taken: Set<string>, like?: NonNullable<AreaMap['scenery']>[number]): ObjRef {
  const id = freeId('scn', `${map.id.replace(/^map_/, '')}_${(map.scenery?.length ?? 0) + 1}`, new Set([...taken, ...(map.scenery ?? []).map((d) => d.id)]));
  taken.add(id);
  const half = (v: number) => Math.round(v * 2) / 2;
  map.scenery = [...(map.scenery ?? []), { ...(like ? structuredClone(like) : {}), id, asset, x: half(foot.x), y: half(foot.y) }];
  return { kind: 'scenery', id };
}

/** A new overhead cover (a hidden way) over a rectangle of tiles. */
export function addCover(map: AreaMap, a: Tile, b: Tile, taken: Set<string>): ObjRef {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const id = freeId('cover', `${map.id.replace(/^map_/, '')}_${map.covers.length + 1}`, taken);
  taken.add(id);
  map.covers.push({ id, x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1, look: 'canopy' });
  return { kind: 'covers', id };
}

// ---- Ground --------------------------------------------------------------------------------------------------------------

export interface Tile {
  x: number;
  y: number;
}

const inside = (map: Pick<AreaMap, 'cols' | 'rows'>, t: Tile) => t.x >= 0 && t.y >= 0 && t.x < map.cols && t.y < map.rows;

/** The tiles of a straight stroke (a brush dragged between two mouse events), `size` tiles wide. */
export function strokeTiles(a: Tile, b: Tile, size = 1): Tile[] {
  const out = new Map<string, Tile>();
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  const r = Math.floor((size - 1) / 2);
  for (let i = 0; i <= steps; i += 1) {
    const cx = Math.round(a.x + ((b.x - a.x) * i) / steps);
    const cy = Math.round(a.y + ((b.y - a.y) * i) / steps);
    for (let y = cy - r; y < cy - r + size; y += 1) for (let x = cx - r; x < cx - r + size; x += 1) out.set(`${x},${y}`, { x, y });
  }
  return [...out.values()];
}

/** Every tile of the rectangle between two corners. */
export function rectTiles(a: Tile, b: Tile): Tile[] {
  const out: Tile[] = [];
  for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y += 1) for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x += 1) out.push({ x, y });
  return out;
}

/** The tiles joined to `start` (4 ways) with the same ground. */
export function floodTiles(map: AreaMap, start: Tile): Tile[] {
  if (!inside(map, start)) return [];
  const char = map.terrain[start.y]![start.x]!;
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const out: Tile[] = [];
  const queue = [start];
  while (queue.length) {
    const t = queue.pop()!;
    out.push(t);
    for (const n of [{ x: t.x + 1, y: t.y }, { x: t.x - 1, y: t.y }, { x: t.x, y: t.y + 1 }, { x: t.x, y: t.y - 1 }]) {
      const k = `${n.x},${n.y}`;
      if (!seen.has(k) && inside(map, n) && map.terrain[n.y]![n.x] === char) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return out;
}

const setChars = (rows: string[], tiles: readonly Tile[], char: string, cols: number, count: number): string[] => {
  const grid = rows.map((r) => [...r]);
  for (const t of tiles) if (t.x >= 0 && t.y >= 0 && t.x < cols && t.y < count) grid[t.y]![t.x] = char;
  return grid.map((r) => r.join(''));
};

/** Paints ground on tiles (outside the area: ignored). */
export function paintTerrain(map: AreaMap, tiles: readonly Tile[], char: string) {
  map.terrain = setChars(map.terrain, tiles, char, map.cols, map.rows);
}

/** Paints a height 0–9 (presentation only); a painted area without heights starts flat. Not for an area drawn from tiles. */
export function paintElevation(map: AreaMap, tiles: readonly Tile[], height: number): boolean {
  if (!map.scene) return false;
  const rows = map.scene.elevation ?? Array.from({ length: map.rows }, () => '0'.repeat(map.cols));
  map.scene = { ...map.scene, elevation: setChars(rows, tiles, String(Math.max(0, Math.min(9, Math.round(height)))), map.cols, map.rows) };
  return true;
}

// ---- Undo ------------------------------------------------------------------------------------------------------------------

/** Undo / redo by whole copies of the area, at most `limit` steps back. */
export class EditHistory<T> {
  private past: T[] = [];
  private future: T[] = [];
  constructor(private readonly limit = 200) {}

  /** Call before a change with the state as it was. */
  record(before: T) {
    this.past.push(structuredClone(before));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: T): T | null {
    const prev = this.past.pop();
    if (prev === undefined) return null;
    this.future.push(structuredClone(current));
    return prev;
  }

  redo(current: T): T | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(structuredClone(current));
    return next;
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}
