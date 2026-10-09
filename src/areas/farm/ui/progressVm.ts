// Achievements panel view-model (DECISIONS PG-2): the daily reward strip and every achievement with
// its progress. Pure (no DOM); availability comes from dry-running the real actions.
import { claimAchievement } from '../logic/actions/claimAchievement';
import { claimDaily, nextStreak } from '../logic/actions/claimDaily';
import { ACHIEVEMENTS } from '../logic/config/achievements';
import { DAILY, dailyReward } from '../logic/config/daily';
import { claimable, metric, targetOf } from '../logic/progress';
import type { FarmGame } from '../logic/types';
import { formatInt, rewardText, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { BoundAction } from '../store';
import { probe } from './actionsVm';
import { localDay } from '../../../ui/localDay';

export interface DailyDayVm {
  label: string;
  reward: string;
  /** done = claimed in the current streak, next = what the button gives, later = still ahead. */
  state: 'done' | 'next' | 'later';
}

export interface DailyVm {
  days: DailyDayVm[];
  streak: string;
  /** Null once today's reward is taken. */
  claim: BoundAction | null;
}

export interface AchievementVm {
  id: string;
  name: string;
  progress: string;
  /** 0..100 for the bar. */
  percent: number;
  reward: string;
  status: 'claimable' | 'claimed' | 'locked';
  claim: BoundAction;
}

export function dailyVm(save: FarmGame, now: number): DailyVm {
  const day = localDay(now);
  const claim: BoundAction = (s, c) => claimDaily(s, { day }, c);
  const open = probe(save, claim, now) === null;
  // Position in the 7-day cycle: the claim would reach `streak`; already claimed shows the last one.
  const streak = open ? nextStreak(save.progress.daily, day) : save.progress.daily.streak;
  const cycle = DAILY.REWARDS.length;
  const start = Math.floor((Math.max(1, streak) - 1) / cycle) * cycle; // first day of this cycle
  const days = DAILY.REWARDS.map((_, i): DailyDayVm => {
    const n = start + i + 1;
    const state = n < streak || (!open && n === streak) ? 'done' : n === streak ? 'next' : 'later';
    return { label: t(vi.daily.day, { n }), reward: rewardText(dailyReward(n)), state };
  });
  const current = open ? save.progress.daily.lastDay === day - 1 ? save.progress.daily.streak : 0 : streak;
  return {
    days,
    streak: t(vi.daily.streak, { n: current }),
    claim: open ? claim : null,
  };
}

const NAMES = vi.achievements as Record<string, string>;

export function achievementsVm(save: FarmGame): { summary: string; items: AchievementVm[] } {
  const items = ACHIEVEMENTS.map((d): AchievementVm => {
    const target = targetOf(d);
    const current = Math.min(metric(save, d.metric), target);
    const claimed = save.progress.claimed[d.id] !== undefined;
    return {
      id: d.id,
      name: NAMES[d.id] ?? d.id,
      progress: t(vi.achievements.progress, { current: formatInt(current), target: formatInt(target) }),
      percent: Math.round((current / target) * 100),
      reward:
        d.xp > 0
          ? t(vi.achievements.rewardXp, { gold: formatInt(d.gold), xp: d.xp })
          : t(vi.achievements.reward, { gold: formatInt(d.gold) }),
      status: claimed ? 'claimed' : current >= target ? 'claimable' : 'locked',
      claim: (s, c) => claimAchievement(s, { id: d.id }, c),
    };
  });
  // Claimable first, then in progress, claimed last; config order inside each.
  const rank = { claimable: 0, locked: 1, claimed: 2 } as const;
  items.sort((a, b) => rank[a.status] - rank[b.status]);
  const done = items.filter((i) => i.status !== 'locked').length;
  return { summary: t(vi.achievements.summary, { done, total: items.length }), items };
}

/** Dock dot: rewards waiting (today's gift + reached achievements). */
export function progressDot(save: FarmGame, now: number): number {
  const daily = probe(save, (s, c) => claimDaily(s, { day: localDay(now) }, c), now) === null;
  return claimable(save).length + (daily ? 1 : 0);
}
