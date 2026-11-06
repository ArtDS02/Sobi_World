// A skin (decision 050, 2026-11-06): the creature's finished picture on a grid that its bones and chains bend, instead of cut parts.
// At rest the grid lies flat, so the creature looks exactly as drawn; a turning head or a swinging leg moves the grid points bound to
// it, and points near a border blend between their regions (linear blend skinning), so a joint stretches instead of opening a seam.
// A point bound to a chain follows the strip: it keeps its place along the chain and its distance across it. Pure; the caller draws
// the grid (ui/puppet).
import type { RigData } from '../../../content/schemas/anim/rig';
import { solve, waveBend, type World } from './skeleton';

type Pt = { x: number; y: number };

/** One region a grid point follows, with its weight and where the point sits in that region's rest frame. */
interface Bind {
  target: number;
  w: number;
  /** Bone: the point in the bone's rest frame. Chain: segment index, place along it (0–1) and distance across it. */
  a: number;
  b: number;
  c: number;
}

interface Target {
  id: string;
  chain: boolean;
}

export interface SkinMesh {
  cols: number;
  rows: number;
  /** Rest positions (canvas px), 2 per point, row by row. */
  rest: Float32Array;
  /** Texture coordinates 0–1 of the skin picture, 2 per point. */
  uv: Float32Array;
  /** The points in triangle-strip order, rows joined by degenerate triangles; one strip per band of rows, each short enough for
   *  one draw call (Phaser's rope batch holds 1536 vertices). */
  strips: Uint32Array[];
  targets: Target[];
  binds: Bind[][];
}

/** Signed distance from a point to a polygon's edge: positive inside. */
function signedDistance(p: Pt, poly: readonly (readonly [number, number])[]): number {
  let inside = false;
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j]!;
    const [bx, by] = poly[i]!;
    if (by > p.y !== ay > p.y && p.x < ((ax - bx) * (p.y - by)) / (ay - by) + bx) inside = !inside;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / len2));
    best = Math.min(best, Math.hypot(p.x - (ax + dx * t), p.y - (ay + dy * t)));
  }
  return inside ? best : -best;
}

const smooth = (k: number) => {
  const t = Math.max(0, Math.min(1, k));
  return t * t * (3 - 2 * t);
};

/** Where `p` sits along a polyline: the nearest segment, the place along it (may run past the ends) and the distance across it. */
function along(p: Pt, pts: readonly Pt[]): [number, number, number] {
  let best: [number, number, number] = [0, 0, 0];
  let bestD = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const s = ((p.x - a.x) * ux + (p.y - a.y) * uy) / len;
    const n = (p.x - a.x) * -uy + (p.y - a.y) * ux;
    const sc = Math.max(i === 0 ? -Infinity : 0, Math.min(i + 2 === pts.length ? Infinity : 1, s));
    const d = Math.hypot(p.x - (a.x + dx * sc), p.y - (a.y + dy * sc));
    if (d < bestD) {
      bestD = d;
      // The raw place along it (not the clamped one): the point comes back exactly where it was at rest.
      best = [i, s, n];
    }
  }
  return best;
}

/** The rest pose of a rig: bones as placed, chains with their own curl and no wave. */
function restOf(rig: RigData) {
  const worlds = new Map<string, World>();
  const chains = new Map<string, Pt[]>();
  solve(rig, new Map(), new Map(), (c, i) => waveBend(c, i, 0, { amp: 0, speed: 0, curl: c.curl }), worlds, chains);
  return { worlds, chains };
}

/** Builds the grid of a rig's skin and binds every point to its regions. Null when the rig has no skin. */
export function buildSkin(rig: RigData, maxStrip = 1400): SkinMesh | null {
  const sk = rig.skin;
  if (!sk) return null;
  const [bx, by, bw, bh] = rig.parts[sk.part]!.box;
  const [cols, rows] = sk.grid;
  const n = (cols + 1) * (rows + 1);
  const rest = new Float32Array(n * 2);
  const uv = new Float32Array(n * 2);
  const { worlds, chains } = restOf(rig);
  const targets: Target[] = [];
  const index = new Map<string, number>();
  for (const g of sk.regions) {
    if (index.has(g.bind)) continue;
    index.set(g.bind, targets.length);
    targets.push({ id: g.bind, chain: !rig.bones.some((b) => b.id === g.bind) });
  }
  const binds: Bind[][] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const i = r * (cols + 1) + c;
      const p = { x: bx + (bw * c) / cols, y: by + (bh * r) / rows };
      rest[i * 2] = p.x;
      rest[i * 2 + 1] = p.y;
      uv[i * 2] = c / cols;
      uv[i * 2 + 1] = r / rows;
      // Later regions lie on top: each takes its share and leaves the rest to the ones below it.
      const ws = new Map<number, number>();
      let left = 1;
      let nearest = { t: 0, d: -Infinity };
      for (let k = sk.regions.length - 1; k >= 0; k--) {
        const g = sk.regions[k]!;
        const d = signedDistance(p, g.poly);
        const t = index.get(g.bind)!;
        if (d > nearest.d) nearest = { t, d };
        const soft = g.soft ?? sk.soft;
        const m = smooth((d + soft) / (2 * soft)) * left;
        if (m > 0) ws.set(t, (ws.get(t) ?? 0) + m);
        left -= m;
      }
      let sum = 0;
      for (const v of ws.values()) sum += v;
      if (sum < 1e-4) {
        ws.clear();
        ws.set(nearest.t, 1);
        sum = 1;
      }
      const list: Bind[] = [];
      for (const [t, w] of ws) {
        const tg = targets[t]!;
        if (tg.chain) {
          const [seg, s, across] = along(p, chains.get(tg.id)!);
          list.push({ target: t, w: w / sum, a: seg, b: s, c: across });
        } else {
          const o = worlds.get(tg.id)!;
          const cs = Math.cos(-o.rot);
          const sn = Math.sin(-o.rot);
          const dx = p.x - o.x;
          const dy = p.y - o.y;
          list.push({ target: t, w: w / sum, a: (dx * cs - dy * sn) / o.sx, b: (dx * sn + dy * cs) / o.sy, c: 0 });
        }
      }
      binds.push(list);
    }
  }
  const perRow = 2 * (cols + 1) + 2;
  const band = Math.max(1, Math.floor(maxStrip / perRow));
  const strips: Uint32Array[] = [];
  for (let r0 = 0; r0 < rows; r0 += band) {
    const order: number[] = [];
    const r1 = Math.min(rows, r0 + band);
    for (let r = r0; r < r1; r++) {
      if (r > r0) order.push(r * (cols + 1));
      for (let c = 0; c <= cols; c++) order.push(r * (cols + 1) + c, (r + 1) * (cols + 1) + c);
      if (r + 1 < r1) order.push((r + 1) * (cols + 1) + cols);
    }
    strips.push(Uint32Array.from(order));
  }
  return { cols, rows, rest, uv, strips, targets, binds };
}

/** Bends the skin to a solved frame: writes every grid point's canvas position into `out` (2 per point). */
export function deformSkin(
  mesh: SkinMesh,
  worlds: ReadonlyMap<string, World>,
  chains: ReadonlyMap<string, readonly Pt[]>,
  out: Float32Array,
): Float32Array {
  for (let i = 0; i < mesh.binds.length; i++) {
    let x = 0;
    let y = 0;
    for (const bd of mesh.binds[i]!) {
      const tg = mesh.targets[bd.target]!;
      let px: number;
      let py: number;
      if (tg.chain) {
        const pts = chains.get(tg.id);
        if (!pts || pts.length < 2) {
          px = mesh.rest[i * 2]!;
          py = mesh.rest[i * 2 + 1]!;
        } else {
          const a = pts[bd.a]!;
          const b = pts[bd.a + 1]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          px = a.x + dx * bd.b - (dy / len) * bd.c;
          py = a.y + dy * bd.b + (dx / len) * bd.c;
        }
      } else {
        const o = worlds.get(tg.id);
        if (!o) {
          px = mesh.rest[i * 2]!;
          py = mesh.rest[i * 2 + 1]!;
        } else {
          const lx = bd.a * o.sx;
          const ly = bd.b * o.sy;
          const cs = Math.cos(o.rot);
          const sn = Math.sin(o.rot);
          px = o.x + lx * cs - ly * sn;
          py = o.y + lx * sn + ly * cs;
        }
      }
      x += px * bd.w;
      y += py * bd.w;
    }
    out[i * 2] = x;
    out[i * 2 + 1] = y;
  }
  return out;
}
