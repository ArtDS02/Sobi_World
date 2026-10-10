// The world systems' turn after every action and every tick (ARCHITECTURE §6): the counters take what happened,
// first discoveries are written in the Codex, the day's goals roll over at local midnight, the Order Board makes
// the orders that are due, and whatever just became reachable is announced. Pure; the same state when nothing
// changed (a tick with no news costs a few comparisons).
import { DAY_MS } from '../clock';
import { codexCounts, claimableMilestones, discover, type CodexRules } from '../collection/codex';
import type { WorldEvent } from '../events';
import type { GoalsEvent } from './events';
import { levelFromXp, worldDevelopment, worldXp, type LevelTable, type WorldDevelopmentRules } from '../progression/levels';
import { addWorldXp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext } from '../types';
import { claimable, type AchievementDef, type AchievementWorld, type Totals } from './achievements';
import { advanceDaily, type DailyRules } from './daily';
import { advanceBoard, type ItemValue, type OrderRules } from './orders';
import { trackStats } from './stats';

export interface GoalsRules {
  orders: OrderRules;
  daily: DailyRules;
  codex: CodexRules;
  achievements: readonly AchievementDef[];
  levels: LevelTable;
  development: WorldDevelopmentRules;
}

export interface GoalsDeps {
  rules: GoalsRules;
  value: ItemValue;
  /** How many entries the Areas and the Codex offer for the achievements that ask for 'ALL'. */
  totals: () => Totals;
}

/** What the achievements read from a world. */
export function achievementWorld(world: WorldSave, levels: LevelTable): AchievementWorld {
  return {
    stats: world.progression.stats,
    worldLevel: levelFromXp(worldXp(world), levels),
    codex: codexCounts(world.collection.discovered),
  };
}

/** The world level and World Development as the board and the daily goals see them. */
export function worldView(world: WorldSave, rules: Pick<GoalsRules, 'levels' | 'development'>) {
  const level = levelFromXp(worldXp(world), rules.levels);
  const entries = codexCounts(world.collection.discovered).total;
  return {
    worldLevel: level,
    worldDevelopment: worldDevelopment({ worldLevel: level, codexEntries: entries, buildingsLv3: 0 }, rules.development),
    unlockedAreas: world.world.unlockedAreas,
  };
}

export function settleWorld(
  before: WorldSave,
  after: WorldSave,
  worldEvents: readonly WorldEvent[],
  ctx: ActionContext,
  deps: GoalsDeps,
): { state: WorldSave; events: GoalsEvent[] } {
  const { rules } = deps;
  const events: GoalsEvent[] = [];
  let world = after;
  const addXp = (w: WorldSave, xp: number) => addWorldXp(w, xp, rules.levels);

  // 1. Counters and first discoveries from what happened.
  if (worldEvents.length > 0) {
    const stats = trackStats(world.progression.stats, worldEvents);
    if (stats) world = { ...world, progression: { ...world.progression, stats } };
    // A crop is met by its first harvest, a fish by its first catch; an item the first time the bag holds it (bought, harvested, made, given).
    const seen = [
      ...worldEvents.flatMap((e) => (e.type === 'crop.harvested' ? [['crop', e.cropId] as const] : [])),
      ...worldEvents.flatMap((e) => (e.type === 'fish.caught' ? [['fish', e.speciesId] as const] : [])),
      ...worldEvents.flatMap((e) => (e.type === 'flower.harvested' ? [['flower', e.flowerId] as const] : [])),
      ...Object.entries(world.inventory.items).filter(([, n]) => n > 0).map(([id]) => ['item', id] as const),
    ];
    for (const [kind, id] of seen) {
      const found = discover(world, kind, id, rules.codex, ctx, addXp);
      world = found.state;
      events.push(...found.events);
    }
  }

  // 2. The day's goals (a new day at local midnight) and their progress.
  const view = worldView(world, rules);
  const day = Math.floor((ctx.now + (ctx.dayOffsetMs ?? 0)) / DAY_MS);
  const daily = advanceDaily(world.goals, day, view, world.progression.stats, rules.daily);
  if (daily.goals !== world.goals) {
    world = { ...world, goals: daily.goals };
    for (const id of daily.reached) events.push({ type: 'DAILY_GOAL_REACHED', id });
  }

  // 3. The Order Board: orders that came due.
  const board = advanceBoard(world.goals, ctx.now, view, rules.orders, deps.value);
  if (board.goals !== world.goals) {
    world = { ...world, goals: board.goals };
    for (const o of board.spawned) events.push({ type: 'BOARD_ORDER_NEW', orderId: o.id });
  }

  // 4. What just became reachable: achievements and Codex milestones.
  if (worldEvents.length > 0 || daily.newDay) {
    const totals = deps.totals();
    const was = new Set(claimable(rules.achievements, before.progression.claimed, achievementWorld(before, rules.levels), totals).map((d) => d.id));
    for (const d of claimable(rules.achievements, world.progression.claimed, achievementWorld(world, rules.levels), totals)) {
      if (!was.has(d.id)) events.push({ type: 'ACHIEVEMENT_REACHED', id: d.id });
    }
    const total = codexCounts(world.collection.discovered).total;
    const hadMilestone = new Set(claimableMilestones(rules.codex, codexCounts(before.collection.discovered).total, before.collection.claimed).map((m) => m.id));
    for (const m of claimableMilestones(rules.codex, total, world.collection.claimed)) {
      if (!hadMilestone.has(m.id)) events.push({ type: 'CODEX_MILESTONE_REACHED', id: m.id });
    }
  }
  return { state: world, events };
}
