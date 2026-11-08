// The weekly goals (D2): a few goals a week that reach across the Areas, new at local Monday, not obligatory. Each is "this many
// more of a counter this week"; finishing all of them pays a bonus of coins, gems and festival tokens. Same shape as the
// daily goals (daily.ts), drawn from the week's own seed so every save sees the same week. Pure.
import type { goalsFileSchema } from '../../../content/schemas/shared/goals';
import type { z } from 'zod';
import { changeCurrency } from '../economy/ledger';
import { hashSeed, mulberry32 } from '../rng';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import type { DailyWorld } from './daily';
import type { GoalsState, WeeklyGoal } from './state';

export type WeeklyRules = z.infer<typeof goalsFileSchema>['weekly'];

/** Monday-based week index of a local game day (day 0 = Thursday 1 Jan 1970, so Monday 5 Jan 1970 starts week 1). */
export const weekOfDay = (day: number): number => Math.floor((day + 3) / 7);

/**
 * The goals of `week`: templates of the open Areas, one per Area first (so the week really reaches across the world),
 * then any left until `rules.count`; the draw comes from the week's seed.
 */
export function makeWeeklyGoals(week: number, world: DailyWorld, stats: Readonly<Record<string, number>>, rules: WeeklyRules): WeeklyGoal[] {
  const rng = mulberry32(hashSeed('weekly', week));
  const pool = rules.templates.filter((t) => world.unlockedAreas.includes(t.area) && world.worldLevel >= t.fromWorldLevel);
  const left = [...pool];
  const picked: typeof pool = [];
  const take = (from: typeof pool) => {
    const t = from[Math.floor(rng.next() * from.length)]!;
    left.splice(left.indexOf(t), 1);
    picked.push(t);
  };
  // Round 1: a different Area each time while there are Areas left; round 2: whatever remains.
  while (picked.length < rules.count && left.length > 0) {
    const used = new Set(picked.map((t) => t.area));
    const fresh = left.filter((t) => !used.has(t.area));
    take(fresh.length > 0 ? fresh : left);
  }
  return picked.map((t): WeeklyGoal => {
    const target = t.min + Math.floor(rng.next() * (t.max - t.min + 1));
    const share = t.max === t.min ? 0.5 : (target - t.min) / (t.max - t.min);
    const lerp = (r: readonly [number, number]) => Math.round(r[0] + (r[1] - r[0]) * share);
    return { id: t.id, metric: t.metric, target, start: stats[t.metric] ?? 0, coins: lerp(t.coins), gems: lerp(t.gems), reached: false, claimed: false };
  });
}

export const weeklyProgress = (goal: WeeklyGoal, stats: Readonly<Record<string, number>>): number =>
  Math.min(goal.target, Math.max(0, (stats[goal.metric] ?? 0) - goal.start));

export interface WeeklyAdvance {
  goals: GoalsState;
  reached: string[];
  newWeek: boolean;
}

/** The goals for `week` (new ones on Monday), with `reached` set from the counters. The same state when nothing changes. */
export function advanceWeekly(goals: GoalsState, week: number, world: DailyWorld, stats: Readonly<Record<string, number>>, rules: WeeklyRules): WeeklyAdvance {
  const newWeek = goals.weekly.week !== week;
  const list = newWeek ? makeWeeklyGoals(week, world, stats, rules) : goals.weekly.goals;
  const reached: string[] = [];
  const next = list.map((g) => {
    if (g.reached || weeklyProgress(g, stats) < g.target) return g;
    reached.push(g.id);
    return { ...g, reached: true };
  });
  if (!newWeek && reached.length === 0) return { goals, reached, newWeek };
  return { goals: { ...goals, weekly: { week, goals: next, bonusClaimed: newWeek ? false : goals.weekly.bonusClaimed } }, reached, newWeek };
}

export type WeeklyEvent =
  | { type: 'WEEKLY_GOAL_REACHED'; id: string }
  | { type: 'WEEKLY_GOAL_CLAIMED'; id: string; coins: number; gems: number }
  | { type: 'WEEKLY_BONUS_CLAIMED'; coins: number; gems: number; eventTokens: number; xp: number };

type WeeklyResult = ActionResultOf<WorldSave, WeeklyEvent | WorldLevelUp>;

/** Pays one reached goal: coins and gems, each through the ledger (a Transaction apiece). */
export function claimWeeklyGoal(world: WorldSave, args: { index: number }, ctx: ActionContext): WeeklyResult {
  const { weekly } = world.goals;
  const goal = weekly.goals[args.index];
  if (!goal) return { ok: false, error: 'INVALID_REQUEST' };
  if (goal.claimed) return { ok: false, error: 'ALREADY_CLAIMED' };
  if (!goal.reached) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
  const coins = changeCurrency(world, 'coins', goal.coins, { type: 'WEEKLY_GOAL', refId: goal.id }, ctx);
  if (!coins.ok) return coins;
  const gems = changeCurrency(coins.state, 'gems', goal.gems, { type: 'WEEKLY_GOAL', refId: goal.id }, ctx);
  if (!gems.ok) return gems;
  const goals = weekly.goals.map((g, i) => (i === args.index ? { ...g, claimed: true } : g));
  const state: WorldSave = { ...gems.state, goals: { ...world.goals, weekly: { ...weekly, goals } } };
  return { ok: true, state, events: [{ type: 'WEEKLY_GOAL_CLAIMED', id: goal.id, coins: goal.coins, gems: goal.gems }] };
}

/** The bonus for a week with every goal claimed: coins, gems, festival tokens and world XP. */
export function claimWeeklyBonus(
  world: WorldSave,
  ctx: ActionContext,
  rules: WeeklyRules,
  addXp: (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] },
): WeeklyResult {
  const { weekly } = world.goals;
  if (weekly.bonusClaimed) return { ok: false, error: 'ALREADY_CLAIMED' };
  if (weekly.goals.length === 0 || !weekly.goals.every((g) => g.claimed)) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
  const b = rules.bonus;
  let state = world;
  for (const [currency, amount] of [['coins', b.coins], ['gems', b.gems], ['eventTokens', b.eventTokens]] as const) {
    if (amount === 0) continue;
    const paid = changeCurrency(state, currency, amount, { type: 'WEEKLY_BONUS' }, ctx);
    if (!paid.ok) return paid;
    state = paid.state;
  }
  const marked: WorldSave = { ...state, goals: { ...world.goals, weekly: { ...weekly, bonusClaimed: true } } };
  const xp = addXp(marked, b.xp);
  return { ok: true, state: xp.state, events: [{ type: 'WEEKLY_BONUS_CLAIMED', coins: b.coins, gems: b.gems, eventTokens: b.eventTokens, xp: b.xp }, ...xp.events] };
}
