// Game events returned by advanceWorld (spec §7.4) and by actions.
import type { NeedLevel } from './config/care';
import type { ItemId } from '../../../core/config/ids';
import type { BreedId, DecorId } from './config/ids';
import type { Purpose } from '../../../systems/creature/types';

export type PigNeed = 'hunger' | 'clean';

export type GameEvent =
  // `at` (epoch ms) and `stalled` (not yet adult) feed the away summary (§9.5).
  | { type: 'PIG_HUNGRY_ZERO'; pigId: string; at: number; stalled: boolean }
  | { type: 'PIG_BECAME_SICK'; pigId: string }
  // GĐ2 health: an untreated illness turned critical; later, fatal (the pig leaves the farm).
  | { type: 'PIG_BECAME_CRITICAL'; pigId: string }
  | { type: 'PIG_DIED'; pigId: string; name: string; breed: BreedId }
  // NH-1: hunger / cleanliness fell into a worse care level (low or below), once per drop.
  | { type: 'PIG_NEED_DROPPED'; pigId: string; need: PigNeed; level: NeedLevel }
  | { type: 'PIG_BECAME_ADULT'; pigId: string }
  // PL-1: the trough fed this pig (auto-feeding); the farm shows it walking over to eat.
  | { type: 'PIG_ATE_FROM_TROUGH'; pigId: string; meals: number; hungerBefore: number }
  | { type: 'BIRTH'; motherId: string; childId: string; childBreed: BreedId }
  | { type: 'TROUGH_EMPTY'; at: number } // when the last unit was eaten
  | { type: 'ORDER_NEW'; orderId: string }
  | { type: 'ORDER_EXPIRED'; orderId: string }
  | { type: 'LEVEL_UP'; level: number }
  | { type: 'DISCOVERY'; kind: 'BREED'; id: string; gold: number }
  // Action feedback (spec §8.0, D25). Gold is signed as in the transaction.
  | { type: 'PIG_BOUGHT'; pigId: string; breed: BreedId }
  | { type: 'PIG_ADOPTED'; pigId: string; breed: BreedId } // a newborn raised from the nursery (BR-1)
  | { type: 'PIG_FED'; pigId: string; itemId?: string; favorite?: boolean }
  // GĐ6: petting raises bond (hearts = whole hearts after it); the purpose a pig is raised for.
  | { type: 'PIG_PETTED'; pigId: string; bond: number; hearts: number }
  | { type: 'PIG_PURPOSE_SET'; pigId: string; purpose: Purpose }
  | { type: 'PIG_CLEANED'; pigIds: string[] }
  | { type: 'PIG_TREATED'; pigId: string }
  | { type: 'TROUGH_UPGRADED'; level: number; capacity: number; gold: number }
  | { type: 'TROUGH_FILLED'; units: number; fromInventory: number; gold: number }
  | { type: 'ITEM_BOUGHT'; itemId: ItemId; quantity: number; gold: number }
  | { type: 'PIG_RENAMED'; pigId: string }
  // GĐ2: the pen raked (piles → item_manure kept in the bag); items sold from the bag.
  | { type: 'MANURE_CLEANED'; piles: number; kept: number }
  | { type: 'ITEM_SOLD'; itemId: ItemId; quantity: number; gold: number }
  | { type: 'PIG_SOLD'; pigId: string; gold: number }
  | { type: 'BREEDING_STARTED'; motherId: string; fatherId: string; endsAt: number }
  | { type: 'SLOT_BOUGHT'; slots: number; gold: number } // gold signed as in the transaction (§8.0)
  | { type: 'ORDER_FULFILLED'; orderId: string; gold: number }
  | { type: 'GIFT_SPAWNED'; giftId: string }
  | { type: 'GIFT_OPENED'; giftId: string; gold: number; xp: number }
  // PG-1..3: neighbour's help, decorations (the daily reward and achievements are the world's, core/goals).
  | { type: 'RELIEF_CLAIMED'; gold: number; food: number; medicine: number }
  | { type: 'DECOR_BOUGHT'; decorId: DecorId; gold: number }
  | { type: 'DECOR_ARRANGED'; decorId: DecorId; op: 'place' | 'store' | 'move' }
  | {
      type: 'SETTING_CHANGED';
      key: 'musicOn' | 'sfxOn' | 'reduceMotion' | 'tutorialDone';
      value: boolean;
    };

export type GameEventType = GameEvent['type'];

/** Every event type at runtime, for totality tests (feedback table, toasts). */
export const GAME_EVENT_TYPES = [
  'PIG_HUNGRY_ZERO',
  'PIG_BECAME_SICK',
  'PIG_BECAME_CRITICAL',
  'PIG_DIED',
  'PIG_NEED_DROPPED',
  'PIG_BECAME_ADULT',
  'PIG_ATE_FROM_TROUGH',
  'BIRTH',
  'TROUGH_EMPTY',
  'ORDER_NEW',
  'ORDER_EXPIRED',
  'LEVEL_UP',
  'DISCOVERY',
  'PIG_BOUGHT',
  'PIG_ADOPTED',
  'PIG_FED',
  'PIG_PETTED',
  'PIG_PURPOSE_SET',
  'PIG_CLEANED',
  'PIG_TREATED',
  'TROUGH_UPGRADED',
  'TROUGH_FILLED',
  'ITEM_BOUGHT',
  'PIG_RENAMED',
  'MANURE_CLEANED',
  'ITEM_SOLD',
  'PIG_SOLD',
  'BREEDING_STARTED',
  'SLOT_BOUGHT',
  'ORDER_FULFILLED',
  'GIFT_SPAWNED',
  'GIFT_OPENED',
  'RELIEF_CLAIMED',
  'DECOR_BOUGHT',
  'DECOR_ARRANGED',
  'SETTING_CHANGED',
] as const satisfies readonly GameEventType[];

// Compile-time check that the list above is complete.
type Missing = Exclude<GameEventType, (typeof GAME_EVENT_TYPES)[number]>;
export const GAME_EVENT_TYPES_COMPLETE: Missing extends never ? true : Missing = true;
