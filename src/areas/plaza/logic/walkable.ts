// The ground the character walks on in the plaza (the layout's walk area) with what stands in the way:
// the foot of every solid object and the water.
import type { PlazaLayout } from '../../../../content/schemas/plaza/layout';
import type { Rect, Walkable } from '../../../systems/character';
import { DEFAULT_FOOTPRINT, ellipseBlockers, footprintOf } from '../../../systems/layout/footprint';

/** Height of the strips that stand in for a round lake (design px): finer than the character's feet box. */
const WATER_STRIP_PX = 12;

/**
 * `boundsOf(i)` = where placement `i` is drawn (the scene knows its art size). The same function serves the
 * scene and the tests, so what the tests walk is what the player walks.
 */
export function plazaObstacles(layout: PlazaLayout, boundsOf: (index: number) => Rect | null): Rect[] {
  const { width, height } = layout.designSize;
  const out: Rect[] = [];
  layout.placements.forEach((p, i) => {
    if (!p.solid || p.visible === false) return;
    const bounds = boundsOf(i);
    if (bounds) out.push(footprintOf(bounds, p.footprint ?? DEFAULT_FOOTPRINT));
  });
  for (const g of layout.ground) {
    if (g.kind !== 'ellipse' || !g.blocks) continue;
    out.push(...ellipseBlockers(g.x * width, g.y * height, (g.width * width) / 2, (g.height * height) / 2, WATER_STRIP_PX));
  }
  return out;
}

export function plazaWalkable(
  layout: PlazaLayout,
  obstacles: readonly Rect[],
  feet: { halfW: number; halfH: number },
): Walkable {
  const { width, height } = layout.designSize;
  const a = layout.walkArea;
  return {
    bounds: { x: a.x * width, y: a.y * height, width: a.width * width, height: a.height * height },
    obstacles,
    halfW: feet.halfW,
    halfH: feet.halfH,
  };
}
