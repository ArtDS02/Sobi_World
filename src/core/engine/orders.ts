// NPC orders (spec §8.14, D20). Filled in by S11.
import type { GameEvent } from '../events';
import type { SaveGame } from '../types';

/**
 * advanceWorld step 4: drop expired orders (ORDER_EXPIRED), add the current window's missing
 * orders (ORDER_NEW). Hook for S11 — currently returns the state unchanged.
 */
export function refreshOrders(
  state: SaveGame,
  _now: number,
): { state: SaveGame; events: GameEvent[] } {
  return { state, events: [] };
}
