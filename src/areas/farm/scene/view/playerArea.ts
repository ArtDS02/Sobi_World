// Where the player's character walks on the farm and how far it reaches (GĐ3). Pure, design pixels.
import type { Rect, Vec, Walkable } from '../../../../systems/character';
import type { FarmLayout } from '../config/layout';

export function farmWalkable(
  layout: FarmLayout,
  obstacles: readonly Rect[],
  feet: { halfW: number; halfH: number },
): Walkable {
  const { width, height } = layout.designSize;
  const a = layout.player.area;
  return {
    bounds: { x: a.x * width, y: a.y * height, width: a.width * width, height: a.height * height },
    obstacles,
    halfW: feet.halfW,
    halfH: feet.halfH,
  };
}

/** Where the character stands on arriving from the plaza. */
export function farmSpawn(layout: FarmLayout): Vec {
  return { x: layout.player.spawn.x * layout.designSize.width, y: layout.player.spawn.y * layout.designSize.height };
}

/** How close the character must be to use something: a worldly object scales with its width. */
export const objectReach = (displayWidth: number, base: number, perWidth: number): number =>
  Math.max(base, displayWidth * perWidth);
