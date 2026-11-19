// Where the party may walk in the diorama (G0): read from the same smooth fields the ground is drawn from, so what looks open is open
// and what looks blocked (woods, water, rock) is blocked — instead of today's tile grid, which no longer matches the curved borders.
// Decks are open over the water; the things of the area (chests, stones, springs…) and the props keep their tile footprints. Pure.
import type { Walkable } from '../../../src/systems/character';
import { AB, PROPS, type AreaMap } from '../../../src/areas/adventure/logic/config/content';
import { thingsOf } from '../../../src/areas/adventure/logic/maps';
import { deckAt, weightsAt, type Deck, type Grid } from './field';

/** Cells per tile of the walk grid. */
const CELLS = 4;
/** A kind blocks once its share passes this (the same line the woods are grown on, dress.ts). */
export const BLOCK_SHARE = 0.5;

/** True where the drawn ground blocks (woods, water, rock), area tile coords. */
export const blockedAt = (g: Grid, decks: readonly Deck[], x: number, z: number): boolean => {
  if (deckAt(decks, x, z)) return false;
  const [, forest, water, rock] = weightsAt(g, x, z);
  return forest > BLOCK_SHARE || water > BLOCK_SHARE || rock > BLOCK_SHARE;
};

/** The walkable world in game px (1 tile = map.tile px), for the game's own `stepCharacter`. */
export function walkOf(map: AreaMap, g: Grid, decks: readonly Deck[]): Walkable {
  const w = map.cols * CELLS;
  const h = map.rows * CELLS;
  const blocked = new Uint8Array(w * h);
  for (let j = 0; j < h; j += 1)
    for (let i = 0; i < w; i += 1) blocked[j * w + i] = blockedAt(g, decks, (i + 0.5) / CELLS, (j + 0.5) / CELLS) ? 1 : 0;
  const mark = (x: number, y: number, tw: number, th: number) => {
    for (let j = y * CELLS; j < (y + th) * CELLS; j += 1)
      for (let i = x * CELLS; i < (x + tw) * CELLS; i += 1) if (i >= 0 && j >= 0 && i < w && j < h) blocked[j * w + i] = 1;
  };
  for (const t of thingsOf(map)) if (t.kind !== 'exit' && t.kind !== 'portal' && t.kind !== 'gate') mark(t.x, t.y, t.w, t.h);
  for (const p of map.props) {
    const def = PROPS[p.prop];
    // A landmark stands on the back half of its footprint: its picture overhangs the front.
    if (def) mark(p.x, p.y, def.w, Math.max(1, def.h - 1));
  }
  const px = map.tile / CELLS;
  const obstacles: Walkable['obstacles'][number][] = [];
  for (let j = 0; j < h; j += 1) {
    let i = 0;
    while (i < w) {
      if (!blocked[j * w + i]) {
        i += 1;
        continue;
      }
      const start = i;
      while (i < w && blocked[j * w + i]) i += 1;
      obstacles.push({ x: start * px, y: j * px, width: (i - start) * px, height: px });
    }
  }
  return { bounds: { x: 0, y: 0, width: map.cols * map.tile, height: map.rows * map.tile }, obstacles, halfW: AB.explore.feetHalfWidth, halfH: AB.explore.feetHalfHeight };
}
