// World XP (decision 007, 013): XP earned outside an Area's own actions (orders, goals, Codex) goes to the
// `world` entry of progression.areas; the world level is the level of the sum of every entry. Pure.
import type { WorldSave } from '../save/world';
import { levelFromXp, worldXp, type LevelTable } from './levels';

/** The entry of progression.areas for XP that belongs to no Area. */
export const WORLD_XP_ID = 'world';

export type WorldLevelUp = { type: 'WORLD_LEVEL_UP'; level: number };

/** `world` with `amount` more XP; reports the new level when it rises. Never lowers XP. */
export function addWorldXp(world: WorldSave, amount: number, table: LevelTable): { state: WorldSave; events: WorldLevelUp[] } {
  if (amount <= 0) return { state: world, events: [] };
  const before = levelFromXp(worldXp(world), table);
  const xp = (world.progression.areas[WORLD_XP_ID]?.xp ?? 0) + amount;
  const state: WorldSave = {
    ...world,
    progression: { ...world.progression, areas: { ...world.progression.areas, [WORLD_XP_ID]: { xp } } },
  };
  const after = levelFromXp(worldXp(state), table);
  return { state, events: after > before ? [{ type: 'WORLD_LEVEL_UP', level: after }] : [] };
}
