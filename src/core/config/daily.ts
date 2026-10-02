// Daily login reward (DECISIONS PG-2): a 7-day cycle; missing a day restarts at day 1. TUNABLE.
export interface DailyReward {
  gold: number;
  food: number;
  medicine: number;
}

const r = (gold: number, food = 0, medicine = 0): DailyReward => ({ gold, food, medicine });

export const DAILY = {
  REWARDS: [r(100), r(150, 5), r(200), r(250, 10), r(300), r(400, 0, 1), r(800, 15, 1)],
  XP: 5,
} as const;

/** Reward for the `streak`-th consecutive day (1-based), cycling every 7 days. */
export const dailyReward = (streak: number): DailyReward =>
  DAILY.REWARDS[(Math.max(1, streak) - 1) % DAILY.REWARDS.length]!;
