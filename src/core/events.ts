// Game events returned by advanceWorld (spec §7.4) and by actions.
import type { BreedId } from './types';

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
  // Action feedback, backed by vi.event.sold / vi.event.orderFulfilled.
  | { type: 'PIG_SOLD'; pigId: string; gold: number }
  | { type: 'SLOT_BOUGHT'; slots: number; gold: number } // gold signed as in the transaction (§8.0)
  | { type: 'ORDER_FULFILLED'; orderId: string; gold: number };

export type GameEventType = GameEvent['type'];
