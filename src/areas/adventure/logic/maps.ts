// The exploration areas as a grid (spec §3): which tiles block (walls, water, the footprint of every prop and thing, closed gates), the
// walkable world for the walker, the things one can reach and use, where a group stands (it never walks), and the checks every
// area must pass (§3.10): everything reachable, no chest in a dead corner, the main road never behind an element gate, footprints
// inside the area and never on top of each other. Pure.
import type { Rect, Vec, Walkable } from '../../../systems/character';
import { AB, MAPS, PROPS, type AreaMap, type MapGroup } from './config/content';

export const WALK_TILES = new Set(['.', ',', '=']);

export type ThingKind = 'chest' | 'node' | 'gate' | 'spring' | 'npc' | 'lore' | 'shrine' | 'portal' | 'exit';

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

/** Everything wrong with an area (spec §3.10); [] = fine. */
export function mapProblems(map: AreaMap): string[] {
  const out: string[] = [];
  const say = (msg: string) => out.push(`${map.id}: ${msg}`);
  // Footprints inside the area and never on top of each other.
  const owner = new Map<number, string>();
  const claim = (what: string, x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (xx < 1 || yy < 1 || xx >= map.cols - 1 || yy >= map.rows - 1) {
          say(`${what} stands outside the area at ${xx},${yy}`);
          continue;
        }
        if (!WALK_TILES.has(map.terrain[yy]![xx]!)) say(`${what} stands on a wall or water at ${xx},${yy}`);
        const prev = owner.get(yy * map.cols + xx);
        if (prev) say(`${what} overlaps ${prev} at ${xx},${yy}`);
        owner.set(yy * map.cols + xx, what);
      }
    }
  };
  for (const p of map.props) {
    const def = PROPS[p.prop];
    if (!def) say(`unknown prop ${p.prop}`);
    else claim(`${p.prop}@${p.x},${p.y}`, p.x, p.y, def.w, def.h);
  }
  for (const t of thingsOf(map)) if (t.kind !== 'exit') claim(t.id, t.x, t.y, t.w, t.h);
  for (const e of map.exits) for (let y = e.y; y < e.y + e.h; y += 1) if (!WALK_TILES.has(map.terrain[y]?.[e.x] ?? '#')) say(`exit ${e.id} is not walkable`);
  const allGates = new Set(map.gates.map((g) => g.id));
  const free = blockedTiles(map, allGates);
  const walk = (p: { x: number; y: number }) => p.x >= 0 && p.y >= 0 && p.x < map.cols && p.y < map.rows && !free[idx(map, p)];
  if (!walk(map.spawn)) say('the spawn tile is blocked');
  const open = reachableTiles(map, map.spawn, allGates);
  const shut = reachableTiles(map, map.spawn);
  // Every thing usable once every gate is open (no dead corner, §3.5).
  for (const t of thingsOf(map)) if (!usableFrom(map, t, open)) say(`${t.kind} ${t.id} cannot be reached`);
  for (const g of map.groups) if (!walk(g) || !open.has(idx(map, g))) say(`group ${g.id} stands where nobody can walk (${g.x},${g.y})`);
  // A gate locked behind the guardian stands behind it: further from the way in than the guardian itself.
  const guardian = map.groups.find((g) => g.kind !== 'normal');
  for (const e of map.exits) if (e.lock === 'guardian' && (!guardian || Math.abs(e.x - map.spawn.x) < Math.abs(guardian.x - map.spawn.x))) say(`gate ${e.id} is not behind the guardian`);
  // The main road never needs an element gate: exits, the portal, the guardians and the boss with every gate shut.
  for (const t of thingsOf(map)) if ((t.kind === 'exit' || t.kind === 'portal') && !usableFrom(map, t, shut)) say(`${t.kind} ${t.id} is behind an element gate`);
  for (const g of map.groups) if (g.kind !== 'normal' && !shut.has(idx(map, g))) say(`${g.kind} ${g.id} is behind an element gate`);
  // Arrivals land on walkable ground.
  for (const other of Object.values(MAPS)) for (const e of other.exits) if (e.to === map.id && !walk({ x: e.arriveX, y: e.arriveY })) say(`arrival from ${other.id} lands on a blocked tile`);
  return out;
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
