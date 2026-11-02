// The map network of the Map Builder (decision 047, GĐ5), pure: the connections between areas as edges (the exits both ways between
// two areas make one edge), where each node sits (the admin's own placement in meta.json, else laid out by zone), and the warnings of
// the whole world — an area with no connection, no way in, an exit to an area that does not exist, an arrival on a missing spawn,
// links set up wrong, an inactive exit that is the only way somewhere. Placing nodes never touches the areas themselves.
import { arrivalProblems } from '../../content/schemas/adventure/maps';
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { graphProblems, liveMaps, workingZones } from './mapLinks';
import { workingMaps, type BuilderData, type Exit } from './mapModel';

export interface Point {
  x: number;
  y: number;
}

/** An exit on an edge, with the area it stands in. */
export interface EdgeExit {
  from: string;
  exit: Exit;
  inactive: boolean;
}

/** The exits between two areas (`a` < `b` by id), both ways. */
export interface NetEdge {
  key: string;
  a: string;
  b: string;
  exits: EdgeExit[];
  /** Active exits both ways. */
  twoWay: boolean;
  /** An active exit is locked (behind a guardian, or a shortcut). */
  locked: boolean;
  /** No active exit at all. */
  inactive: boolean;
  problems: string[];
}

export const NODE = { w: 168, h: 58 } as const;
const COL = 380;
const ROW = 110;
const BRANCH_DX = 190;

const known = (data: BuilderData) => new Set(workingMaps(data).map((m) => m.id));

export function networkEdges(data: BuilderData): NetEdge[] {
  const maps = workingMaps(data);
  const ids = known(data);
  const byId = new Map(maps.map((m) => [m.id, m]));
  const graph = graphProblems(data, maps);
  const edges = new Map<string, NetEdge>();
  for (const m of maps) {
    for (const exit of m.exits) {
      if (!ids.has(exit.to) || exit.to === m.id) continue;
      const [a, b] = [m.id, exit.to].sort() as [string, string];
      const key = `${a}|${b}`;
      const edge = edges.get(key) ?? { key, a, b, exits: [], twoWay: false, locked: false, inactive: false, problems: [] };
      const inactive = !!data.meta[m.id]?.exits?.[exit.id]?.inactive;
      edge.exits.push({ from: m.id, exit, inactive });
      edge.problems.push(...arrivalProblems(exit, byId.get(exit.to)!).map((p) => `${m.id}: ${p}`), ...graph(m.id).filter((p) => p.includes(exit.id)));
      edges.set(key, edge);
    }
  }
  for (const e of edges.values()) {
    const live = e.exits.filter((x) => !x.inactive);
    e.twoWay = live.some((x) => x.from === e.a) && live.some((x) => x.from === e.b);
    e.locked = live.some((x) => !!x.exit.lock);
    e.inactive = live.length === 0;
  }
  return [...edges.values()];
}

/** Every area laid out by zone: a column per zone, its main road downwards, its side areas beside the area they hang from. */
export function autoLayout(data: BuilderData): Record<string, Point> {
  const maps = workingMaps(data);
  const zones = workingZones(data);
  const out: Record<string, Point> = {};
  zones.forEach((z, zi) => {
    const x = 40 + zi * COL;
    z.maps.forEach((id, i) => (out[id] = { x, y: 40 + i * ROW }));
    const used = new Set(Object.values(out).map((p) => `${p.x},${p.y}`));
    for (const id of z.branches ?? []) {
      const near = maps.find((m) => m.id === id)?.exits.map((e) => out[e.to]).find((p) => p && p.x === x);
      let p: Point = { x: x + BRANCH_DX, y: near?.y ?? 40 };
      while (used.has(`${p.x},${p.y}`)) p = { x: p.x, y: p.y + ROW };
      used.add(`${p.x},${p.y}`);
      out[id] = p;
    }
  });
  // Areas in no zone (switched off, or a zone not found): a row below everything.
  const bottom = Math.max(0, ...Object.values(out).map((p) => p.y)) + ROW * 1.5;
  maps.filter((m) => !out[m.id]).forEach((m, i) => (out[m.id] = { x: 40 + i * (NODE.w + 30), y: bottom }));
  return out;
}

/** Where each node is drawn: the admin's placement, else the automatic one. */
export function nodePositions(data: BuilderData): Record<string, Point> {
  const auto = autoLayout(data);
  return Object.fromEntries(Object.entries(auto).map(([id, p]) => [id, data.meta[id]?.node ?? p]));
}

export interface NetWarning {
  mapId: string;
  level: 'error' | 'warn';
  text: string;
  /** The exit it is about, if any (opens it). */
  exitId?: string;
}

export function networkWarnings(data: BuilderData): NetWarning[] {
  const maps = workingMaps(data).filter((m) => !data.meta[m.id]?.disabled);
  const ids = known(data);
  const byId = new Map(maps.map((m) => [m.id, m]));
  const zones = workingZones(data);
  const entrances = new Set(zones.map((z) => z.maps[0]));
  const live = liveMaps(data);
  const inbound = (list: readonly AreaMap[], id: string) => list.some((m) => m.id !== id && m.exits.some((e) => e.to === id));
  const out: NetWarning[] = [];
  for (const m of maps) {
    const linked = m.exits.length > 0 || inbound(maps, m.id);
    if (!linked) out.push({ mapId: m.id, level: 'warn', text: `${m.nameVi}: chưa có kết nối nào` });
    else if (!entrances.has(m.id) && !inbound(live, m.id)) out.push({ mapId: m.id, level: 'error', text: `${m.nameVi}: không có lối vào hợp lệ (không là cửa vùng, không lối ra đang mở nào tới)` });
    for (const e of m.exits) {
      if (!ids.has(e.to)) out.push({ mapId: m.id, exitId: e.id, level: 'error', text: `${m.nameVi}: lối ra ${e.id} dẫn tới map không tồn tại (${e.to})` });
      else if (byId.has(e.to)) for (const p of arrivalProblems(e, byId.get(e.to)!)) out.push({ mapId: m.id, exitId: e.id, level: 'error', text: `${m.nameVi}: ${p}` });
      else out.push({ mapId: m.id, exitId: e.id, level: 'warn', text: `${m.nameVi}: lối ra ${e.id} dẫn tới map đang tạm tắt (${e.to})` });
    }
  }
  // Links set up wrong (the game's graph checks on the world as published), each under the area it names first.
  const name = (id: string) => byId.get(id)?.nameVi ?? id;
  for (const p of mapGraphProblems(live, zones)) {
    const named = maps.map((m) => ({ id: m.id, at: p.search(new RegExp(`\\b${m.id}\\b`)) })).filter((n) => n.at >= 0);
    const mapId = named.sort((x, y) => x.at - y.at)[0]?.id ?? '';
    out.push({ mapId, level: 'error', text: graphText(p, name), exitId: p.match(/\bexit_[a-z0-9_]+/)?.[0] });
  }
  // An inactive exit that is the only way somewhere: walkable with it, not without.
  const withInactive = new Set(mapGraphProblems(maps, zones).filter((p) => p.includes('cannot be walked to')));
  for (const p of mapGraphProblems(live, zones).filter((x) => x.includes('cannot be walked to') && !withInactive.has(x))) {
    const target = maps.find((m) => p.includes(` ${m.id} `))?.id;
    for (const m of maps)
      for (const e of m.exits)
        if (e.to === target && data.meta[m.id]?.exits?.[e.id]?.inactive)
          out.push({ mapId: m.id, exitId: e.id, level: 'warn', text: `${m.nameVi}: lối ra tạm tắt ${e.id} là lối đi duy nhất tới ${byId.get(target)?.nameVi ?? target}` });
  }
  const seen = new Set<string>();
  return out.filter((w) => !seen.has(w.text) && seen.add(w.text));
}

/** A graph problem of the game (mapGraph.ts, English) said in the admin's words, with area names. */
export function graphText(p: string, name: (id: string) => string): string {
  const rules: [RegExp, (...g: string[]) => string][] = [
    [/^(map_\w+): exit (exit_\w+) has no way back from (map_\w+)$/, (m, e, t) => `${name(m)}: lối ra ${e} chưa có lối về từ ${name(t)} (đặt lối về, hoặc đánh dấu một chiều)`],
    [/^(map_\w+): shortcut (exit_\w+) can never be opened/, (m, e) => `${name(m)}: lối tắt ${e} không bao giờ mở được (cần một lối về thường)`],
    [/^(zone_\w+): (map_\w+) cannot be walked to from (map_\w+)$/, (_z, m, from) => `${name(m)}: không đi tới được từ cửa vùng ${name(from)}`],
    [/^(map_\w+) is in no zone$/, (m) => `${name(m)}: không thuộc vùng nào`],
    [/^(map_\w+) is listed twice/, (m) => `${name(m)}: nằm trong hai vùng`],
    [/^(map_\w+): a side area holds a boss$/, (m) => `${name(m)}: map nhánh không được có trùm`],
  ];
  for (const [re, say] of rules) {
    const g = p.match(re);
    if (g) return say(...g.slice(1));
  }
  return p;
}
