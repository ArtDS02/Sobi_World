// D2: the weekly cross-Area goals — the draw, progress, claims through the ledger, the save migration and the screen.
import { describe, expect, it } from 'vitest';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { WEEKLY_GOALS } from '../../src/core/config/goals';
import { DAY_MS } from '../../src/core/clock';
import { claimWeeklyBonus, claimWeeklyGoal, makeWeeklyGoals, advanceWeekly, weekOfDay, weeklyProgress } from '../../src/core/goals/weekly';
import { initialGoals } from '../../src/core/goals/state';
import { mulberry32 } from '../../src/core/rng';
import { migrate } from '../../src/core/save/migrate';
import { WORLD_SAVE_VERSION, type WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { weeklyGoalsVm } from '../../src/ui/goals/weeklyVm';

const T0 = 20_000 * DAY_MS;
const ctx = (now = T0): ActionContext => ({ now, rng: mulberry32(9), dayOffsetMs: 0 });
const ALL_AREAS = ['sobi_farm', 'sobi_garden', 'sobi_aquarium', 'sobi_cloud', 'sobi_adventure'];
const open = { worldLevel: 20, unlockedAreas: ALL_AREAS };
const base = (): WorldSave => SAVE_CODEC.newWorld(ctx());
const addAddXp = (w: WorldSave, xp: number) => ({
  state: { ...w, progression: { ...w.progression, areas: { ...w.progression.areas, sobi_farm: { xp: (w.progression.areas.sobi_farm?.xp ?? 0) + xp } } } },
  events: [],
});

describe('week index', () => {
  it('Monday starts a week (Monday 5 Jan 1970 = day 4 starts week 1)', () => {
    expect(weekOfDay(3)).toBe(0); // Sunday 4 Jan
    expect(weekOfDay(4)).toBe(1); // Monday 5 Jan
    expect(weekOfDay(10)).toBe(1); // Sunday 11 Jan
    expect(weekOfDay(11)).toBe(2);
    expect(weekOfDay(20_000)).toBe(weekOfDay(20_000 - ((20_000 + 3) % 7))); // same week as its Monday
  });
});

describe('makeWeeklyGoals', () => {
  it('is a function of the week: the same week gives the same goals, another week another draw', () => {
    const a = makeWeeklyGoals(2900, open, {}, WEEKLY_GOALS);
    expect(makeWeeklyGoals(2900, open, {}, WEEKLY_GOALS)).toEqual(a);
    expect(JSON.stringify(makeWeeklyGoals(2901, open, {}, WEEKLY_GOALS))).not.toBe(JSON.stringify(a));
  });
  it('reaches across the Areas: with five Areas open every goal is a different Area', () => {
    for (let week = 2800; week < 2900; week += 1) {
      const goals = makeWeeklyGoals(week, open, {}, WEEKLY_GOALS);
      const areas = goals.map((g) => WEEKLY_GOALS.templates.find((t) => t.id === g.id)!.area);
      expect(goals).toHaveLength(WEEKLY_GOALS.count);
      expect(new Set(areas).size).toBe(goals.length);
    }
  });
  it('offers only open Areas and the world level they need; targets and rewards stay in range', () => {
    const farmOnly = makeWeeklyGoals(5, { worldLevel: 1, unlockedAreas: ['sobi_farm'] }, {}, WEEKLY_GOALS);
    expect(farmOnly.length).toBeGreaterThan(0);
    for (const g of farmOnly) expect(WEEKLY_GOALS.templates.find((t) => t.id === g.id)!.area).toBe('sobi_farm');
    for (const g of makeWeeklyGoals(77, open, { feeds: 100 }, WEEKLY_GOALS)) {
      const t = WEEKLY_GOALS.templates.find((x) => x.id === g.id)!;
      expect(g.target).toBeGreaterThanOrEqual(t.min);
      expect(g.target).toBeLessThanOrEqual(t.max);
      expect(g.coins).toBeGreaterThanOrEqual(t.coins[0]);
      expect(g.coins).toBeLessThanOrEqual(t.coins[1]);
      expect(g.gems).toBeGreaterThanOrEqual(t.gems[0]);
      expect(g.gems).toBeLessThanOrEqual(t.gems[1]);
    }
    expect(makeWeeklyGoals(1, { worldLevel: 1, unlockedAreas: [] }, {}, WEEKLY_GOALS)).toEqual([]);
  });
  it('counts what is done since the goal was set', () => {
    const g = makeWeeklyGoals(9, open, {}, WEEKLY_GOALS)[0]!;
    const set = { ...g, start: 10, target: 5 };
    expect(weeklyProgress(set, { [g.metric]: 12 })).toBe(2);
    expect(weeklyProgress(set, { [g.metric]: 99 })).toBe(5); // capped
    expect(weeklyProgress(set, {})).toBe(0);
  });
});

describe('advanceWeekly and the claims', () => {
  const week = weekOfDay(Math.floor(T0 / DAY_MS));
  const started = (): WorldSave => {
    const w = base();
    return { ...w, goals: advanceWeekly(w.goals, week, open, {}, WEEKLY_GOALS).goals };
  };

  it('a new week draws goals, the same week changes nothing, a goal is reached once its counter moves', () => {
    const w = base();
    const first = advanceWeekly(w.goals, week, open, {}, WEEKLY_GOALS);
    expect(first.newWeek).toBe(true);
    expect(first.goals.weekly.goals.length).toBeGreaterThan(0);
    expect(advanceWeekly(first.goals, week, open, {}, WEEKLY_GOALS).goals).toBe(first.goals);
    const g = first.goals.weekly.goals[0]!;
    const done = advanceWeekly(first.goals, week, open, { [g.metric]: g.start + g.target }, WEEKLY_GOALS);
    expect(done.reached).toEqual([g.id]);
    const next = advanceWeekly(done.goals, week + 1, open, {}, WEEKLY_GOALS);
    expect(next.newWeek).toBe(true);
    expect(next.goals.weekly.bonusClaimed).toBe(false);
  });

  it('claiming pays coins AND gems through the ledger (one Transaction each) and cannot be repeated', () => {
    const w = started();
    const g = w.goals.weekly.goals[0]!;
    const reached: WorldSave = { ...w, goals: { ...w.goals, weekly: { ...w.goals.weekly, goals: w.goals.weekly.goals.map((x, i) => (i === 0 ? { ...x, reached: true } : x)) } } };
    expect(claimWeeklyGoal(w, { index: 0 }, ctx())).toEqual({ ok: false, error: 'ACHIEVEMENT_LOCKED' });
    const r = claimWeeklyGoal(reached, { index: 0 }, ctx());
    if (!r.ok) throw new Error(r.error);
    expect(r.state.wallet.coins).toBe(reached.wallet.coins + g.coins);
    expect(r.state.wallet.gems).toBe(reached.wallet.gems + g.gems);
    expect(r.state.transactions.filter((t) => t.type === 'WEEKLY_GOAL').map((t) => t.currency).sort()).toEqual(['coins', 'gems']);
    expect(claimWeeklyGoal(r.state, { index: 0 }, ctx())).toEqual({ ok: false, error: 'ALREADY_CLAIMED' });
    expect(claimWeeklyGoal(reached, { index: 99 }, ctx())).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });

  it('the bonus needs every goal claimed, pays coins, gems and festival tokens once', () => {
    const w = started();
    const claimedAll: WorldSave = { ...w, goals: { ...w.goals, weekly: { ...w.goals.weekly, goals: w.goals.weekly.goals.map((x) => ({ ...x, reached: true, claimed: true })) } } };
    expect(claimWeeklyBonus(w, ctx(), WEEKLY_GOALS, addAddXp)).toEqual({ ok: false, error: 'ACHIEVEMENT_LOCKED' });
    const r = claimWeeklyBonus(claimedAll, ctx(), WEEKLY_GOALS, addAddXp);
    if (!r.ok) throw new Error(r.error);
    const b = WEEKLY_GOALS.bonus;
    expect(r.state.wallet).toEqual({ coins: claimedAll.wallet.coins + b.coins, gems: claimedAll.wallet.gems + b.gems, eventTokens: claimedAll.wallet.eventTokens + b.eventTokens });
    expect(r.state.transactions.filter((t) => t.type === 'WEEKLY_BONUS')).toHaveLength(3);
    expect(claimWeeklyBonus(r.state, ctx(), WEEKLY_GOALS, addAddXp)).toEqual({ ok: false, error: 'ALREADY_CLAIMED' });
  });

  it('settle draws the week on the first tick and announces a goal that was reached', () => {
    const w = base();
    const s1 = GOALS.settle(w, w, [], ctx());
    const weeklyGoals = s1.state.goals.weekly.goals;
    expect(weeklyGoals.length).toBeGreaterThan(0);
    expect(s1.state.goals.weekly.week).toBe(week);
    const g = weeklyGoals[0]!;
    const bumped: WorldSave = { ...s1.state, progression: { ...s1.state.progression, stats: { ...s1.state.progression.stats, [g.metric]: g.start + g.target } } };
    const s2 = GOALS.settle(s1.state, bumped, [], ctx());
    expect(s2.events.some((e) => e.type === 'WEEKLY_GOAL_REACHED' && e.id === g.id)).toBe(true);
  });

  it('the screen view-model: working goals say why they cannot be claimed yet', () => {
    const vm = weeklyGoalsVm(started(), GOALS, T0);
    expect(vm.goals.length).toBeGreaterThan(0);
    expect(vm.goals[0]!.status).toBe('working');
    expect(vm.goals[0]!.claim.reason).not.toBeNull();
    expect(vm.bonus.claim.reason).not.toBeNull();
    expect(vm.goals[0]!.text).not.toContain('{n}');
  });
});

describe('save v12 migration', () => {
  it('a v11 save gains an empty weekly block and nothing else changes', () => {
    const w = JSON.parse(JSON.stringify(base()));
    delete w.goals.weekly;
    w.schemaVersion = 11;
    w.wallet.coins = 1234;
    const r = migrate(w, SAVE_CODEC);
    if (!r.ok) throw new Error(r.error);
    expect(r.fromVersion).toBe(11);
    expect(r.save.schemaVersion).toBe(WORLD_SAVE_VERSION);
    expect(r.save.goals.weekly).toEqual({ week: null, goals: [], bonusClaimed: false });
    expect(r.save.wallet.coins).toBe(1234);
    expect(r.save.goals.daily).toEqual(w.goals.daily);
    expect(initialGoals(0).weekly).toEqual(r.save.goals.weekly);
  });
});
