// What blocks the party on a diorama map, and what stands there to show it (docs/maps/MAP_SCENE_STANDARD.md §1.2). Every tile the
// game blocks (`blockedTiles`: walls, water, props, things, decor, closed gates) gets a kind of blocker; trunks, bushes, rocks and
// stumps are put ONLY in the tiles that block, one per tile, with their whole foot ring inside the tile. Seeded by tile, so an area
// always looks the same. Pure (no Three, no DOM): the test reads this directly.
import { PROPS, type AreaMap } from '../../logic/config/content';
import { thingsOf, type Thing } from '../../logic/maps';
import { sceneryBlocks } from '../../logic/scenery';
import { K, MARGIN, gridOf, type Grid } from './field';
import { hash2 } from './noise';

export type BlockerKind = 'tree' | 'bush' | 'rock' | 'cliff' | 'water' | 'fall' | 'prop' | 'thing' | 'decor' | 'gate';

export interface BlockerPlan {
  cols: number;
  rows: number;
  /** Per tile (row-major): the blocker that shows it, null where the party may walk. */
  kind: (BlockerKind | null)[];
}

type Rects = readonly Pick<Thing, 'x' | 'y' | 'w' | 'h'>[];

/** Kinds whose blocker is a standing foot placed by `placeFeet` (the others are the ground, a cliff face, water or a picture). */
export const FOOT_KINDS: readonly BlockerKind[] = ['tree', 'bush', 'rock'];

/** The blocker of each blocked tile of an area (null where it is walkable). */
export function blockerPlan(map: AreaMap, opened: ReadonlySet<string> = new Set(), closed: Rects = [], g: Grid = gridOf(map, opened, closed)): BlockerPlan {
  const { cols, rows } = map;
  const kind = new Array<BlockerKind | null>(cols * rows).fill(null);
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && !g.blocked[y * cols + x];
  for (let y = 0; y < rows; y += 1)
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x;
      if (!g.blocked[i]) continue;
      const c = map.terrain[y]?.[x] ?? '#';
      if (c === '~') kind[i] = 'water';
      else if (c === 'w') kind[i] = 'fall';
      else if (c === 'F') kind[i] = 'cliff';
      else kind[i] = woodKind(g, x, y, open);
    }
  const mark = (r: Pick<Thing, 'x' | 'y' | 'w' | 'h'>, k: BlockerKind) => {
    for (let y = r.y; y < r.y + r.h; y += 1) for (let x = r.x; x < r.x + r.w; x += 1) if (x >= 0 && y >= 0 && x < cols && y < rows && g.blocked[y * cols + x]) kind[y * cols + x] = k;
  };
  for (const p of map.props) {
    const def = PROPS[p.prop];
    if (def) mark({ x: p.x, y: p.y, w: def.w, h: def.h }, 'prop');
  }
  for (const r of sceneryBlocks(map)) mark(r, 'decor');
  for (const t of thingsOf(map)) if (t.kind !== 'exit' && !(t.kind === 'gate' && opened.has(t.id))) mark(t, t.kind === 'gate' ? 'gate' : 'thing');
  for (const r of closed) mark(r, 'gate');
  // Whatever the game blocks must show something, even where no rule above spoke.
  for (let i = 0; i < kind.length; i += 1) if (g.blocked[i] && !kind[i]) kind[i] = 'bush';
  return { cols, rows, kind };
}

/** A blocked tile of wood: trees deep inside and at the edge, bushes and rocks along it, a bush alone. */
function woodKind(g: Grid, x: number, y: number, open: (x: number, y: number) => boolean): BlockerKind {
  const free = [open(x + 1, y), open(x - 1, y), open(x, y + 1), open(x, y - 1)].filter(Boolean).length;
  const roll = hash2(x, y, 41);
  if (g.kind[(y + MARGIN) * g.W + x + MARGIN] === K.rock) return roll < 0.2 ? 'tree' : 'cliff';
  if (free >= 3) return roll < 0.3 ? 'rock' : 'bush';
  if (free > 0) return roll < 0.3 ? 'bush' : roll < 0.45 ? 'rock' : 'tree';
  return roll < 0.6 ? 'tree' : 'bush';
}

export interface Foot {
  kind: 'tree' | 'bush' | 'rock' | 'stump';
  /** Where it stands, area tile coords (1 = one tile), and the radius of its foot ring. */
  x: number;
  z: number;
  r: number;
  /** The area tile index it stands in (-1 = the forest margin around the area). */
  tile: number;
  /** A tree's picture (an index into the share list) and two seeded rolls (size, flip). */
  variant: number;
  roll: number;
  flip: boolean;
  /** Made of the area's corruption (a `corrupt_*` picture). */
  bad: boolean;
}

export interface FeetOpts {
  /** Shares of the tree pictures, in order (they need not sum to 1). */
  mix: readonly number[];
  /** Corruption's reach: tiles within `r` of (x, y) are corrupt with this chance (centre) falling off to 0 at the rim. */
  corrupt?: { x: number; y: number; r: number; share: number; /** Toward the rim of the ellipse (half-width `r`, 16:9 tall) instead of the centre. */ rim?: boolean };
}

const RADIUS = { tree: 0.22, bush: 0.3, rock: 0.3, stump: 0.25 } as const;

const pick = (shares: readonly number[], roll: number): number => {
  const total = shares.reduce((a, b) => a + b, 0);
  let left = roll * total;
  const i = shares.findIndex((s) => (left -= s) < 0);
  return i < 0 ? shares.length - 1 : i;
};

/** One foot per tree / bush / rock tile of the plan, inside its tile; the same plan always gives the same feet. */
export function placeFeet(plan: BlockerPlan, opts: FeetOpts): Foot[] {
  const out: Foot[] = [];
  for (let i = 0; i < plan.kind.length; i += 1) {
    const k = plan.kind[i];
    if (k !== 'tree' && k !== 'bush' && k !== 'rock') continue;
    const x = i % plan.cols;
    const y = Math.floor(i / plan.cols);
    const roll = hash2(x, y, 42);
    const kind = k === 'bush' && roll < 0.12 ? 'stump' : k;
    const r = RADIUS[kind];
    const slack = 0.5 - r - 0.03;
    const cx = x + 0.5 + (hash2(x, y, 43) - 0.5) * 2 * slack;
    const cz = y + 0.5 + (hash2(x, y, 44) - 0.5) * 2 * slack;
    out.push({ kind, x: cx, z: cz, r, tile: i, variant: pick(opts.mix, hash2(x, y, 45)), roll: hash2(x, y, 46), flip: hash2(x, y, 47) < 0.5, bad: isBad(opts, cx, cz, x, y) });
  }
  return out;
}

function isBad(opts: FeetOpts, x: number, z: number, tx: number, ty: number): boolean {
  const c = opts.corrupt;
  if (!c) return false;
  // A rim map: none inside 55 % of the ellipse, full at its edge (and beyond, in the margin woods).
  const near = c.rim ? (Math.hypot((x - c.x) / c.r, (z - c.y) / (c.r * 0.5625)) - 0.55) / 0.45 : 1 - Math.hypot(x - c.x, z - c.y) / c.r;
  return near > 0 && hash2(tx, ty, 48) < c.share * Math.min(1, near * 1.6);
}

/** The woods around the area (the margin the world never ends at): trees on a jittered lattice, clear of the area by their foot. */
export function marginTrees(map: AreaMap, opts: FeetOpts): Foot[] {
  const out: Foot[] = [];
  const step = 1.3;
  const r = RADIUS.tree;
  for (let z = -MARGIN + 0.5; z < map.rows + MARGIN; z += step)
    for (let x = -MARGIN + 0.5; x < map.cols + MARGIN; x += step) {
      const px = x + (hash2(Math.round(x * 97), Math.round(z * 89), 1) - 0.5) * step * 0.8;
      const pz = z + (hash2(Math.round(x * 97), Math.round(z * 89), 2) - 0.5) * step * 0.8;
      if (px > -r && px < map.cols + r && pz > -r && pz < map.rows + r) continue;
      const q = (k: number) => hash2(Math.round(px * 97), Math.round(pz * 89), k);
      out.push({ kind: 'tree', x: px, z: pz, r, tile: -1, variant: pick(opts.mix, q(4)), roll: q(5), flip: q(6) < 0.5, bad: false });
    }
  return out;
}
