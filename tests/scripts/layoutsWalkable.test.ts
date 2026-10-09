// The walking layouts (GĐ3): from the spawn the character can stand next to every door of the plaza and
// every usable object of the farm, and the farm's way out is among them. Art sizes come from the real PNGs.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';
import { plazaWalkable } from '../../src/areas/plaza/logic/walkable';
import { FARM_LAYOUT } from '../../src/areas/farm/scene/config/layout';
import { placementTransform } from '../../src/areas/farm/scene/view/sceneLayout';
import { farmSpawn, farmWalkable } from '../../src/areas/farm/scene/view/playerArea';
import { FARM_VIEW } from '../../src/areas/farm/scene/config/farmView';
import { CHARACTER } from '../../src/core/config/character';
import { canStand, settle, type Rect, type Vec, type Walkable } from '../../src/systems/character';
import { footprintOf, frontOf } from '../../src/systems/layout/footprint';
import type { AssetManifest } from '../../src/core/assets/manifestSchema';

const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as AssetManifest;
const rows = [...manifest.props, ...manifest.buildings, ...manifest.environment];
const sizeOfArt = (id: string) => {
  const row = rows.find((r) => r.id === id);
  const r = row as { asset?: string; states?: Record<string, string> } | undefined;
  const path = r?.asset ?? Object.values(r?.states ?? {})[0];
  if (!path) throw new Error(`no file for ${id}`);
  const png = PNG.sync.read(readFileSync(`public/assets/${path}`));
  return { w: png.width, h: png.height };
};

interface Item {
  id: string;
  rect: Rect;
  solid: boolean;
  usable: boolean;
}

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
function reachable(from: Vec, walk: Walkable, step = 12): (p: Vec, within: number) => boolean {
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
  return (p, within) => [...seen.values()].some((c) => Math.hypot(c.x - p.x, c.y - p.y) <= within);
}

describe('plaza layout', () => {
  const { width: W, height: H } = PLAZA_LAYOUT.designSize;
  const items: Item[] = PLAZA_LAYOUT.placements
    .filter((p) => p.visible !== false && sizeOfArt(p.id))
    .map((p) => ({ id: p.portal ?? p.id, rect: boundsOf(p, W, H), solid: p.solid === true, usable: p.portal !== undefined }));
  const walk = plazaWalkable(PLAZA_LAYOUT, items.filter((i) => i.solid).map((i) => footprintOf(i.rect)), feet);
  const spawn = { x: PLAZA_LAYOUT.spawn.x * W, y: PLAZA_LAYOUT.spawn.y * H };

  it('the spawn is on free ground', () => {
    expect(canStand(spawn, walk)).toBe(true);
  });

  it('every door can be reached and used from the spawn', () => {
    const reach = reachable(spawn, walk);
    for (const door of items.filter((i) => i.usable)) {
      expect(reach(frontOf(door.rect), PLAZA_LAYOUT.portalReach), door.id).toBe(true);
    }
  });
});

describe('farm layout', () => {
  const { width: W, height: H } = FARM_LAYOUT.designSize;
  const placed = FARM_LAYOUT.placements.filter((p) => p.visible !== false && !p.decor && sizeOfArt(p.id));
  const things = placed.filter((p) => p.action).map((p) => ({ action: p.action!, rect: boundsOf(p, W, H) }));
  const walk = farmWalkable(
    FARM_LAYOUT,
    placed.filter((p) => !p.id.startsWith('env_')).map((p) => footprintOf(boundsOf(p, W, H))),
    feet,
  );

  it('the entrance is on free ground', () => {
    expect(canStand(farmSpawn(FARM_LAYOUT), walk)).toBe(true);
  });

  it('has exactly one way out to the plaza, and every usable object can be reached and used', () => {
    expect(things.filter((t) => t.action === 'plaza')).toHaveLength(1);
    const reach = reachable(farmSpawn(FARM_LAYOUT), walk);
    for (const t of things) {
      const range = Math.max(FARM_VIEW.REACH.objectMin, t.rect.width * FARM_VIEW.REACH.objectPerWidth);
      expect(reach(frontOf(t.rect), range), t.action).toBe(true);
    }
  });
});
