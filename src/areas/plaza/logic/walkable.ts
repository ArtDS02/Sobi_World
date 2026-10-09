// The ground the character walks on in the plaza (the layout's walk area) with the objects in the way.
import type { PlazaLayout } from '../../../../content/schemas/plaza/layout';
import type { Rect, Walkable } from '../../../systems/character';

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
