// The goals as the app uses them: the content's numbers bound to the pure functions, so the store, the screens
// and the tests all go through one object. The Areas tell it what they offer (`totals`, the Codex kinds).
import { ACHIEVEMENTS, CODEX, DAILY_GOALS, ORDER_BOARD } from '../config/goals';
import { CONTENT } from '../config/content';
import { PROGRESSION } from '../config/progression';
import { claimMilestone, claimableMilestones, codexCounts, type CodexKind } from '../collection/codex';
import { itemDef } from '../items/catalog';
import { addWorldXp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import { claimAchievement, claimable, type Totals } from './achievements';
import { claimDailyBonus, claimDailyGoal } from './daily';
import { claimLoginReward } from './loginReward';
import { deliverOrder, rerollOrder, type ItemValue } from './orders';
import { achievementWorld, settleWorld, worldView, type GoalsDeps, type GoalsRules } from './settle';

/** What one unit of an item is worth: its sale price, else its shop price. */
export const itemValue: ItemValue = (id) => {
  const def = itemDef(id);
  return def ? (def.sellGold ?? def.priceGold) : 0;
};

export const GOALS_RULES: GoalsRules = {
  orders: ORDER_BOARD,
  daily: DAILY_GOALS,
  codex: CODEX,
  achievements: ACHIEVEMENTS,
  levels: PROGRESSION.levels,
  development: PROGRESSION.development,
};

/** What the Areas report to the goals. */
export interface GoalsSources {
  /** Entries each Area adds to the Codex (breeds, crops…). */
  codexKinds: () => readonly CodexKind[];
  /** Totals the 'ALL' achievements need besides the Codex's (decorations…). */
  extraTotals: () => Totals;
}

export type WorldAction = (world: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export function createGoals(sources: GoalsSources) {
  const addXp = (w: WorldSave, xp: number) => addWorldXp(w, xp, GOALS_RULES.levels);
  /** Totals of every metric that can be 'ALL': the Codex kinds, the sum, and what the Areas add. */
  const totals = (): Totals => {
    const kinds = sources.codexKinds();
    const byKind = Object.fromEntries(kinds.map((k) => [k.id, k.entries.length]));
    return {
      codex: kinds.reduce((n, k) => n + k.entries.length, 0),
      codexBreed: byKind.breed ?? 0,
      codexCrop: byKind.crop ?? 0,
      codexItem: byKind.item ?? 0,
      codexFish: byKind.fish ?? 0,
      ...sources.extraTotals(),
    };
  };
  const deps: GoalsDeps = { rules: GOALS_RULES, value: itemValue, totals };

  return {
    rules: GOALS_RULES,
    totals,
    codexKinds: sources.codexKinds,
    /** The turn of the world systems after an action or a tick (see settle.ts). */
    settle: (before: WorldSave, after: WorldSave, worldEvents: Parameters<typeof settleWorld>[2], ctx: ActionContext) =>
      settleWorld(before, after, worldEvents, ctx, deps),
    view: (world: WorldSave) => worldView(world, GOALS_RULES),
    achievementView: (world: WorldSave) => achievementWorld(world, GOALS_RULES.levels),
    /** Achievements reached and not claimed, milestones of the Codex reached and not claimed. */
    claimableCount: (world: WorldSave): number =>
      claimable(ACHIEVEMENTS, world.progression.claimed, achievementWorld(world, GOALS_RULES.levels), totals()).length +
      claimableMilestones(CODEX, codexCounts(world.collection.discovered).total, world.collection.claimed).length +
      world.goals.daily.goals.filter((g) => g.reached && !g.claimed).length,

    // Actions (bound to their numbers; the screens dry-run them to know why a button is off).
    deliver: (slot: number): WorldAction => (w, c) => deliverOrder(w, { slot }, c, ORDER_BOARD, addXp),
    reroll: (slot: number): WorldAction => (w, c) => rerollOrder(w, { slot }, c, ORDER_BOARD, worldView(w, GOALS_RULES), itemValue),
    claimGoal: (index: number): WorldAction => (w, c) => claimDailyGoal(w, { index }, c),
    claimBonus: (): WorldAction => (w, c) => claimDailyBonus(w, c, DAILY_GOALS, addXp),
    claimAchievement: (id: string): WorldAction => (w, c) =>
      claimAchievement(w, { id }, c, ACHIEVEMENTS, achievementWorld(w, GOALS_RULES.levels), totals(), addXp),
    claimLogin: (day: number): WorldAction => (w, c) => claimLoginReward(w, { day }, c, CONTENT.daily, addXp),
    claimMilestone: (id: string): WorldAction => (w, c) => claimMilestone(w, { id }, c, CODEX, addXp),
  };
}

export type Goals = ReturnType<typeof createGoals>;
