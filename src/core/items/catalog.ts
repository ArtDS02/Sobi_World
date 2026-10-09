// Item definitions (spec §6 Item): lookups by id over content/shared/items.json. An id the content no
// longer has (a save from a newer or older build) resolves to undefined instead of throwing.
import { ITEMS, type ItemDef } from '../config/items';

export const itemDef = (id: string): ItemDef | undefined =>
  Object.hasOwn(ITEMS, id) ? ITEMS[id as keyof typeof ITEMS] : undefined;

export const isFood = (item: ItemDef): boolean => item.hungerRestore > 0;
export const isMedicine = (item: ItemDef): boolean => item.curesSickness;
