// The auto-feeding trough has levels (GAME_BALANCE §2.6): each holds more food and costs more to reach.
import { BALANCE } from './config/balance';
import type { FarmGame } from './types';

const LEVELS = BALANCE.TROUGH_LEVELS;

/** The trough's level; a save from before levels existed gets the highest level its capacity reaches. */
export function troughLevel(trough: Pick<FarmGame['trough'], 'capacity' | 'level'>): number {
  if (trough.level !== undefined) return Math.min(trough.level, LEVELS.length);
  const reached = LEVELS.filter((l) => l.capacity <= trough.capacity).length;
  return Math.max(1, reached);
}

/** The next level's capacity and price, or null at the top. */
export function nextTroughLevel(trough: Pick<FarmGame['trough'], 'capacity' | 'level'>): { level: number; capacity: number; cost: number } | null {
  const level = troughLevel(trough) + 1;
  const row = LEVELS[level - 1];
  return row ? { level, ...row } : null;
}
