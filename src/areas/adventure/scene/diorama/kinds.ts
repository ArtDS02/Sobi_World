// The diorama's tile kinds and the margin of forest around an area. Pure (no Three, no DOM).
/** Ground kinds of a tile. */
export const K = {
  grass: 0,
  path: 1,
  forest: 2,
  water: 3,
  rock: 4,
  bridge: 5,
  high: 6,
  moss: 7,
} as const;
export type Kind = (typeof K)[keyof typeof K];

/** Tiles of forest drawn around the area so the world never ends at its edge. */
export const MARGIN = 10;
