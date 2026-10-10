// The daily login reward (DECISIONS PG-2): once per local day; consecutive days grow a streak that cycles through
// the rewards of content/shared/daily.json, a gap restarts it. `day` is the local day number the caller computes.
import { INVENTORY } from '../config/inventory';
import { changeCurrency } from '../economy/ledger';
import { addAllToBag } from '../inventory/bag';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';

export interface LoginReward {
  gold: number;
  food: number;
  medicine: number;
}

export interface LoginRules {
  REWARDS: readonly LoginReward[];
  XP: number;
}

/** The streak a claim on `day` would reach. */
export const nextStreak = (daily: WorldSave['progression']['daily'], day: number): number =>
  daily.lastDay === day - 1 ? daily.streak + 1 : 1;

/** Reward for the `streak`-th consecutive day (1-based), cycling through the rewards. */
export const loginReward = (streak: number, rules: LoginRules): LoginReward =>
  rules.REWARDS[(Math.max(1, streak) - 1) % rules.REWARDS.length]!;

export type LoginEvent = { type: 'DAILY_CLAIMED'; streak: number; gold: number; food: number; medicine: number };

export function claimLoginReward(
  world: WorldSave,
  args: { day: number },
  ctx: ActionContext,
  rules: LoginRules,
  addXp: (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] },
): ActionResultOf<WorldSave, LoginEvent | WorldLevelUp> {
  if (!Number.isInteger(args.day)) return { ok: false, error: 'INVALID_REQUEST' };
  const { daily } = world.progression;
  // A clock set back only sees "already claimed" (no anti-cheat, UPDATE_AUDIT §5).
  if (daily.lastDay !== null && args.day <= daily.lastDay) return { ok: false, error: 'DAILY_ALREADY_CLAIMED' };
  const streak = nextStreak(daily, args.day);
  const reward = loginReward(streak, rules);
  const bag = addAllToBag(world.inventory.items, { FOOD_BASIC: reward.food, MEDICINE_COMMON: reward.medicine }, INVENTORY);
  if (!bag.ok) return bag;
  const stocked: WorldSave = {
    ...world,
    inventory: { items: bag.items },
    progression: { ...world.progression, daily: { lastDay: args.day, streak } },
  };
  const paid = changeCurrency(stocked, 'coins', reward.gold, { type: 'DAILY_REWARD', note: `day ${streak}` }, ctx);
  if (!paid.ok) return paid;
  const stats = { ...paid.state.progression.stats, bestStreak: Math.max(paid.state.progression.stats.bestStreak ?? 0, streak) };
  const withStats: WorldSave = { ...paid.state, progression: { ...paid.state.progression, stats } };
  const xp = addXp(withStats, rules.XP);
  return { ok: true, state: xp.state, events: [{ type: 'DAILY_CLAIMED', streak, ...reward }, ...xp.events] };
}
