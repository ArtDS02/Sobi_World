// The world's counters (progression.stats) that no Area owns: what the standard world events say about farming
// and crafting. The farm keeps its own counters (areas/farm/logic/progress.ts); each stat id has one owner, so
// nothing is counted twice. Pure.
import type { WorldEvent } from '../events';

/** Stat deltas of one standard world event. */
export function statDeltas(e: WorldEvent): Readonly<Record<string, number>> {
  switch (e.type) {
    case 'crop.planted':
      return { cropsPlanted: 1 };
    case 'crop.harvested':
      return { cropsHarvested: e.quantity };
    case 'fish.caught':
      return { fishCaught: 1 };
    case 'tank.cleaned':
      return { tanksCleaned: 1 };
    case 'flower.harvested':
      return { flowersHarvested: e.quantity };
    case 'potion.brewed':
      return { potionsBrewed: e.quantity };
    case 'recipe.completed':
      return { crafts: 1 };
    default:
      return {};
  }
}

/** `stats` with the events' deltas added; the same object when nothing counts. */
export function trackStats(stats: Readonly<Record<string, number>>, events: readonly WorldEvent[]): Record<string, number> | null {
  let next: Record<string, number> | null = null;
  for (const e of events) {
    for (const [id, n] of Object.entries(statDeltas(e))) {
      next ??= { ...stats };
      next[id] = (next[id] ?? 0) + n;
    }
  }
  return next;
}
