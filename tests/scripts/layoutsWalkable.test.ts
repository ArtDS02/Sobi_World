// The plaza is a place to walk (GĐ3): from the spawn the character can reach every door, is stopped by the
// objects and the sea, and never stands inside anything. Art sizes come from the real PNGs. The farm is played
// with clicks (spec §4): it has no walking and no test here.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { placementTransform } from '../../src/areas/farm/scene/view/sceneLayout';
import { FARM_VIEW } from '../../src/areas/farm/scene/config/farmView';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';
import { plazaObstacles, plazaWalkable } from '../../src/areas/plaza/logic/walkable';
import type { AssetManifest } from '../../src/core/assets/manifestSchema';
import { CHARACTER } from '../../src/core/config/character';
import { canStand, settle, type Rect, type Vec, type Walkable } from '../../src/systems/character';
import { frontOf } from '../../src/systems/layout/footprint';

const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as AssetManifest;
const rows = [...manifest.props, ...manifest.buildings, ...manifest.environment];
const sizeOfArt = (id: string) => {
  const row = rows.find((r) => r.id === id) as { asset?: string; states?: Record<string, string> } | undefined;
  const path = row?.asset ?? Object.values(row?.states ?? {})[0];
  if (!path) throw new Error(`no file for ${id}`);
  const png = PNG.sync.read(readFileSync(`public/assets/${path}`));
  return { w: png.width, h: png.height };
};

/** Where a placement is drawn: origin (0.5, 1) by default, width / height scaled like the scenes do. */
function boundsOf(p: { id: string; x: number; y: number; width?: number; height?: number; originX?: number; originY?: number }, W: number, H: number): Rect {
  const art = sizeOfArt(p.id);
  const t = placementTransform({ ...p, layer: 4 }, art.w, art.h);
  const width = art.w * t.scaleX;
  const height = art.h * t.scaleY;
  const ox = p.originX ?? FARM_VIEW.PLACEMENT_ORIGIN.x;
  const oy = p.originY ?? FARM_VIEW.PLACEMENT_ORIGIN.y;
  return { x: p.x * W - width * ox, y: p.y * H - height * oy, width, height };
}

const feet = { halfW: CHARACTER.feetHalfWidth, halfH: CHARACTER.feetHalfHeight };

/** Flood fill over a grid of standable cells from `from`. */
function reachable(from: Vec, walk: Walkable, step = 12): { has: (p: Vec, within: number) => boolean; cells: number } {
  const start = settle(from, walk);
  const seen = new Map<string, Vec>();
  const queue: Vec[] = [start];
  const key = (p: Vec) => `${Math.round(p.x / step)},${Math.round(p.y / step)}`;
  seen.set(key(start), start);
  while (queue.length > 0) {
    const p = queue.pop()!;
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (seen.has(key(n)) || !canStand(n, walk)) continue;
      seen.set(key(n), n);
      queue.push(n);
    }
  }
  return { has: (p, within) => [...seen.values()].some((c) => Math.hypot(c.x - p.x, c.y - p.y) <= within), cells: seen.size };
}

describe('plaza terrain', () => {
  const { width: W, height: H } = PLAZA_LAYOUT.designSize;
  const art = PLAZA_LAYOUT.placements.map((p) => (p.visible === false ? null : boundsOf(p, W, H)));
  const obstacles = plazaObstacles(PLAZA_LAYOUT, (i) => art[i] ?? null);
  const walk = plazaWalkable(PLAZA_LAYOUT, obstacles, feet);
  const spawn = { x: PLAZA_LAYOUT.spawn.x * W, y: PLAZA_LAYOUT.spawn.y * H };
  const doors = PLAZA_LAYOUT.placements.flatMap((p, i) => (p.portal ? [{ id: p.portal, rect: art[i]! }] : []));

  it('the spawn is on free ground', () => {
    expect(canStand(spawn, walk)).toBe(true);
  });

  it('every door can be reached and used from the spawn', () => {
    const reach = reachable(spawn, walk);
    for (const door of doors) expect(reach.has(frontOf(door.rect), PLAZA_LAYOUT.portalReach), door.id).toBe(true);
  });

  it('objects and the sea stop the character: their foot and the water are not standable', () => {
    for (const [i, p] of PLAZA_LAYOUT.placements.entries()) {
      if (!p.solid) continue;
      const b = art[i]!;
      expect(canStand({ x: b.x + b.width / 2, y: b.y + b.height - 3 }, walk), `${p.id} #${i}`).toBe(false);
    }
    const sea = PLAZA_LAYOUT.ground.find((g) => g.kind === 'ellipse' && g.blocks);
    expect(sea).toBeDefined();
    if (sea?.kind === 'ellipse') {
      expect(canStand({ x: sea.x * W + 40, y: sea.y * H - 40 }, walk)).toBe(false);
    }
  });

  it('a good part of the square stays walkable (the layout is not a maze)', () => {
    const reach = reachable(spawn, walk);
    const area = walk.bounds.width * walk.bounds.height;
    expect(reach.cells * 12 * 12).toBeGreaterThan(area * 0.45);
  });
});
