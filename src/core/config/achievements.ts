// Achievements (spec §20.4, DECISIONS PG-2). Reached when a metric meets its target; the player
// claims the reward in the achievements panel. Ids are never removed (saves keep claims). TUNABLE.
import type { StatId } from './ids';

/** A stat counter, or a value read from the save (engine/progress.ts `metric`). */
export type AchievementMetric = StatId | 'discovered' | 'level' | 'slots' | 'decor';

export interface AchievementDef {
  id: string;
  metric: AchievementMetric;
  /** Target value; 'ALL' = every species that can be discovered, or every decoration. */
  target: number | 'ALL';
  gold: number;
  xp: number;
}

const a = (id: string, metric: AchievementMetric, target: number | 'ALL', gold: number, xp: number) =>
  ({ id, metric, target, gold, xp }) satisfies AchievementDef;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  a('FIRST_PIG', 'pigsBought', 1, 100, 10),
  a('FIRST_SALE', 'pigsSold', 1, 100, 10),
  a('SELLER_10', 'pigsSold', 10, 500, 30),
  a('SELLER_50', 'pigsSold', 50, 2000, 80),
  a('SELLER_200', 'pigsSold', 200, 6000, 150),
  a('FIRST_BREEDING', 'breedings', 1, 150, 10),
  a('FIRST_BIRTH', 'births', 1, 200, 20),
  a('BIRTHS_25', 'births', 25, 1500, 60),
  a('BIRTHS_100', 'births', 100, 5000, 150),
  a('ORDERS_1', 'ordersFulfilled', 1, 150, 10),
  a('ORDERS_20', 'ordersFulfilled', 20, 1200, 50),
  a('ORDERS_100', 'ordersFulfilled', 100, 5000, 150),
  a('GIFTS_10', 'giftsOpened', 10, 500, 30),
  a('GIFTS_50', 'giftsOpened', 50, 2000, 80),
  a('CLEAN_100', 'pigsCleaned', 100, 400, 30),
  a('TREAT_10', 'pigsTreated', 10, 400, 30),
  a('EARN_100K', 'goldEarned', 100_000, 3000, 100),
  a('EARN_1M', 'goldEarned', 1_000_000, 10_000, 200),
  a('COLLECT_10', 'discovered', 10, 800, 40),
  a('COLLECT_25', 'discovered', 25, 2500, 80),
  a('COLLECT_50', 'discovered', 50, 6000, 150),
  a('COLLECT_ALL', 'discovered', 'ALL', 15_000, 300),
  a('LEVEL_5', 'level', 5, 500, 0),
  a('LEVEL_10', 'level', 10, 2000, 0),
  a('SLOTS_12', 'slots', 12, 1500, 50),
  a('SLOTS_24', 'slots', 24, 6000, 150),
  a('DECOR_1', 'decor', 1, 200, 10),
  a('DECOR_ALL', 'decor', 'ALL', 3000, 100),
  a('STREAK_7', 'bestStreak', 7, 1000, 50),
];
