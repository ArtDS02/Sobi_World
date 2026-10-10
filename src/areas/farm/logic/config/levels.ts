// Level and slot tables (spec §6.4, §8.16). Level is derived from xp (D13).
import { WORLD_LEVELS } from '../../../../core/config/progression';
import { levelFromXp as coreLevelFromXp } from '../../../../core/progression/levels';
import { BALANCE } from './balance';

/**
 * The Sobi World Level (decision 007, 013). The farm's `player.xp` is the world's XP (see save/lens.ts),
 * so the level the farm gates on is the one level of the whole world.
 */
export const levelFromXp = (xp: number): number => coreLevelFromXp(xp, WORLD_LEVELS);

/**
 * Sobi Farm's old trough rule (v1-v7): 20 food + 10 per player level, at most 120. Kept for the save
 * migrations only; since GĐ2 the trough has its own levels (TROUGH_LEVELS).
 */
export const troughCapacityForLevel = (level: number): number => Math.min(120, 20 + (level - 1) * 10);

/** Cost and level gate for unlocking slot number `slot` (5..MAX_SLOTS), or undefined. */
export const slotUnlock = (slot: number): { cost: number; level: number } | undefined =>
  BALANCE.SLOT_UNLOCKS[String(slot)];
