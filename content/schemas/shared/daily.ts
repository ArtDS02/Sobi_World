// content/shared/daily.json — daily login reward (DECISIONS PG-2): a cycle; missing a day restarts it.
import { z } from 'zod';
import { int, nonNeg } from '../fields';

export const dailyRewardSchema = z.strictObject({ gold: nonNeg, food: int.min(0), medicine: int.min(0) });

export const dailyFileSchema = z.strictObject({
  REWARDS: z.array(dailyRewardSchema).min(1),
  XP: nonNeg,
});
