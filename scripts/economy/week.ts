// A week of play by a bot, on the real game logic (GĐ6 step 9): three sessions a day (morning, noon, evening), each doing what
// a casual player does — claim what is waiting, feed and clean, ship grown pigs, buy pigs and pens, and from Sobi World level 3
// run the Garden. The numbers it prints (coins earned, time to each level, when the Garden opens) tell whether the pace is
// too fast or too slow. Deterministic: the same seed gives the same week. Imports only src/.
import { AREAS } from '../../src/app/areas';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { sellItem } from '../../src/areas/farm/logic/actions/sellItem';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { buyProduct } from '../../src/areas/farm/logic/actions/buyProduct';
import { buySlot } from '../../src/areas/farm/logic/actions/buySlot';
import { cleanAll } from '../../src/areas/farm/logic/actions/cleanPig';
import { cleanManure } from '../../src/areas/farm/logic/actions/cleanManure';
import { fillTrough } from '../../src/areas/farm/logic/actions/fillTrough';
import { petPig } from '../../src/areas/farm/logic/actions/petPig';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { treatPig } from '../../src/areas/farm/logic/actions/treatPig';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { liftFarmAction, type WorldAction } from '../../src/areas/farm/logic/world';
import { buildWorkshop, buyPlots, collectCraft, startCraft, upgradeSprinkler } from '../../src/areas/garden/logic/actions/buildings';
import { fertilizePlots, harvestPlots, plantCrops, waterPlots } from '../../src/areas/garden/logic/actions/plants';
import { gardenOf, hasGarden } from '../../src/areas/garden/logic/save/lens';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { DAY_MS, HOUR_MS } from '../../src/core/clock';
import { levelFromXp, worldXp } from '../../src/core/progression/levels';
import { mulberry32, type Rng } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import { defaultSettings } from '../../src/core/save/world';
import type { EventBase } from '../../src/core/events';
import { ITEMS } from '../../src/core/config/items';

/** When a day's sessions happen (hour of the local day) — a person who plays morning, noon and evening. */
export const SESSION_HOURS = [8, 13, 20] as const;
/** Coins the bot keeps back so a feed or a cure is never unaffordable. */
const RESERVE = 400;

export interface DayRow {
  day: number;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  pigs: number;
  slots: number;
  shipped: number;
  orders: number;
  goals: number;
  plots: number;
}

export interface WeekReport {
  days: DayRow[];
  /** Hours since the start at which each world level was reached (index = level). */
  levelAtHour: Record<number, number>;
  gardenOpenAtHour: number | null;
  /** Coins in (+) and out (-) by what the bot was doing. */
  ledger: Record<string, number>;
  /** Hours of play time each Area had (sessions only). */
  achievementsClaimed: number;
  gemsEarned: number;
}

class Bot {
  world: WorldSave;
  now: number;
  readonly rng: Rng;
  readonly start: number;
  ledger: Record<string, number> = {};
  levelAt: Record<number, number> = { 1: 0 };
  gardenAt: number | null = null;
  shipped = 0;
  orders = 0;
  goals = 0;
  achievements = 0;
  gems = 0;

  constructor(seed: number, start: number) {
    this.rng = mulberry32(seed);
    this.start = start;
    this.now = start;
    this.world = SAVE_CODEC.newWorld({ now: start, rng: this.rng, dayOffsetMs: 0 }, defaultSettings());
  }

  private ctx = (now = this.now) => ({ now, rng: this.rng, dayOffsetMs: 0 });

  /** The world caught up to `to` (a long gap is an offline catch-up), then the world systems' turn. */
  advance(to: number) {
    const before = this.world;
    const gap = to - this.now;
    const r = AREAS.advance(before, to, this.rng, 0, gap > HOUR_MS ? 'offline' : 'online');
    this.world = r.state;
    this.now = to;
    this.settle(before, r.events);
  }

  private settle(before: WorldSave, events: readonly EventBase[]) {
    const s = GOALS.settle(before, this.world, AREAS.toWorldEvents(events), this.ctx());
    this.world = s.state;
    this.mark();
  }

  private mark() {
    const level = levelFromXp(worldXp(this.world), { xp: WORLD_LEVELS.xp, maxLevel: WORLD_LEVELS.maxLevel });
    for (let l = 2; l <= level; l += 1) this.levelAt[l] ??= (this.now - this.start) / HOUR_MS;
    if (this.gardenAt === null && this.world.world.unlockedAreas.includes('sobi_garden')) this.gardenAt = (this.now - this.start) / HOUR_MS;
  }

  /** Runs an action; its coin change is booked under `label`. False when it was refused. */
  act(label: string, action: WorldAction): boolean {
    const before = this.world;
    const r = action(before, this.ctx());
    if (!r.ok) return false;
    this.world = r.state;
    this.ledger[label] = (this.ledger[label] ?? 0) + (r.state.wallet.coins - before.wallet.coins);
    this.gems += Math.max(0, r.state.wallet.gems - before.wallet.gems);
    this.settle(before, r.events);
    return true;
  }

  farm = () => farmOf(this.world);
  coins = () => this.world.wallet.coins;
  bag = (id: string) => this.world.inventory.items[id] ?? 0;
}

function claimEverything(b: Bot, day: number) {
  b.act('login', GOALS.claimLogin(day));
  b.world.goals.daily.goals.forEach((g, i) => {
    if (g.reached && !g.claimed && b.act('daily goals', GOALS.claimGoal(i))) b.goals += 1;
  });
  b.act('daily goals', GOALS.claimBonus());
  for (const d of GOALS.rules.achievements) {
    if (b.world.progression.claimed[d.id] === undefined && b.act('achievements', GOALS.claimAchievement(d.id))) b.achievements += 1;
  }
  for (const m of GOALS.rules.codex.milestones) b.act('codex', GOALS.claimMilestone(m.id));
  b.world.goals.board.slots.forEach((o, slot) => {
    if (o && b.act('board orders', GOALS.deliver(slot))) b.orders += 1;
  });
}

function farmRoutine(b: Bot) {
  const f = () => b.farm();
  // Sick pigs first, then food, the pen, the day's petting.
  for (const p of f().pigs.filter((x) => x.isSick)) {
    if (b.bag('MEDICINE_COMMON') < 1 && b.coins() >= 100 + RESERVE) b.act('medicine', liftFarmAction((s, c) => buyProduct(s, { productId: 'MEDICINE_COMMON', count: 1 }, c)));
    b.act('cures', liftFarmAction((s, c) => treatPig(s, { pigId: p.id }, c)));
  }
  const space = f().trough.capacity - f().trough.food;
  const fromBag = Math.min(b.bag('FOOD_BASIC'), space);
  const buyable = Math.max(0, Math.floor((b.coins() - RESERVE) / ITEMS.FOOD_BASIC.priceGold));
  const units = Math.min(space, fromBag + buyable);
  if (f().pigs.length > 0 && units >= 1) b.act('food', liftFarmAction((s, c) => fillTrough(s, { units }, c)));
  b.act('care', liftFarmAction((s, c) => cleanAll(s, c)));
  b.act('manure', liftFarmAction((s, c) => cleanManure(s, c)));
  for (const p of f().pigs) {
    b.act('care', liftFarmAction((s, c) => petPig(s, { pigId: p.id }, c)));
    b.act('care', liftFarmAction((s, c) => petPig(s, { pigId: p.id }, c)));
  }
  // Ship what is fully grown.
  for (const p of f().pigs.filter((x) => x.growthProgress >= 100 && x.pregnancy === null && x.purpose !== 'PET')) {
    if (b.act('shipping', liftFarmAction((s, c) => sellPig(s, { pigId: p.id }, c)))) b.shipped += 1;
  }
  // Pens first (they raise how many pigs earn), then pigs to fill them.
  while (b.coins() >= RESERVE + 2000 && b.act('pens', liftFarmAction((s, c) => buySlot(s, {}, c)))) {
    /* as many as it can afford */
  }
  const cheapest = 'PIG_EARTH_PINK';
  while (f().pigs.length < f().player.unlockedSlots && b.coins() >= RESERVE + (BREEDS[cheapest].buyGold ?? 0)) {
    const gender = f().pigs.length % 2 === 0 ? 'FEMALE' : 'MALE';
    if (!b.act('pigs bought', liftFarmAction((s, c) => buyPig(s, { breed: cheapest, gender }, c)))) break;
  }
  // Crops beyond what the bot keeps for the mill and the orders are sold.
  for (const id of ['item_manure', 'item_grass', 'item_wheat', 'item_corn', 'item_potato', 'item_carrot'] as const) {
    const spare = b.bag(id) - 30;
    if (spare > 0) b.act('items sold', liftFarmAction((s, c) => sellItem(s, { itemId: id, quantity: spare }, c)));
  }
}

function gardenRoutine(b: Bot) {
  if (!hasGarden(b.world)) return;
  b.act('garden', (w, c) => harvestPlots(w, {}, c));
  for (const building of ['mill', 'composter'] as const) b.act('garden', (w, c) => collectCraft(w, { building }, c));
  // Buildings and growth, in the order a player would want them, whenever the money is there.
  for (const building of ['mill', 'composter'] as const) {
    if (!gardenOf(b.world).built[building] && b.coins() >= RESERVE + 450) b.act('garden building', (w, c) => buildWorkshop(w, { building }, c));
  }
  while (b.coins() >= RESERVE + 1500 && b.act('garden building', (w, c) => buyPlots(w, c))) {
    /* plots */
  }
  if (b.coins() >= RESERVE + 1500) b.act('garden building', (w, c) => upgradeSprinkler(w, c));
  const empty = gardenOf(b.world).plots.flatMap((p, i) => (p.cropId === null ? [i] : []));
  // Half corn, a quarter wheat, the rest carrots (and grass for the composter).
  const split = [Math.ceil(empty.length / 2), Math.ceil(empty.length / 4)];
  const corn = empty.slice(0, split[0]);
  const wheat = empty.slice(split[0], split[0]! + split[1]!);
  const rest = empty.slice(split[0]! + split[1]!);
  if (corn.length > 0) b.act('seeds', (w, c) => plantCrops(w, { cropId: 'crop_corn', plots: corn }, c));
  if (wheat.length > 0) b.act('seeds', (w, c) => plantCrops(w, { cropId: 'crop_wheat', plots: wheat }, c));
  if (rest.length > 0) b.act('seeds', (w, c) => plantCrops(w, { cropId: b.bag('item_grass') < 3 ? 'crop_grass' : 'crop_carrot', plots: rest }, c));
  b.act('garden', (w, c) => waterPlots(w, {}, c));
  const growing = gardenOf(b.world).plots.flatMap((p, i) => (p.cropId !== null && p.ripeAt === null && !p.fertilized ? [i] : []));
  if (growing.length > 0 && b.bag('item_fertilizer') >= growing.length) b.act('garden', (w, c) => fertilizePlots(w, { plots: growing }, c));
  // The workshops: feed from corn and wheat, fertilizer from manure and grass.
  const feedBatches = Math.min(10, Math.floor(b.bag('item_corn') / 2), b.bag('item_wheat'));
  if (feedBatches >= 1) b.act('garden', (w, c) => startCraft(w, { building: 'mill', recipeId: 'recipe_pig_feed', batches: feedBatches }, c));
  const compostBatches = Math.min(10, Math.floor(b.bag('item_manure') / 3), b.bag('item_grass'));
  if (compostBatches >= 1) b.act('garden', (w, c) => startCraft(w, { building: 'composter', recipeId: 'recipe_fertilizer', batches: compostBatches }, c));
}

/** One bot, seven days. `start` is a local midnight. */
export function simulateWeek(seed = 7, start = 20_000 * DAY_MS, days = 7): WeekReport {
  const b = new Bot(seed, start);
  const rows: DayRow[] = [];
  for (let d = 0; d < days; d += 1) {
    for (const hour of SESSION_HOURS) {
      b.advance(start + d * DAY_MS + hour * HOUR_MS);
      claimEverything(b, Math.floor(b.now / DAY_MS));
      farmRoutine(b);
      gardenRoutine(b);
      claimEverything(b, Math.floor(b.now / DAY_MS));
    }
    const farm = b.farm();
    rows.push({
      day: d + 1,
      coins: b.coins(),
      gems: b.world.wallet.gems,
      level: levelFromXp(worldXp(b.world), { xp: WORLD_LEVELS.xp, maxLevel: WORLD_LEVELS.maxLevel }),
      xp: worldXp(b.world),
      pigs: farm.pigs.length,
      slots: farm.player.unlockedSlots,
      shipped: b.shipped,
      orders: b.orders,
      goals: b.goals,
      plots: hasGarden(b.world) ? gardenOf(b.world).plots.length : 0,
    });
  }
  return { days: rows, levelAtHour: b.levelAt, gardenOpenAtHour: b.gardenAt, ledger: b.ledger, achievementsClaimed: b.achievements, gemsEarned: b.gems };
}
