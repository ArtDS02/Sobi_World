// The Adventure materials a Lv3–Lv4 upgrade takes from the bag besides coins (GĐ11, spec §3.3). All or nothing.
import { takeFromBag } from '../../../core/inventory/bag';
import type { FarmGame } from './types';

export function takeMaterials(inventory: FarmGame['inventory'], materials: Readonly<Partial<Record<string, number>>> | undefined) {
  let items = inventory;
  for (const [id, n] of Object.entries(materials ?? {})) {
    const taken = takeFromBag(items, id, n ?? 0);
    if (!taken.ok) return taken;
    items = taken.items;
  }
  return { ok: true as const, items };
}
