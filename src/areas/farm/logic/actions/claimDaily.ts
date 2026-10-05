// claimDaily (DECISIONS PG-2): once per local day. `day` is the local day number computed outside
// core (ui/localDay.ts); consecutive days grow the streak, a gap restarts it at 1.
import { DAILY, dailyReward } from '../../../../core/config/daily';
import { changeGold } from '../gold';
import { addXP } from '../xp';
import type { ActionContext, ActionResult, FarmGame } from '../types';
import { ok, runAction } from './runAction';

/** The streak a claim on `day` would reach. */
export function nextStreak(daily: FarmGame['progress']['daily'], day: number): number {
  return daily.lastDay === day - 1 ? daily.streak + 1 : 1;
}

export function claimDaily(
  state: FarmGame,
  args: { day: number },
  ctx: ActionContext,
): ActionResult {
  return runAction(state, ctx, (s) => {
    if (!Number.isInteger(args.day)) return { ok: false, error: 'INVALID_REQUEST' };
    const { daily } = s.progress;
    // A clock set back only sees "already claimed" (no anti-cheat, UPDATE_AUDIT §5).
    if (daily.lastDay !== null && args.day <= daily.lastDay) {
      return { ok: false, error: 'DAILY_ALREADY_CLAIMED' };
    }
    const streak = nextStreak(daily, args.day);
    const reward = dailyReward(streak);
    const stocked: FarmGame = {
      ...s,
      inventory: {
        ...s.inventory,
        FOOD_BASIC: s.inventory.FOOD_BASIC + reward.food,
        MEDICINE_COMMON: s.inventory.MEDICINE_COMMON + reward.medicine,
      },
      progress: { ...s.progress, daily: { lastDay: args.day, streak } },
    };
    const paid = changeGold(stocked, reward.gold, 'DAILY_REWARD', ctx, { note: `day ${streak}` });
    if (!paid.ok) return paid;
    const xp = addXP(paid.state, DAILY.XP);
    return ok(xp.state, [{ type: 'DAILY_CLAIMED', streak, ...reward }], xp.events);
  });
}
