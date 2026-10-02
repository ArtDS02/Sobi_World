// Game events returned by advanceWorld (spec §7.4) and by actions.
import type { BreedId, DecorId, ItemId } from './config/ids';

export type GameEvent =
  // `at` (epoch ms) and `stalled` (not yet adult) feed the away summary (§9.5).
  | { type: 'PIG_HUNGRY_ZERO'; pigId: string; at: number; stalled: boolean }
  | { type: 'PIG_BECAME_SICK'; pigId: string }
  | { type: 'PIG_BECAME_ADULT'; pigId: string }
  | { type: 'BIRTH'; motherId: string; childId: string; childBreed: BreedId }
  | { type: 'TROUGH_EMPTY'; at: number } // when the last unit was eaten
  | { type: 'ORDER_NEW'; orderId: string }
  | { type: 'ORDER_EXPIRED'; orderId: string }
  | { type: 'LEVEL_UP'; level: number }
  | { type: 'DISCOVERY'; kind: 'BREED'; id: string; gold: number }
  // Action feedback (spec §8.0, D25). Gold is signed as in the transaction.
  | { type: 'PIG_BOUGHT'; pigId: string; breed: BreedId }
  | { type: 'PIG_ADOPTED'; pigId: string; breed: BreedId } // a newborn raised from the nursery (BR-1)
  | { type: 'PIG_FED'; pigId: string }
  | { type: 'PIG_CLEANED'; pigIds: string[] }
  | { type: 'PIG_TREATED'; pigId: string }
  | { type: 'TROUGH_FILLED'; units: number; fromInventory: number; gold: number }
  | { type: 'ITEM_BOUGHT'; itemId: ItemId; quantity: number; gold: number }
  | { type: 'PIG_RENAMED'; pigId: string }
  | { type: 'PIG_SOLD'; pigId: string; gold: number }
  | { type: 'BREEDING_STARTED'; motherId: string; fatherId: string; endsAt: number }
  | { type: 'SLOT_BOUGHT'; slots: number; gold: number } // gold signed as in the transaction (§8.0)
  | { type: 'ORDER_FULFILLED'; orderId: string; gold: number }
  | { type: 'GIFT_SPAWNED'; giftId: string }
  | { type: 'GIFT_OPENED'; giftId: string; gold: number; xp: number }
  // PG-1..3: neighbour's help, daily reward, achievements, decorations.
  | { type: 'RELIEF_CLAIMED'; gold: number; food: number; medicine: number }
  | { type: 'DAILY_CLAIMED'; streak: number; gold: number; food: number; medicine: number }
  | { type: 'ACHIEVEMENT_REACHED'; id: string } // reward waits in the achievements panel
  | { type: 'ACHIEVEMENT_CLAIMED'; id: string; gold: number; xp: number }
  | { type: 'DECOR_BOUGHT'; decorId: DecorId; gold: number }
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
  'PIG_BECAME_ADULT',
  'BIRTH',
  'TROUGH_EMPTY',
  'ORDER_NEW',
  'ORDER_EXPIRED',
  'LEVEL_UP',
  'DISCOVERY',
  'PIG_BOUGHT',
  'PIG_ADOPTED',
  'PIG_FED',
  'PIG_CLEANED',
  'PIG_TREATED',
  'TROUGH_FILLED',
  'ITEM_BOUGHT',
  'PIG_RENAMED',
  'PIG_SOLD',
  'BREEDING_STARTED',
  'SLOT_BOUGHT',
  'ORDER_FULFILLED',
  'GIFT_SPAWNED',
  'GIFT_OPENED',
  'RELIEF_CLAIMED',
  'DAILY_CLAIMED',
  'ACHIEVEMENT_REACHED',
  'ACHIEVEMENT_CLAIMED',
  'DECOR_BOUGHT',
  'SETTING_CHANGED',
] as const satisfies readonly GameEventType[];

// Compile-time check that the list above is complete.
type Missing = Exclude<GameEventType, (typeof GAME_EVENT_TYPES)[number]>;
export const GAME_EVENT_TYPES_COMPLETE: Missing extends never ? true : Missing = true;
