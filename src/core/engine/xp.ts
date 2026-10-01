// XP and level-up (spec §8.16). Level is derived from xp (D13).
import { levelFromXp, troughCapacityForLevel } from '../config/levels';
import type { GameEvent } from '../events';
import type { SaveGame } from '../types';

/** Never lowers XP. On level-up emits LEVEL_UP with the new level and recomputes trough capacity. */
export function addXP(state: SaveGame, amount: number): { state: SaveGame; events: GameEvent[] } {
  if (amount <= 0) return { state, events: [] };
  const before = levelFromXp(state.player.xp);
  const xp = state.player.xp + amount;
  const after = levelFromXp(xp);
  const next: SaveGame = { ...state, player: { ...state.player, xp } };
  if (after <= before) return { state: next, events: [] };
  return {
    state: { ...next, trough: { ...next.trough, capacity: troughCapacityForLevel(after) } },
    events: [{ type: 'LEVEL_UP', level: after }],
  };
}
