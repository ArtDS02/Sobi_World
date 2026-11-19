// Which overhead cover (decision 045) the party stands under: pure, so the scene's rules and any renderer agree on it.
import type { AreaMap } from '../logic/config/content';
import { coverAt } from '../logic/maps';

/** The id of the cover over the tile at `pos` (design px), or null when the party stands in the open. */
export function coverUnder(map: AreaMap, pos: { x: number; y: number }): string | null {
  return coverAt(map, pos)?.id ?? null;
}
