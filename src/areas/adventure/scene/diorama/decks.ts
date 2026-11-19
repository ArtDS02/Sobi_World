// Bridge decks of the diorama: one straight deck per group of bridge tiles, and where a walker's feet stand (on a deck, else on the
// ground). Pure (no Three, no DOM).
import { K, heightAt, kindAt, type Grid } from './field';

/** A bridge deck: centre, size (world units) and whether the way runs along x. */
export interface Deck {
  cx: number;
  cz: number;
  w: number;
  d: number;
  along: boolean;
}

/** Height of the top of every deck. */
export const DECK_TOP = 0.14;

/** One straight deck per group of bridge tiles: its bounding box (today's grids paint bridges with ragged edges). */
export function decksOf(g: Grid): Deck[] {
  const out: Deck[] = [];
  const seen = new Set<number>();
  for (let y = 0; y < g.rows; y += 1)
    for (let x = 0; x < g.cols; x += 1) {
      if (kindAt(g, x, y) !== K.bridge || seen.has(y * g.cols + x)) continue;
      let [x0, y0, x1, y1] = [x, y, x, y];
      const todo = [[x, y]];
      seen.add(y * g.cols + x);
      while (todo.length) {
        const [cx, cy] = todo.pop()!;
        x0 = Math.min(x0, cx!);
        x1 = Math.max(x1, cx!);
        y0 = Math.min(y0, cy!);
        y1 = Math.max(y1, cy!);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]] as const) {
          const nx = cx! + dx;
          const ny = cy! + dy;
          const k = ny * g.cols + nx;
          if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows || seen.has(k) || kindAt(g, nx, ny) !== K.bridge) continue;
          seen.add(k);
          todo.push([nx, ny]);
        }
      }
      // The way runs across the water: along x when the water lies above and below the deck.
      const along = kindAt(g, Math.round((x0 + x1) / 2), y0 - 1) === K.water || kindAt(g, Math.round((x0 + x1) / 2), y1 + 1) === K.water;
      out.push({ cx: (x0 + x1 + 1) / 2, cz: (y0 + y1 + 1) / 2, w: x1 - x0 + 1 + (along ? 0.6 : 0), d: y1 - y0 + 1 + (along ? 0 : 0.6), along });
    }
  return out;
}

/** The deck under (x, z), if any. */
export const deckAt = (decks: readonly Deck[], x: number, z: number): Deck | undefined =>
  decks.find((k) => Math.abs(x - k.cx) <= k.w / 2 && Math.abs(z - k.cz) <= k.d / 2);

/** Where a walker's feet stand at (x, z): on a deck, else on the ground. */
export const standAt = (g: Grid, decks: readonly Deck[], x: number, z: number): number => (deckAt(decks, x, z) ? DECK_TOP : heightAt(g, x, z));

