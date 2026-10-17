// How much of a zone has been found (spec §3.9): treasure chests, element gates, lore stones and portals opened for good, over all there
// are in its areas. Pure.
import { MAPS, ZONES } from './config/content';
import type { AdventureState } from './state';

export interface Discovery {
  found: number;
  total: number;
  percent: number;
}

export function discovery(a: Pick<AdventureState, 'openedChests' | 'openedGates' | 'loreFound' | 'activePortals'>, mapIds: readonly string[]): Discovery {
  let found = 0;
  let total = 0;
  for (const id of mapIds) {
    const m = MAPS[id];
    if (!m) continue;
    const count = (ids: readonly string[], have: readonly string[]) => {
      total += ids.length;
      found += ids.filter((x) => have.includes(x)).length;
    };
    count(m.chests.map((c) => c.id), a.openedChests);
    count(m.gates.map((g) => g.id), a.openedGates);
    count(m.lore.map((l) => l.id), a.loreFound);
    // The entrance portal is lit from the start; the others count once lit.
    const zone = ZONES[m.zoneId];
    if (zone && zone.maps[0] !== m.id) count([m.id], a.activePortals);
  }
  return { found, total, percent: total === 0 ? 100 : Math.round((found / total) * 100) };
}

export const zoneDiscovery = (a: Parameters<typeof discovery>[0], zoneId: string): Discovery => discovery(a, ZONES[zoneId]?.maps ?? []);
