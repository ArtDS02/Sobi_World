// The exploration areas as a grid (spec §3): which tiles block (walls, water, the footprint of every prop and thing, closed gates), the
// walkable world for the walker, the things one can reach and use, where a group stands (it never walks), and the checks every
// area must pass (§3.10): everything reachable, no chest in a dead corner, the main road never behind an element gate, footprints
// inside the area and never on top of each other. Pure.
import type { Rect, Vec, Walkable } from '../../../systems/character';
import { AB, DECOR, MAPS, PROPS, type AreaMap, type MapGroup } from './config/content';
import { sceneryBlocks } from './scenery';

export const WALK_TILES = new Set(['.', ',', '=', '^', 's', 'c']);

export type ThingKind = 'chest' | 'node' | 'gate' | 'puzzle' | 'spring' | 'npc' | 'lore' | 'shrine' | 'portal' | 'exit';

/** Something on the map one may walk up to and use (Space), as a rectangle of tiles. */
export interface Thing {
  id: string;
  kind: ThingKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Every usable thing of an area (portal id = the area's id). */
export function thingsOf(map: AreaMap): Thing[] {
  const one = (kind: ThingKind) => (t: { id: string; x: number; y: number }): Thing => ({ id: t.id, kind, x: t.x, y: t.y, w: 1, h: 1 });
  return [
    ...map.chests.map(one('chest')),
    ...map.nodes.map(one('node')),
    ...map.gates.map((g): Thing => ({ id: g.id, kind: 'gate', x: g.x, y: g.y, w: g.w, h: g.h })),
    ...map.puzzles.map(one('puzzle')),
    ...map.springs.map(one('spring')),
    ...map.npcs.map(one('npc')),
    ...map.lore.map(one('lore')),
    ...(map.shrine ? [{ id: map.shrine.id, kind: 'shrine' as const, x: map.shrine.x, y: map.shrine.y, w: 2, h: 2 }] : []),
    { id: map.id, kind: 'portal', x: map.portal.x, y: map.portal.y, w: 2, h: 2 },
    ...map.exits.map((e): Thing => ({ id: e.id, kind: 'exit', x: e.x, y: e.y, w: e.w, h: e.h })),
  ];
}

/** Things that stand on their tiles (an exit is walked into, an opened gate is gone). */
const solid = (t: Thing, opened: ReadonlySet<string>) => t.kind !== 'exit' && !(t.kind === 'gate' && opened.has(t.id));

/** The blocked tiles of an area with `opened` gates open; `closed` = more rectangles that block (teleport gates still locked). */
export function blockedTiles(map: AreaMap, opened: ReadonlySet<string> = new Set(), closed: readonly Pick<Thing, 'x' | 'y' | 'w' | 'h'>[] = []): boolean[] {
  const blocked = new Array<boolean>(map.cols * map.rows).fill(false);
  const mark = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) if (xx >= 0 && yy >= 0 && xx < map.cols && yy < map.rows) blocked[yy * map.cols + xx] = true;
  };
  map.terrain.forEach((row, y) => [...row].forEach((c, x) => !WALK_TILES.has(c) && mark(x, y, 1, 1)));
  for (const p of map.props) {
    const def = PROPS[p.prop];
    if (def) mark(p.x, p.y, def.w, def.h);
  }
  for (const t of thingsOf(map)) if (solid(t, opened)) mark(t.x, t.y, t.w, t.h);
  // Hand-placed decorations block the tiles of their foot (decision 047).
  for (const r of sceneryBlocks(map)) mark(r.x, r.y, r.w, r.h);
  for (const c of closed) mark(c.x, c.y, c.w, c.h);
  return blocked;
}

const tilePx = (map: AreaMap) => map.tile;

/** The middle of a tile, design px. */
export const tileCenter = (map: AreaMap, x: number, y: number): Vec => ({ x: (x + 0.5) * tilePx(map), y: (y + 0.5) * tilePx(map) });

/** The tile under a point. */
export const tileAt = (map: AreaMap, p: Vec): { x: number; y: number } => ({ x: Math.floor(p.x / map.tile), y: Math.floor(p.y / map.tile) });

/** The ground the walker may stand on: the area, minus its blocked tiles (merged into rows of rectangles). */
export function walkableOf(map: AreaMap, opened: ReadonlySet<string> = new Set(), closed: readonly Pick<Thing, 'x' | 'y' | 'w' | 'h'>[] = []): Walkable {
  const blocked = blockedTiles(map, opened, closed);
  const t = map.tile;
  const obstacles: Rect[] = [];
  for (let y = 0; y < map.rows; y += 1) {
    let x = 0;
    while (x < map.cols) {
      if (!blocked[y * map.cols + x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < map.cols && blocked[y * map.cols + x]) x += 1;
      obstacles.push({ x: start * t, y: y * t, width: (x - start) * t, height: t });
    }
  }
  return { bounds: { x: 0, y: 0, width: map.cols * t, height: map.rows * t }, obstacles, halfW: AB.explore.feetHalfWidth, halfH: AB.explore.feetHalfHeight };
}

/** Tiles reachable on foot from `from` (4-neighbour). */
export function reachableTiles(map: AreaMap, from: { x: number; y: number }, opened: ReadonlySet<string> = new Set()): Set<number> {
  const blocked = blockedTiles(map, opened);
  const seen = new Set<number>();
  const start = from.y * map.cols + from.x;
  if (blocked[start]) return seen;
  const queue = [start];
  seen.add(start);
  while (queue.length > 0) {
    const i = queue.shift()!;
    const x = i % map.cols;
    const y = Math.floor(i / map.cols);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.cols || ny >= map.rows) continue;
      const j = ny * map.cols + nx;
      if (blocked[j] || seen.has(j)) continue;
      seen.add(j);
      queue.push(j);
    }
  }
  return seen;
}

/** Can a thing be used from the reachable tiles: one of its tiles (exit) or a tile next to it is reachable. */
function usableFrom(map: AreaMap, t: Thing, reach: Set<number>): boolean {
  for (let y = t.y - 1; y <= t.y + t.h; y += 1) {
    for (let x = t.x - 1; x <= t.x + t.w; x += 1) {
      const inside = x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h;
      const corner = (x === t.x - 1 || x === t.x + t.w) && (y === t.y - 1 || y === t.y + t.h);
      if (corner || (inside && t.kind !== 'exit')) continue;
      if (x < 0 || y < 0 || x >= map.cols || y >= map.rows) continue;
      if (reach.has(y * map.cols + x)) return true;
    }
  }
  return false;
}

const idx = (map: AreaMap, p: { x: number; y: number }) => p.y * map.cols + p.x;

/** What a check is about: an object of the area (`prop` id = `<prop>@x,y`, `portal` id = the area id, `spawn` = the default spawn). */
export interface IssueSubject {
  kind: ThingKind | 'prop' | 'group' | 'spawn' | 'spawnPoint' | 'cover' | 'decor' | 'map';
  id: string;
}

/** The checks of `mapIssues`, by what went wrong. */
export type MapIssueCode =
  | 'outside'
  | 'onWall'
  | 'overlap'
  | 'unknownProp'
  | 'unknownDecor'
  | 'decorFoot'
  | 'exitBlocked'
  | 'spawnBlocked'
  | 'unreachable'
  | 'groupStuck'
  | 'notBehindGuardian'
  | 'behindGate'
  | 'coverOutside'
  | 'coverEmpty'
  | 'coverHides'
  | 'spawnPointStuck'
  | 'spawnPointOnGroup'
  | 'arrivalBlocked'
  | 'arrivalOnGroup';

/** One problem of an area, on the tile it concerns (when it has one), naming its objects; `text` = the English line. */
export interface MapIssue {
  code: MapIssueCode;
  subject: IssueSubject;
  /** The second object it names: the one overlapped / hidden, the guardian, the area an arrival comes from. */
  other?: IssueSubject;
  x?: number;
  y?: number;
  text: string;
}

/** Everything wrong with an area (spec §3.10), one line each `<area id>: …`; [] = fine. */
/** `others` = the areas whose exits lead here (the game's by default; the map builder passes its drafts too). */
export function mapProblems(map: AreaMap, others: readonly AreaMap[] = Object.values(MAPS)): string[] {
  return mapIssues(map, others).map((i) => `${map.id}: ${i.text}`);
}

/** Everything wrong with an area (spec §3.10) with the tile and objects of each problem; [] = fine. */
export function mapIssues(map: AreaMap, others: readonly AreaMap[] = Object.values(MAPS)): MapIssue[] {
  const out: MapIssue[] = [];
  const say = (code: MapIssueCode, subject: IssueSubject, text: string, at?: { x: number; y: number }, other?: IssueSubject) =>
    out.push({ code, subject, ...(other ? { other } : {}), ...(at ? { x: at.x, y: at.y } : {}), text });
  const tile = (t: { x: number; y: number }) => ({ x: t.x, y: t.y });
  // Footprints inside the area and never on top of each other.
  const owner = new Map<number, IssueSubject>();
  const claim = (what: IssueSubject, x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (xx < 1 || yy < 1 || xx >= map.cols - 1 || yy >= map.rows - 1) {
          say('outside', what, `${what.id} stands outside the area at ${xx},${yy}`, { x: xx, y: yy });
          continue;
        }
        if (!WALK_TILES.has(map.terrain[yy]![xx]!)) say('onWall', what, `${what.id} stands on a wall or water at ${xx},${yy}`, { x: xx, y: yy });
        const prev = owner.get(yy * map.cols + xx);
        if (prev) say('overlap', what, `${what.id} overlaps ${prev.id} at ${xx},${yy}`, { x: xx, y: yy }, prev);
        owner.set(yy * map.cols + xx, what);
      }
    }
  };
  for (const p of map.props) {
    const def = PROPS[p.prop];
    const what: IssueSubject = { kind: 'prop', id: `${p.prop}@${p.x},${p.y}` };
    if (!def) say('unknownProp', what, `unknown prop ${p.prop}`, tile(p));
    else claim(what, p.x, p.y, def.w, def.h);
  }
  for (const t of thingsOf(map)) if (t.kind !== 'exit') claim({ kind: t.kind, id: t.id }, t.x, t.y, t.w, t.h);
  for (const d of map.scenery ?? []) if (!DECOR[d.asset]) say('unknownDecor', { kind: 'decor', id: d.id }, `unknown decoration ${d.asset} (${d.id})`, { x: Math.floor(d.x), y: Math.floor(d.y) });
  for (const r of sceneryBlocks(map))
    for (let yy = r.y; yy < r.y + r.h; yy += 1)
      for (let xx = r.x; xx < r.x + r.w; xx += 1) {
        const under = owner.get(yy * map.cols + xx);
        if (under) say('decorFoot', under, `a decoration's foot covers ${under.id} at ${xx},${yy}`, { x: xx, y: yy });
      }
  for (const e of map.exits)
    for (let y = e.y; y < e.y + e.h; y += 1) if (!WALK_TILES.has(map.terrain[y]?.[e.x] ?? '#')) say('exitBlocked', { kind: 'exit', id: e.id }, `exit ${e.id} is not walkable`, { x: e.x, y });
  const allGates = new Set(map.gates.map((g) => g.id));
  const free = blockedTiles(map, allGates);
  const walk = (p: { x: number; y: number }) => p.x >= 0 && p.y >= 0 && p.x < map.cols && p.y < map.rows && !free[idx(map, p)];
  const spawn: IssueSubject = { kind: 'spawn', id: 'spawn_default' };
  if (!walk(map.spawn)) say('spawnBlocked', spawn, 'the spawn tile is blocked', tile(map.spawn));
  const open = reachableTiles(map, map.spawn, allGates);
  const shut = reachableTiles(map, map.spawn);
  // Every thing usable once every gate is open (no dead corner, §3.5).
  for (const t of thingsOf(map)) if (!usableFrom(map, t, open)) say('unreachable', { kind: t.kind, id: t.id }, `${t.kind} ${t.id} cannot be reached`, tile(t));
  for (const g of map.groups) if (!walk(g) || !open.has(idx(map, g))) say('groupStuck', { kind: 'group', id: g.id }, `group ${g.id} stands where nobody can walk (${g.x},${g.y})`, tile(g));
  // A gate locked behind the guardian stands behind it: further from the way in than the guardian itself (exits may sit on any edge,
  // decision 043, so the distance is measured straight, not along x).
  const guardian = map.groups.find((g) => g.kind === 'elite' || g.kind === 'boss');
  const fromSpawn = (x: number, y: number) => Math.hypot(x - map.spawn.x, y - map.spawn.y);
  for (const e of map.exits)
    if (e.lock === 'guardian' && (!guardian || fromSpawn(e.x + (e.w - 1) / 2, e.y + (e.h - 1) / 2) < fromSpawn(guardian.x, guardian.y)))
      say('notBehindGuardian', { kind: 'exit', id: e.id }, `gate ${e.id} is not behind the guardian`, tile(e), guardian ? { kind: 'group', id: guardian.id } : undefined);
  // The main road never needs an element gate: exits, the portal, the guardians and the boss with every gate shut.
  for (const t of thingsOf(map)) if ((t.kind === 'exit' || t.kind === 'portal') && !usableFrom(map, t, shut)) say('behindGate', { kind: t.kind, id: t.id }, `${t.kind} ${t.id} is behind an element gate`, tile(t));
  for (const g of map.groups) if ((g.kind === 'elite' || g.kind === 'boss') && !shut.has(idx(map, g))) say('behindGate', { kind: 'group', id: g.id }, `${g.kind} ${g.id} is behind an element gate`, tile(g));
  // A cover hides a place one can walk into, never the way in, the portal, an exit or a guardian (decision 045: a hidden place may
  // have its own watchers and rare ones).
  for (const c of map.covers) {
    const inside = (x: number, y: number, w = 1, h = 1) => x < c.x + c.w && x + w > c.x && y < c.y + c.h && y + h > c.y;
    const cover: IssueSubject = { kind: 'cover', id: c.id };
    if (c.x < 0 || c.y < 0 || c.x + c.w > map.cols || c.y + c.h > map.rows) say('coverOutside', cover, `cover ${c.id} is outside the area`, tile(c));
    let walkable = 0;
    for (let y = c.y; y < c.y + c.h; y += 1) for (let x = c.x; x < c.x + c.w; x += 1) if (open.has(idx(map, { x, y }))) walkable += 1;
    if (walkable === 0) say('coverEmpty', cover, `cover ${c.id} hides no ground one can reach`, tile(c));
    if (inside(map.spawn.x, map.spawn.y)) say('coverHides', cover, `cover ${c.id} hides the spawn`, tile(map.spawn), spawn);
    if (inside(map.portal.x, map.portal.y, 2, 2)) say('coverHides', cover, `cover ${c.id} hides the portal`, tile(map.portal), { kind: 'portal', id: map.id });
    for (const e of map.exits) if (inside(e.x, e.y, e.w, e.h)) say('coverHides', cover, `cover ${c.id} hides exit ${e.id}`, tile(e), { kind: 'exit', id: e.id });
    for (const g of map.groups) if ((g.kind === 'elite' || g.kind === 'boss') && inside(g.x, g.y)) say('coverHides', cover, `cover ${c.id} hides guardian ${g.id}`, tile(g), { kind: 'group', id: g.id });
  }
  // Named arrival points (decision 047) stand where one can walk, off the enemy groups.
  for (const sp of map.spawns ?? []) {
    const what: IssueSubject = { kind: 'spawnPoint', id: sp.id };
    if (!walk(sp) || !open.has(idx(map, sp))) say('spawnPointStuck', what, `spawn ${sp.id} stands where nobody can walk (${sp.x},${sp.y})`, tile(sp));
    const on = map.groups.find((g) => g.x === sp.x && g.y === sp.y);
    if (on) say('spawnPointOnGroup', what, `spawn ${sp.id} stands on an enemy group`, tile(sp), { kind: 'group', id: on.id });
  }
  // Arrivals land on walkable ground.
  for (const other of others) {
    for (const e of other.exits) {
      if (e.to !== map.id) continue;
      const at = { x: e.arriveX, y: e.arriveY };
      const from: IssueSubject = { kind: 'map', id: other.id };
      if (!walk(at)) say('arrivalBlocked', { kind: 'exit', id: e.id }, `arrival from ${other.id} lands on a blocked tile`, at, from);
      const on = map.groups.find((g) => g.x === e.arriveX && g.y === e.arriveY);
      if (on) say('arrivalOnGroup', { kind: 'exit', id: e.id }, `arrival from ${other.id} lands on an enemy group`, at, from);
    }
  }
  return out;
}

/** The overhead cover over a point, if any (decision 045). */
export function coverAt(map: AreaMap, p: Vec): AreaMap['covers'][number] | undefined {
  const t = tileAt(map, p);
  return map.covers.find((c) => t.x >= c.x && t.x < c.x + c.w && t.y >= c.y && t.y < c.y + c.h);
}

/** Distance (px) from a point to a rectangle of tiles (0 inside). */
export function distanceToThing(map: AreaMap, p: Vec, t: Pick<Thing, 'x' | 'y' | 'w' | 'h'>): number {
  const x0 = t.x * map.tile;
  const y0 = t.y * map.tile;
  const dx = Math.max(x0 - p.x, 0, p.x - (x0 + t.w * map.tile));
  const dy = Math.max(y0 - p.y, 0, p.y - (y0 + t.h * map.tile));
  return Math.hypot(dx, dy);
}

/** Where a group stands: it waits at its own tile and never walks (adventure-big-update-1 §12). */
export const groupPosition = (map: AreaMap, g: MapGroup): Vec => tileCenter(map, g.x, g.y);

/** How far `p` is from a group (px): the check that a touch really happened. */
export function groupDistance(map: AreaMap, g: MapGroup, p: Vec): number {
  const at = groupPosition(map, g);
  return Math.hypot(at.x - p.x, at.y - p.y);
}
