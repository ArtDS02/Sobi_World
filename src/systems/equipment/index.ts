// Equipment (spec V2 §7, §8.5): a fighter wears one piece in each slot; each piece adds to its stats. Pure data and
// functions: the pieces themselves are content (content/adventure/equipment.json), the pieces in the bag are items.
import type { Stats } from '../combat/types';

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'charm'] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export interface EquipmentDef {
  /** The item that holds it in the bag. */
  id: string;
  slot: EquipmentSlot;
  rarity: string;
  stats: Partial<Stats>;
}

/** What a fighter wears: the item id in each slot (absent = nothing). */
export type Loadout = Partial<Record<EquipmentSlot, string>>;

/** The stats a loadout adds up to (unknown pieces count for nothing). */
export function loadoutBonus(loadout: Loadout, defs: Readonly<Record<string, EquipmentDef>>): Stats {
  const sum: Stats = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 };
  for (const slot of EQUIPMENT_SLOTS) {
    const piece = loadout[slot] ? defs[loadout[slot]!] : undefined;
    if (!piece) continue;
    for (const key of Object.keys(sum) as (keyof Stats)[]) sum[key] += piece.stats[key] ?? 0;
  }
  return sum;
}

/** `piece` put on: the new loadout and the piece it replaced (to give back to the bag). */
export function equipPiece(loadout: Loadout, piece: EquipmentDef): { loadout: Loadout; replaced: string | null } {
  return { loadout: { ...loadout, [piece.slot]: piece.id }, replaced: loadout[piece.slot] ?? null };
}

/** The slot emptied: the new loadout and the piece taken off (null when the slot was empty). */
export function unequipSlot(loadout: Loadout, slot: EquipmentSlot): { loadout: Loadout; removed: string | null } {
  const { [slot]: removed, ...rest } = loadout;
  return { loadout: rest, removed: removed ?? null };
}
