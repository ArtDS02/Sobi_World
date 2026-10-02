// Level and slot tables (spec §6.4, §8.16). Level is derived from xp (D13).
import { BALANCE } from './balance';

/** Highest level whose xp threshold <= xp, capped at MAX_LEVEL. */
export function levelFromXp(xp: number): number {
  let level = 1;
  BALANCE.LEVEL_XP.forEach((threshold, i) => {
    if (xp >= threshold) level = i + 1;
  });
  return Math.min(level, BALANCE.MAX_LEVEL);
}

/** Trough capacity for a level: min(MAX, START + (level-1) * PER_LEVEL) (§8.6). */
export const troughCapacityForLevel = (level: number): number =>
  Math.min(
    BALANCE.TROUGH_CAPACITY_MAX,
    BALANCE.START_TROUGH_CAPACITY + (level - 1) * BALANCE.TROUGH_CAPACITY_PER_LEVEL,
  );

type SlotNumber = keyof typeof BALANCE.SLOT_UNLOCKS;

/** Cost and level gate for unlocking slot number `slot` (5..MAX_SLOTS), or undefined. */
export const slotUnlock = (slot: number): { cost: number; level: number } | undefined =>
  BALANCE.SLOT_UNLOCKS[slot as SlotNumber];
