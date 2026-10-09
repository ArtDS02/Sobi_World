// XP and level-up (spec §8.16). Level is derived from xp (D13).
import { levelFromXp } from './config/levels';
import type { GameEvent } from './events';
import type { FarmGame } from './types';

/** Never lowers XP. On level-up emits LEVEL_UP with the new level. */
export function addXP(state: FarmGame, amount: number): { state: FarmGame; events: GameEvent[] } {
  if (amount <= 0) return { state, events: [] };
  const before = levelFromXp(state.player.xp);
  const xp = state.player.xp + amount;
  const after = levelFromXp(xp);
  const next: FarmGame = { ...state, player: { ...state.player, xp } };
  if (after <= before) return { state: next, events: [] };
  return { state: next, events: [{ type: 'LEVEL_UP', level: after }] };
}
