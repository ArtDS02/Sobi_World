// Equipment (spec V2 §13): a fighter wears one piece in each slot; each piece adds stats and may carry an element affinity, a status
// affinity, resistances and a skill-category bonus. Affinity only amplifies — it never changes the fighter's own element (R7). Pure
// data and functions: the pieces are content (content/adventure/equipment.json), the pieces in the bag are items.
import { zeroStats } from '../combat/stats';
import type { Category, Element, Mods, Stats, StatusId } from '../combat/types';

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'charm'] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export interface EquipmentDef {
  /** The item that holds it in the bag. */
  id: string;
  slot: EquipmentSlot;
  rarity: string;
  levelReq: number;
  stats: Partial<Stats>;
  /** +share of damage of skills of an element, +share of resistance to it. */
  elementAffinity?: { element: Element; damagePct: number; resistPct: number } | undefined;
  /** +chance (share) to apply a status. */
  statusAffinity?: { status: StatusId; chancePct: number } | undefined;
  elementResist?: Partial<Record<Element, number>> | undefined;
  statusResist?: Partial<Record<StatusId, number>> | undefined;
  /** +share of damage / effect of a category of skills. */
  categoryBonus?: { category: Category; pct: number } | undefined;
}

/** What a fighter wears: the item id in each slot (absent = nothing). */
export type Loadout = Partial<Record<EquipmentSlot, string>>;

export type GearMods = Pick<Mods, 'elementDamage' | 'elementResist' | 'statusChance' | 'statusResist' | 'categoryDamage'>;

const add = <K extends string>(into: Partial<Record<K, number>>, key: K, n: number) => {
  into[key] = (into[key] ?? 0) + n;
};

/** The stats a loadout adds up to (unknown pieces count for nothing). */
export function loadoutBonus(loadout: Loadout, defs: Readonly<Record<string, EquipmentDef>>): Stats {
  const sum = zeroStats();
  for (const slot of EQUIPMENT_SLOTS) {
    const piece = loadout[slot] ? defs[loadout[slot]!] : undefined;
    if (!piece) continue;
    for (const key of Object.keys(sum) as (keyof Stats)[]) sum[key] += piece.stats[key] ?? 0;
  }
  return sum;
}

/** The affinities of a loadout as combat modifiers; the caps are applied by the engine (§13). */
export function loadoutMods(loadout: Loadout, defs: Readonly<Record<string, EquipmentDef>>): GearMods {
  const mods: GearMods = { elementDamage: {}, elementResist: {}, statusChance: {}, statusResist: {}, categoryDamage: {} };
  for (const slot of EQUIPMENT_SLOTS) {
    const piece = loadout[slot] ? defs[loadout[slot]!] : undefined;
    if (!piece) continue;
    if (piece.elementAffinity) {
      add(mods.elementDamage, piece.elementAffinity.element, piece.elementAffinity.damagePct);
      if (piece.elementAffinity.resistPct > 0) add(mods.elementResist, piece.elementAffinity.element, piece.elementAffinity.resistPct);
    }
    if (piece.statusAffinity) add(mods.statusChance, piece.statusAffinity.status, piece.statusAffinity.chancePct);
    for (const [el, n] of Object.entries(piece.elementResist ?? {})) add(mods.elementResist, el as Element, n);
    for (const [st, n] of Object.entries(piece.statusResist ?? {})) add(mods.statusResist, st as StatusId, n);
    if (piece.categoryBonus) add(mods.categoryDamage, piece.categoryBonus.category, piece.categoryBonus.pct);
  }
  return mods;
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
