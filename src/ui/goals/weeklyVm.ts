// The weekly goals screen's view-model (D2): the same shape as the daily goals, with gems and festival tokens in the rewards.
import type { Goals } from '../../core/goals/api';
import { weeklyProgress } from '../../core/goals/weekly';
import type { WorldSave } from '../../core/save/world';
import { CONTENT } from '../../core/config/content';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { dryRun, type DailyGoalsVm, type DailyGoalVm } from './goalsVm';

export function weeklyGoalsVm(world: WorldSave, goals: Goals, now: number): DailyGoalsVm {
  const { weekly } = world.goals;
  const W = vi.goals.weekly;
  const rules = CONTENT.goals.weekly;
  const list = weekly.goals.map((g, index): DailyGoalVm => {
    const done = weeklyProgress(g, world.progression.stats);
    const progress = t(vi.goals.daily.progress, { current: formatInt(done), target: formatInt(g.target) });
    return {
      text: t((W.templates as Record<string, string>)[g.id] ?? g.id, { n: g.target }),
      progress,
      percent: Math.round((done / g.target) * 100),
      reward: t(W.reward, { coins: formatInt(g.coins), gems: g.gems }),
      status: g.claimed ? 'claimed' : g.reached ? 'ready' : 'working',
      claim: { label: vi.goals.daily.claim, reason: g.claimed ? vi.goals.daily.claimed : g.reached ? null : progress, run: goals.claimWeeklyGoal(index) },
    };
  });
  const run = goals.claimWeeklyBonus();
  const error = dryRun(world, run, now);
  return {
    goals: list,
    bonus: {
      title: t(W.bonusTitle, { count: list.length || rules.count }),
      reward: t(W.bonusReward, { coins: formatInt(rules.bonus.coins), gems: rules.bonus.gems, tokens: rules.bonus.eventTokens, xp: rules.bonus.xp }),
      claimed: weekly.bonusClaimed,
      claim: { label: vi.goals.daily.bonusClaim, reason: weekly.bonusClaimed ? W.bonusClaimed : error ? W.bonusHint : null, run },
    },
  };
}

