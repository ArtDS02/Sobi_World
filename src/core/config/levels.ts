// Level and slot tables (spec §6.4, §8.16). Level is derived from xp (D13).
import { levelFromXp as coreLevelFromXp, type LevelTable } from '../progression/levels';
import { BALANCE } from './balance';

/** The farm's level table (Sobi Farm's: LEVEL_XP, MAX_LEVEL in content/farm/balance.json). */
export const FARM_LEVELS: LevelTable = { xp: BALANCE.LEVEL_XP, maxLevel: BALANCE.MAX_LEVEL };

/** Farm level: highest level whose xp threshold <= xp, capped at MAX_LEVEL (core/progression). */
export const levelFromXp = (xp: number): number => coreLevelFromXp(xp, FARM_LEVELS);

/** Trough capacity for a level: min(MAX, START + (level-1) * PER_LEVEL) (§8.6). */
export const troughCapacityForLevel = (level: number): number =>
  Math.min(
    BALANCE.TROUGH_CAPACITY_MAX,
    BALANCE.START_TROUGH_CAPACITY + (level - 1) * BALANCE.TROUGH_CAPACITY_PER_LEVEL,
  );

/** Cost and level gate for unlocking slot number `slot` (5..MAX_SLOTS), or undefined. */
export const slotUnlock = (slot: number): { cost: number; level: number } | undefined =>
  BALANCE.SLOT_UNLOCKS[String(slot)];
