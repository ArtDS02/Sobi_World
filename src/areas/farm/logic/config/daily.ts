// Daily login reward (DECISIONS PG-2): a cycle (content/shared/daily.json); missing a day restarts at
// day 1. TUNABLE.
import { CONTENT } from '../../../../core/config/content';

export interface DailyReward {
  gold: number;
  food: number;
  medicine: number;
}

export const DAILY: { REWARDS: readonly DailyReward[]; XP: number } = CONTENT.daily;

/** Reward for the `streak`-th consecutive day (1-based), cycling through the rewards. */
export const dailyReward = (streak: number): DailyReward =>
  DAILY.REWARDS[(Math.max(1, streak) - 1) % DAILY.REWARDS.length]!;
