// Interacting (spec §4): standing near an object shows its key hint, and the interact key uses the
// nearest one in reach. Pure.
import type { Interactable, Vec } from './types';

/** The nearest interactable whose reach covers `from`; ties go to the smaller id. */
export function nearestInteractable<T extends Interactable>(items: readonly T[], from: Vec): T | null {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const item of items) {
    const d = Math.hypot(item.x - from.x, item.y - from.y);
    if (d > item.reach) continue;
    if (d < bestDist || (d === bestDist && best !== null && item.id < best.id)) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}
