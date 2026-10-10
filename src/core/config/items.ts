// Items (spec §6 Item): what each one does — content/shared/items.json.
import { byId, CONTENT } from './content';
import type { ItemCategory, Rarity } from '../../../content/schemas/vocab';
import { ITEM_ID_VALUES, type ItemId } from './ids';

export interface ItemDef {
  id: ItemId;
  category: ItemCategory;
  rarity: Rarity;
  priceGold: number;
  /** What the shop pays for one; absent = cannot be sold. */
  sellGold?: number | undefined;
  hungerRestore: number; // 0 = no hunger effect
  curesSickness: boolean;
  /** Mood points a potion lifts the creature by, for `moodHours` hours (absent = the Bond rule's hours); 0 = none. */
  moodBoost?: number | undefined;
  moodHours?: number | undefined;
  /** Percentage points added to the mutation chance of a breeding that uses it (0 = none). */
  mutationBoost?: number | undefined;
}

/** FOOD_BASIC is also the unit the trough consumes. */
export const ITEMS: Record<ItemId, ItemDef> = byId('shared/items.json', CONTENT.items.items, ITEM_ID_VALUES);

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** Potions a creature can take (they cure an illness or lift its mood): the Cloud's Healing and mood potions. */
export const CREATURE_POTION_IDS: readonly ItemId[] = ITEM_IDS.filter((id) => ITEMS[id].category === 'POTION' && (ITEMS[id].curesSickness || (ITEMS[id].moodBoost ?? 0) > 0));

/** Items that raise the mutation chance when added to a breeding (rare flowers), strongest first. */
export const MUTATION_BOOST_IDS: readonly ItemId[] = ITEM_IDS.filter((id) => (ITEMS[id].mutationBoost ?? 0) > 0).sort((a, b) => (ITEMS[b].mutationBoost ?? 0) - (ITEMS[a].mutationBoost ?? 0));
