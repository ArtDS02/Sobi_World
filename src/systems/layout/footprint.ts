// Where an object blocks walking (ARCHITECTURE systems/layout): only the foot of tall art — a house, a
// tree — stops the character, so they can walk behind its roof but not through its door. Pure.
import type { Rect } from '../character/types';

export interface FootprintShape {
  /** Share of the art's height, from the bottom, that blocks. */
  depth: number;
  /** Share of the art's width, from the middle, that blocks. */
  width: number;
}

export const DEFAULT_FOOTPRINT: FootprintShape = { depth: 0.22, width: 0.8 };

/** The blocking part of an object drawn in `bounds`. */
export function footprintOf(bounds: Rect, shape: FootprintShape = DEFAULT_FOOTPRINT): Rect {
  const width = bounds.width * shape.width;
  const height = Math.max(1, bounds.height * shape.depth);
  return {
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + bounds.height - height,
    width,
    height,
  };
}

/** The point in front of an object where the character stands to use it: the middle of its foot line. */
export const frontOf = (bounds: Rect): { x: number; y: number } => ({
  x: bounds.x + bounds.width / 2,
  y: bounds.y + bounds.height,
});
