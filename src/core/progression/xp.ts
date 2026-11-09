// World XP (decision 007, 013): XP earned outside an Area's own actions (orders, goals, Codex) goes to the
// `world` entry of progression.areas; the world level is the level of the sum of every entry. Pure.
import type { WorldSave } from '../save/world';
import { changeCurrency } from '../economy/ledger';
import type { ActionContext } from '../types';
import { levelFromXp, levelRewardsBetween, worldXp, type LevelTable } from './levels';

/** The entry of progression.areas for XP that belongs to no Area. */
export const WORLD_XP_ID = 'world';

export type WorldLevelUp = { type: 'WORLD_LEVEL_UP'; level: number };

/**
 * The rewards of every level reached since the last payment, paid as ONE event (decision 056): a normal level-up
 * pays one level; an old save that opens past level 20 pays all the levels it already passed, once.
 */
export type WorldLevelReward = { type: 'WORLD_LEVEL_REWARD'; fromLevel: number; toLevel: number; coins: number; gems: number };

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

/** Transaction type of a level reward (both currencies). */
export const LEVEL_REWARD_TX = 'WORLD_LEVEL_REWARD';

/**
 * Pays the level rewards not yet paid (levelRewardsPaid < level) through the ledger and moves the pointer; the same
 * state, no event, when nothing is due. The pointer only ever rises, so reloading a save never pays again.
 */
export function payLevelRewards(world: WorldSave, table: LevelTable, ctx: ActionContext): { state: WorldSave; events: WorldLevelReward[] } {
  const level = levelFromXp(worldXp(world), table);
  const paid = world.progression.levelRewardsPaid;
  if (level <= paid) return { state: world, events: [] };
  const { coins, gems } = levelRewardsBetween(paid, level, table);
  let state: WorldSave = { ...world, progression: { ...world.progression, levelRewardsPaid: level } };
  const note = `${paid + 1}-${level}`;
  for (const [currency, amount] of [['coins', coins], ['gems', gems]] as const) {
    if (amount <= 0) continue;
    const r = changeCurrency(state, currency, amount, { type: LEVEL_REWARD_TX, note }, ctx);
    if (r.ok) state = r.state;
  }
  const events: WorldLevelReward[] = coins > 0 || gems > 0 ? [{ type: 'WORLD_LEVEL_REWARD', fromLevel: paid + 1, toLevel: level, coins, gems }] : [];
  return { state, events };
}
