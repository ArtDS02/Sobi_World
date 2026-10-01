// Game events returned by advanceWorld (spec §7.4) and by actions.
import type { BreedId, ItemId } from './config/ids';

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
  | { type: 'DISCOVERY'; kind: 'BREED' | 'SKIN'; id: string; gold: number }
  // Action feedback (spec §8.0, D25). Gold is signed as in the transaction.
  | { type: 'PIG_BOUGHT'; pigId: string; breed: BreedId }
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
  | { type: 'SKIN_BOUGHT'; skinId: string; gold: number }
  | { type: 'SKIN_EQUIPPED'; pigId: string; skinId: string };

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
  'SKIN_BOUGHT',
  'SKIN_EQUIPPED',
] as const satisfies readonly GameEventType[];

// Compile-time check that the list above is complete.
type Missing = Exclude<GameEventType, (typeof GAME_EVENT_TYPES)[number]>;
export const GAME_EVENT_TYPES_COMPLETE: Missing extends never ? true : Missing = true;
