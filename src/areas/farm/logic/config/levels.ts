// Level and slot tables (spec §6.4, §8.16). Level is derived from xp (D13).
import { levelFromXp as coreLevelFromXp, type LevelTable } from '../../../../core/progression/levels';
import { BALANCE } from './balance';

/** The farm's level table (Sobi Farm's: LEVEL_XP, MAX_LEVEL in content/farm/balance.json). */
export const FARM_LEVELS: LevelTable = { xp: BALANCE.LEVEL_XP, maxLevel: BALANCE.MAX_LEVEL };

/** Farm level: highest level whose xp threshold <= xp, capped at MAX_LEVEL (core/progression). */
export const levelFromXp = (xp: number): number => coreLevelFromXp(xp, FARM_LEVELS);

/**
 * Sobi Farm's old trough rule (v1-v7): 20 food + 10 per player level, at most 120. Kept for the save
 * migrations only; since GĐ2 the trough has its own levels (TROUGH_LEVELS).
 */
export const troughCapacityForLevel = (level: number): number => Math.min(120, 20 + (level - 1) * 10);

/** Cost and level gate for unlocking slot number `slot` (5..MAX_SLOTS), or undefined. */
export const slotUnlock = (slot: number): { cost: number; level: number } | undefined =>
  BALANCE.SLOT_UNLOCKS[String(slot)];
