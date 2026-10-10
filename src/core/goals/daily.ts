// The daily goals (spec V2 §9): three light goals a day, new at local midnight, not obligatory. Each is
// "this many more of a counter today"; finishing all three pays a bonus. Pure.
import type { goalsFileSchema } from '../../../content/schemas/shared/goals';
import type { z } from 'zod';
import { changeCurrency } from '../economy/ledger';
import { hashSeed, mulberry32 } from '../rng';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import type { DailyGoal, GoalsState } from './state';

export type DailyRules = z.infer<typeof goalsFileSchema>['daily'];

export interface DailyWorld {
  worldLevel: number;
  unlockedAreas: readonly string[];
}

/** The goals of `day`: distinct templates of the open Areas, drawn from the day's seed. */
export function makeDailyGoals(day: number, world: DailyWorld, stats: Readonly<Record<string, number>>, rules: DailyRules): DailyGoal[] {
  const rng = mulberry32(hashSeed('daily', day));
  const pool = rules.templates.filter((t) => world.unlockedAreas.includes(t.area) && world.worldLevel >= t.fromWorldLevel);
  const goals: DailyGoal[] = [];
  const left = [...pool];
  while (goals.length < rules.count && left.length > 0) {
    const t = left.splice(Math.floor(rng.next() * left.length), 1)[0]!;
    const target = t.min + Math.floor(rng.next() * (t.max - t.min + 1));
    const share = t.max === t.min ? 0.5 : (target - t.min) / (t.max - t.min);
    goals.push({
      id: t.id,
      metric: t.metric,
      target,
      start: stats[t.metric] ?? 0,
      coins: Math.round(t.coins[0] + (t.coins[1] - t.coins[0]) * share),
      reached: false,
      claimed: false,
    });
  }
  return goals;
}

/** What has been done towards a goal today, capped at its target. */
export const goalProgress = (goal: DailyGoal, stats: Readonly<Record<string, number>>): number =>
  Math.min(goal.target, Math.max(0, (stats[goal.metric] ?? 0) - goal.start));

export interface DailyAdvance {
  goals: GoalsState;
  /** Ids of goals that were reached by this call. */
  reached: string[];
  /** A new day began: its goals were drawn. */
  newDay: boolean;
}

/** The goals for `day` (new ones at midnight), with `reached` set from the counters. The same state when nothing changes. */
export function advanceDaily(goals: GoalsState, day: number, world: DailyWorld, stats: Readonly<Record<string, number>>, rules: DailyRules): DailyAdvance {
  const newDay = goals.daily.day !== day;
  const list = newDay ? makeDailyGoals(day, world, stats, rules) : goals.daily.goals;
  const reached: string[] = [];
  const next = list.map((g) => {
    if (g.reached || goalProgress(g, stats) < g.target) return g;
    reached.push(g.id);
    return { ...g, reached: true };
  });
  if (!newDay && reached.length === 0) return { goals, reached, newDay };
  return { goals: { ...goals, daily: { day, goals: next, bonusClaimed: newDay ? false : goals.daily.bonusClaimed } }, reached, newDay };
}

export type DailyEvent =
  | { type: 'DAILY_GOAL_REACHED'; id: string }
  | { type: 'DAILY_GOAL_CLAIMED'; id: string; coins: number }
  | { type: 'DAILY_BONUS_CLAIMED'; coins: number; xp: number };

type DailyResult = ActionResultOf<WorldSave, DailyEvent | WorldLevelUp>;

/** Pays one reached goal. */
export function claimDailyGoal(world: WorldSave, args: { index: number }, ctx: ActionContext): DailyResult {
  const { daily } = world.goals;
  const goal = daily.goals[args.index];
  if (!goal) return { ok: false, error: 'INVALID_REQUEST' };
  if (goal.claimed) return { ok: false, error: 'ALREADY_CLAIMED' };
  if (!goal.reached) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
  const paid = changeCurrency(world, 'coins', goal.coins, { type: 'DAILY_GOAL', refId: goal.id }, ctx);
  if (!paid.ok) return paid;
  const goals = daily.goals.map((g, i) => (i === args.index ? { ...g, claimed: true } : g));
  const stats = { ...world.progression.stats, dailyGoalsDone: (world.progression.stats.dailyGoalsDone ?? 0) + 1 };
  const state: WorldSave = { ...paid.state, goals: { ...world.goals, daily: { ...daily, goals } }, progression: { ...world.progression, stats } };
  return { ok: true, state, events: [{ type: 'DAILY_GOAL_CLAIMED', id: goal.id, coins: goal.coins }] };
}

/** The bonus for a day with every goal claimed. */
export function claimDailyBonus(
  world: WorldSave,
  ctx: ActionContext,
  rules: DailyRules,
  addXp: (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] },
): DailyResult {
  const { daily } = world.goals;
  if (daily.bonusClaimed) return { ok: false, error: 'ALREADY_CLAIMED' };
  if (daily.goals.length === 0 || !daily.goals.every((g) => g.claimed)) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
  const paid = changeCurrency(world, 'coins', rules.bonus.coins, { type: 'DAILY_BONUS' }, ctx);
  if (!paid.ok) return paid;
  const marked: WorldSave = { ...paid.state, goals: { ...world.goals, daily: { ...daily, bonusClaimed: true } } };
  const xp = addXp(marked, rules.bonus.xp);
  return { ok: true, state: xp.state, events: [{ type: 'DAILY_BONUS_CLAIMED', coins: rules.bonus.coins, xp: rules.bonus.xp }, ...xp.events] };
}
