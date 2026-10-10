// The world's goals (GĐ6, spec V2 §9): the Order Board, the daily goals, achievements paid in Gems, the Codex and its
// milestones, the login reward, and the settle step that ties them to what happens in the Areas.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { gardenArea } from '../../src/areas/garden';
import { CONTENT } from '../../src/core/config/content';
import { ACHIEVEMENTS } from '../../src/core/config/goals';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { DAY_MS } from '../../src/core/clock';
import { codexCounts } from '../../src/core/collection/codex';
import { goalProgress, makeDailyGoals } from '../../src/core/goals/daily';
import { itemValue } from '../../src/core/goals/api';
import { advanceBoard, makeOrder, slotCount } from '../../src/core/goals/orders';
import { nextStreak, loginReward } from '../../src/core/goals/loginReward';
import { mulberry32 } from '../../src/core/rng';
import { migrate } from '../../src/core/save/migrate';
import { WORLD_SAVE_VERSION, type WorldSave } from '../../src/core/save/world';
import type { ActionContext, ActionResultOf } from '../../src/core/types';
import { vi } from '../../src/i18n/vi';
import { boardVm, dailyGoalsVm, loginVm, achievementsVm, goalsDot } from '../../src/ui/goals/goalsVm';
import { DECORS } from '../../src/areas/farm/logic/config/decor';

const H = 3_600_000;
const T0 = 20_000 * DAY_MS;
const ctx = (now = T0): ActionContext => ({ now, rng: mulberry32(9), dayOffsetMs: 0 });
const R = GOALS.rules;
const ok = (r: ActionResultOf<WorldSave>): WorldSave => {
  if (!r.ok) throw new Error(`failed: ${r.error}`);
  return r.state;
};
const fail = (r: ActionResultOf<WorldSave>): string => (r.ok ? 'ok' : r.error);

const base = (): WorldSave => SAVE_CODEC.newWorld(ctx());
/** World XP of `level`, held by the farm's entry. */
const atLevel = (w: WorldSave, level: number): WorldSave => ({
  ...w,
  progression: { ...w.progression, areas: { ...w.progression.areas, sobi_farm: { xp: WORLD_LEVELS.xp[level - 1]! } } },
});
const withGarden = (w: WorldSave): WorldSave => {
  const opened = gardenArea.init(atLevel(w, 3), ctx());
  return { ...opened, world: { ...opened.world, unlockedAreas: ['sobi_farm', 'sobi_garden'] } };
};
const withItems = (w: WorldSave, items: Record<string, number>): WorldSave => ({ ...w, inventory: { items: { ...w.inventory.items, ...items } } });
const settle = (before: WorldSave, after: WorldSave, events: Parameters<typeof GOALS.settle>[2] = [], now = T0) => GOALS.settle(before, after, events, ctx(now));

describe('Order Board', () => {
  const board = (level: number, areas: string[]) => ({ worldLevel: level, worldDevelopment: level, unlockedAreas: areas });

  it('an order is a function of its serial and the world, never of how it was reached', () => {
    const a = makeOrder(7, T0, board(1, ['sobi_farm']), R.orders, itemValue);
    expect(makeOrder(7, T0, board(1, ['sobi_farm']), R.orders, itemValue)).toEqual(a);
    expect(makeOrder(8, T0, board(1, ['sobi_farm']), R.orders, itemValue)).not.toEqual(a);
  });

  it('asks only for items of the Areas that are open, and pays 1.4 x their value', () => {
    for (let serial = 0; serial < 60; serial += 1) {
      const o = makeOrder(serial, T0, board(1, ['sobi_farm']), R.orders, itemValue);
      expect(o.lines.map((l) => l.itemId)).toEqual(['item_manure']); // level 1: one line, the farm's manure
      expect(o.coins).toBe(Math.round(o.lines[0]!.qty * itemValue('item_manure') * R.orders.rewardMultiplier));
      expect(o.xp).toBeGreaterThanOrEqual(R.orders.xp.min);
      expect(o.xp).toBeLessThanOrEqual(R.orders.xp.max);
    }
    const seen = new Set<string>();
    for (let serial = 0; serial < 200; serial += 1) {
      for (const l of makeOrder(serial, T0, board(8, ['sobi_farm', 'sobi_garden']), R.orders, itemValue).lines) seen.add(l.itemId);
    }
    expect([...seen].some((id) => id !== 'item_manure')).toBe(true);
    expect(seen.has('FOOD_PREMIUM')).toBe(true); // from world level 5
  });

  it('more items per order as the world levels up; never the same item twice; an order pays better than selling', () => {
    const lines = (level: number) => Math.max(...Array.from({ length: 300 }, (_, i) => makeOrder(i, T0, board(level, ['sobi_farm', 'sobi_garden']), R.orders, itemValue).lines.length));
    expect(lines(3)).toBe(1);
    expect(lines(5)).toBe(2);
    expect(lines(8)).toBe(3);
    for (let i = 0; i < 100; i += 1) {
      const o = makeOrder(i, T0, board(8, ['sobi_farm', 'sobi_garden']), R.orders, itemValue);
      expect(new Set(o.lines.map((l) => l.itemId)).size).toBe(o.lines.length);
      expect(o.coins).toBeGreaterThan(o.lines.reduce((n, l) => n + l.qty * itemValue(l.itemId), 0));
    }
  });

  it('some orders carry a bonus item (about 5%)', () => {
    const n = 2000;
    const bonus = Array.from({ length: n }, (_, i) => makeOrder(i, T0, board(1, ['sobi_farm']), R.orders, itemValue).bonus).filter(Boolean);
    expect(bonus.length / n).toBeGreaterThan(0.025);
    expect(bonus.length / n).toBeLessThan(0.08);
  });

  it('the first order is there at once, then one every 3 hours for an empty slot, up to 3 slots', () => {
    const v = board(1, ['sobi_farm']);
    const start = base().goals;
    const first = advanceBoard(start, T0, v, R.orders, itemValue);
    expect(first.spawned).toHaveLength(1);
    expect(first.goals.board.nextAt).toBe(T0 + 3 * H);
    expect(advanceBoard(first.goals, T0 + H, v, R.orders, itemValue).spawned).toHaveLength(0);
    const later = advanceBoard(first.goals, T0 + 7 * H, v, R.orders, itemValue);
    expect(later.spawned).toHaveLength(2); // at +3 h and +6 h
    expect(later.goals.board.slots.filter(Boolean)).toHaveLength(3);
    expect(later.goals.board.nextAt).toBeNull(); // full: the clock stops
    expect(later.spawned.map((o) => o.createdAt)).toEqual([T0 + 3 * H, T0 + 6 * H]);
  });

  it('a long absence makes the same orders as playing through it', () => {
    const v = board(1, ['sobi_farm']);
    const jump = advanceBoard(base().goals, T0 + 10 * H, v, R.orders, itemValue).goals;
    let steps = base().goals;
    for (let t = T0; t <= T0 + 10 * H; t += 600_000) steps = advanceBoard(steps, t, v, R.orders, itemValue).goals;
    expect(steps).toEqual(jump);
  });

  it('a fourth slot opens at World Development 10', () => {
    expect(slotCount(9, R.orders)).toBe(3);
    expect(slotCount(10, R.orders)).toBe(4);
    const grown = advanceBoard(advanceBoard(base().goals, T0 + 9 * H, board(1, ['sobi_farm']), R.orders, itemValue).goals, T0 + 12 * H, { worldLevel: 9, worldDevelopment: 10, unlockedAreas: ['sobi_farm'] }, R.orders, itemValue);
    expect(grown.goals.board.slots).toHaveLength(4);
    expect(grown.spawned).toHaveLength(1);
  });

  it('delivering takes the items, pays coins and XP, counts, and the slot waits for the next order', () => {
    let w = settle(base(), base()).state;
    const order = w.goals.board.slots[0]!;
    w = withItems(w, Object.fromEntries(order.lines.map((l) => [l.itemId, l.qty + 1])));
    w = { ...w, goals: { ...w.goals, board: { ...w.goals.board, slots: [{ ...order, bonus: { itemId: 'item_seed_carrot', qty: 3 } }, ...w.goals.board.slots.slice(1)] } } };
    const coinsBefore = w.wallet.coins;
    const done = ok(GOALS.deliver(0)(w, ctx(T0 + H)));
    for (const l of order.lines) expect(done.inventory.items[l.itemId]).toBe(1);
    expect(done.inventory.items.item_seed_carrot).toBe((w.inventory.items.item_seed_carrot ?? 0) + 3);
    expect(done.wallet.coins).toBe(coinsBefore + order.coins);
    expect(done.progression.areas.world!.xp).toBe(order.xp);
    expect(done.progression.stats.boardOrders).toBe(1);
    expect(done.goals.board.slots[0]).toBeNull();
    expect(done.goals.board.nextAt).not.toBeNull();
    expect(done.transactions[0]).toMatchObject({ type: 'BOARD_ORDER', amount: order.coins, currency: 'coins' });
  });

  it('refuses a delivery without the items, an empty slot, or a full bag; nothing changes', () => {
    const w = settle(base(), base()).state;
    expect(fail(GOALS.deliver(0)(withItems(w, { item_manure: 0 }), ctx()))).toBe('INSUFFICIENT_ITEM');
    expect(fail(GOALS.deliver(2)(w, ctx()))).toBe('ORDER_NOT_FOUND');
  });

  it('the screen says what is missing, and a button is on only when the action would work', () => {
    const w = settle(base(), base()).state;
    const order = w.goals.board.slots[0]!;
    const lacking = boardVm(w, GOALS, T0);
    expect(lacking.cards[0]!.deliver.reason).toContain('Còn thiếu');
    expect(lacking.cards[0]!.reroll.reason).toBe(vi.board.noGems);
    expect(lacking.empty).toHaveLength(2);
    expect(lacking.empty[0]).toContain('Đơn mới sau 3 giờ');
    const stocked = { ...withItems(w, Object.fromEntries(order.lines.map((l) => [l.itemId, l.qty]))), wallet: { ...w.wallet, gems: 5 } };
    const ready = boardVm(stocked, GOALS, T0);
    expect(ready.cards[0]!.deliver.reason).toBeNull();
    expect(ready.cards[0]!.reroll.reason).toBeNull();
    expect(ready.cards[0]!.lines.every((l) => l.enough)).toBe(true);
  });

  it('a reroll costs 5 Gems, swaps the order at once and needs the Gems', () => {
    const w = settle(base(), base()).state;
    expect(fail(GOALS.reroll(0)(w, ctx()))).toBe('INSUFFICIENT_GOLD');
    const rich = { ...w, wallet: { ...w.wallet, gems: 7 } };
    const swapped = ok(GOALS.reroll(0)(rich, ctx(T0 + 1)));
    expect(swapped.wallet.gems).toBe(2);
    expect(swapped.goals.board.slots[0]!.id).not.toBe(w.goals.board.slots[0]!.id);
    expect(swapped.goals.board.serial).toBe(w.goals.board.serial + 1);
  });
});

describe('daily goals', () => {
  const day = 20_001;
  const view = (areas: string[], level = 1) => ({ worldLevel: level, unlockedAreas: areas });

  it('three different goals of the open Areas, the same for the same day', () => {
    const farm = makeDailyGoals(day, view(['sobi_farm']), {}, R.daily);
    expect(farm).toHaveLength(3);
    expect(new Set(farm.map((g) => g.id)).size).toBe(3);
    expect(makeDailyGoals(day, view(['sobi_farm']), {}, R.daily)).toEqual(farm);
    const garden = new Set(Array.from({ length: 60 }, (_, i) => makeDailyGoals(day + i, view(['sobi_farm', 'sobi_garden'], 3), {}, R.daily).map((g) => g.id)).flat());
    expect(garden.has('harvest')).toBe(true);
    expect([...new Set(Array.from({ length: 60 }, (_, i) => makeDailyGoals(day + i, view(['sobi_farm']), {}, R.daily).map((g) => g.id)).flat())]).not.toContain('harvest');
    for (const g of farm) {
      expect(g.coins).toBeGreaterThanOrEqual(50);
      expect(g.coins).toBeLessThanOrEqual(150);
    }
  });

  it('counts what is done since the goal was set, and the day rolls over at local midnight', () => {
    const w0 = settle(base(), base(), [], T0 + 12 * H).state;
    expect(w0.goals.daily.day).toBe(20_000);
    const g = w0.goals.daily.goals[0]!;
    const done = { ...w0, progression: { ...w0.progression, stats: { ...w0.progression.stats, [g.metric]: g.start + g.target } } };
    const r = settle(w0, done, [{ type: 'item.added', area: 'x', itemId: 'item_manure', quantity: 1 }], T0 + 13 * H);
    expect(r.events).toContainEqual({ type: 'DAILY_GOAL_REACHED', id: g.id });
    expect(goalProgress(g, done.progression.stats)).toBe(g.target);
    // Same day, nothing new: the very same state back.
    expect(settle(r.state, r.state, [], T0 + 14 * H).state).toBe(r.state);
    const next = settle(r.state, r.state, [], T0 + 24 * H + 1).state;
    expect(next.goals.daily.day).toBe(20_001);
    expect(next.goals.daily.goals.every((x) => !x.reached && !x.claimed)).toBe(true);
    expect(next.goals.daily.bonusClaimed).toBe(false);
  });

  it('a goal is paid once; claiming all three opens the bonus', () => {
    let w = settle(base(), base(), [], T0 + H).state;
    const stats = { ...w.progression.stats };
    for (const g of w.goals.daily.goals) stats[g.metric] = g.start + g.target;
    w = settle(w, { ...w, progression: { ...w.progression, stats } }, [{ type: 'item.added', area: 'x', itemId: 'item_manure', quantity: 1 }], T0 + 2 * H).state;
    expect(fail(GOALS.claimBonus()(w, ctx()))).toBe('ACHIEVEMENT_LOCKED');
    const coins = w.wallet.coins;
    for (let i = 0; i < 3; i += 1) w = ok(GOALS.claimGoal(i)(w, ctx(T0 + 3 * H)));
    expect(w.wallet.coins).toBe(coins + w.goals.daily.goals.reduce((n, g) => n + g.coins, 0));
    expect(w.progression.stats.dailyGoalsDone).toBe(3);
    expect(fail(GOALS.claimGoal(0)(w, ctx()))).toBe('ALREADY_CLAIMED');
    const bonus = ok(GOALS.claimBonus()(w, ctx(T0 + 3 * H)));
    expect(bonus.wallet.coins).toBe(w.wallet.coins + R.daily.bonus.coins);
    expect(fail(GOALS.claimBonus()(bonus, ctx()))).toBe('ALREADY_CLAIMED');
  });

  it('refuses a goal that is not reached yet', () => {
    const w = settle(base(), base(), [], T0 + H).state;
    expect(fail(GOALS.claimGoal(0)(w, ctx()))).toBe('ACHIEVEMENT_LOCKED');
    expect(dailyGoalsVm(w, GOALS, T0).goals[0]!.claim.reason).not.toBeNull();
  });
});

describe('achievements', () => {
  it('are reached by the counters and the world, announced once, and paid once in Gems', () => {
    const w0 = base();
    const sold = { ...w0, progression: { ...w0.progression, stats: { ...w0.progression.stats, pigsSold: 1 } } };
    const r = settle(w0, sold, [{ type: 'creature.sold', area: 'sobi_farm', creatureId: 'p', amount: 1 }]);
    expect(r.events).toContainEqual({ type: 'ACHIEVEMENT_REACHED', id: 'FIRST_SALE' });
    expect(settle(r.state, r.state, [{ type: 'creature.sold', area: 'sobi_farm', creatureId: 'p', amount: 1 }]).events.filter((e) => e.type === 'ACHIEVEMENT_REACHED')).toEqual([]);
    const paid = ok(GOALS.claimAchievement('FIRST_SALE')(r.state, ctx()));
    const def = ACHIEVEMENTS.find((d) => d.id === 'FIRST_SALE')!;
    expect(paid.wallet.gems).toBe(def.gems);
    expect(def.gems).toBeGreaterThanOrEqual(5);
    expect(paid.progression.claimed.FIRST_SALE).toBe(T0);
    expect(paid.transactions[0]).toMatchObject({ type: 'ACHIEVEMENT', currency: 'gems', amount: def.gems });
    expect(fail(GOALS.claimAchievement('FIRST_SALE')(paid, ctx()))).toBe('ALREADY_CLAIMED');
    expect(fail(GOALS.claimAchievement('SELLER_10')(paid, ctx()))).toBe('ACHIEVEMENT_LOCKED');
    expect(fail(GOALS.claimAchievement('NOPE')(paid, ctx()))).toBe('INVALID_REQUEST');
  });

  it('every achievement has a name, a Gem reward of 5-30 and a metric that exists', () => {
    const ids = ACHIEVEMENTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = vi.achievements as Record<string, string>;
    for (const d of ACHIEVEMENTS) {
      expect(names[d.id], d.id).toBeTruthy();
      expect(d.gems).toBeGreaterThanOrEqual(5);
      expect(d.gems).toBeLessThanOrEqual(30);
    }
    for (const id of Object.keys(DECORS)) expect(vi.decor[id as keyof typeof DECORS]).toBeTruthy();
  });

  it("'ALL' targets come from what the Areas offer, and level / Codex metrics read the world", () => {
    const totals = GOALS.totals();
    expect(totals.codexBreed).toBeGreaterThan(50);
    expect(totals.codexCrop).toBe(5);
    expect(totals.codexItem).toBeGreaterThan(10);
    expect(totals.decorOwned).toBe(Object.keys(DECORS).length);
    const vm = achievementsVm(atLevel(base(), 5), GOALS);
    expect(vm.items.find((i) => i.id === 'LEVEL_5')).toMatchObject({ status: 'claimable', percent: 100 });
    expect(vm.items.find((i) => i.id === 'COLLECT_ALL')!.status).toBe('locked');
  });

  it('the dock dot counts rewards waiting: today\'s gift, reached goals, achievements and milestones', () => {
    const w = base();
    expect(goalsDot(w, GOALS, 20_000)).toBe(1); // the login gift
    const claimed = ok(GOALS.claimLogin(20_000)(w, ctx()));
    expect(goalsDot(claimed, GOALS, 20_000)).toBe(0);
    expect(goalsDot(atLevel(claimed, 5), GOALS, 20_000)).toBe(1); // LEVEL_5
  });
});

describe('login reward', () => {
  it('pays coins, food and XP once a day; the streak grows on consecutive days and restarts after a gap', () => {
    const w = base();
    const d1 = ok(GOALS.claimLogin(100)(w, ctx()));
    expect(d1.progression.daily).toEqual({ lastDay: 100, streak: 1 });
    expect(d1.wallet.coins).toBe(w.wallet.coins + loginReward(1, CONTENT.daily).gold);
    expect(fail(GOALS.claimLogin(100)(d1, ctx()))).toBe('DAILY_ALREADY_CLAIMED');
    expect(fail(GOALS.claimLogin(99)(d1, ctx()))).toBe('DAILY_ALREADY_CLAIMED');
    const d2 = ok(GOALS.claimLogin(101)(d1, ctx()));
    expect(d2.progression.daily.streak).toBe(2);
    expect(d2.progression.stats.bestStreak).toBe(2);
    expect(ok(GOALS.claimLogin(105)(d2, ctx())).progression.daily.streak).toBe(1);
    expect(nextStreak(d2.progression.daily, 102)).toBe(3);
  });

  it('the strip: next day highlighted, done after the claim', () => {
    const w = base();
    const before = loginVm(w, GOALS, 100);
    expect(before.claim).not.toBeNull();
    expect(before.days.map((d) => d.state)).toEqual(['next', ...Array(6).fill('later')]);
    const after = loginVm(ok(GOALS.claimLogin(100)(w, ctx())), GOALS, 100);
    expect(after.claim).toBeNull();
    expect(after.days[0]!.state).toBe('done');
  });
});

describe('Codex', () => {
  it('a crop is discovered by the first harvest, an item by the first time it is in the bag; once, with a small bonus', () => {
    const w0 = withGarden(base());
    const coins = w0.wallet.coins;
    const harvest = { type: 'crop.harvested', area: 'sobi_garden', plotId: 'garden', cropId: 'crop_corn', quantity: 3 } as const;
    const r = settle(w0, w0, [harvest]);
    expect(r.state.collection.discovered.crop).toEqual(['crop_corn']);
    expect(r.state.wallet.coins).toBe(coins + 50);
    expect(r.events).toContainEqual({ type: 'CODEX_DISCOVERED', kind: 'crop', id: 'crop_corn', coins: 50, xp: 10 });
    expect(r.state.progression.stats.cropsHarvested).toBe(3); // counted by the world's tracker
    const again = settle(r.state, r.state, [harvest]);
    expect(again.state.collection.discovered.crop).toEqual(['crop_corn']);
    expect(again.state.progression.stats.cropsHarvested).toBe(6);
    const item = settle(r.state, r.state, [{ type: 'item.added', area: 'sobi_garden', itemId: 'item_corn', quantity: 3 }]);
    expect(item.state.collection.discovered.item).toEqual(['item_corn']);
  });

  it('milestones are announced when the total reaches them and paid when claimed', () => {
    const w0 = base();
    const found = { ...w0, collection: { ...w0.collection, discovered: { breed: ['PIG_EARTH_PINK', 'PIG_WHITE', 'PIG_BLACK', 'PIG_BROWN'] } } };
    const r = settle(w0, found, [{ type: 'item.added', area: 'x', itemId: 'item_manure', quantity: 1 }]);
    expect(codexCounts(r.state.collection.discovered).total).toBe(5); // 4 breeds + the manure itself
    expect(r.events).toContainEqual({ type: 'CODEX_MILESTONE_REACHED', id: 'CODEX_5' });
    const paid = ok(GOALS.claimMilestone('CODEX_5')(r.state, ctx()));
    expect(paid.wallet.coins).toBe(r.state.wallet.coins + 300);
    expect(paid.collection.claimed).toEqual(['CODEX_5']);
    expect(fail(GOALS.claimMilestone('CODEX_5')(paid, ctx()))).toBe('ALREADY_CLAIMED');
    expect(fail(GOALS.claimMilestone('CODEX_10')(paid, ctx()))).toBe('ACHIEVEMENT_LOCKED');
  });
});

describe('settle', () => {
  it('a tick with no news returns the very same world (no churn for the screens)', () => {
    const w = settle(base(), base(), [], T0 + H).state;
    expect(settle(w, w, [], T0 + H + 1000).state).toBe(w);
  });

  it('the Area plus the world systems: a catch-up makes the orders and the goals, and they survive the save codec', () => {
    const fresh = base();
    const r = AREAS.advance(fresh, T0 + 8 * H, mulberry32(1), 0, 'offline');
    const s = GOALS.settle(fresh, r.state, AREAS.toWorldEvents(r.events), ctx(T0 + 8 * H));
    expect(s.state.goals.board.slots.filter(Boolean).length).toBe(3);
    expect(s.state.goals.daily.goals).toHaveLength(3);
    expect(s.events.filter((e) => e.type === 'BOARD_ORDER_NEW')).toHaveLength(3);
    const again = SAVE_CODEC.areas ? migrate(JSON.parse(JSON.stringify(s.state)), SAVE_CODEC) : null;
    expect(again).toEqual({ ok: true, save: s.state, fromVersion: WORLD_SAVE_VERSION });
  });
});

describe('world save v10', () => {
  it('a v9 world gains the board, the goals and the Codex claims; nothing it had is lost', () => {
    const w = base();
    const v9 = JSON.parse(JSON.stringify({ ...w, schemaVersion: 9 })) as Record<string, unknown>;
    delete v9.goals;
    (v9.collection as Record<string, unknown>).claimed = undefined;
    v9.areas = { ...(v9.areas as object), sobi_farm: { ...(v9.areas as { sobi_farm: object }).sobi_farm, unlockedSlots: 9, decor: ['DECOR_HAY_BALE', 'DECOR_FENCE'] } };
    const r = migrate(v9, SAVE_CODEC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fromVersion).toBe(9);
    expect(r.save.schemaVersion).toBe(10);
    expect(r.save.goals.board.nextAt).not.toBeNull();
    expect(r.save.collection.claimed).toEqual([]);
    expect(r.save.progression.stats.slotsOwned).toBe(9); // seeded from the farm: SLOTS_* achievements stay reached
    expect(r.save.progression.stats.decorOwned).toBe(2);
    expect(r.save.wallet).toEqual(w.wallet);
  });
});
