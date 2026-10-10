// The Order Board (spec V2 §9, GAME_BALANCE §8): a few slots in the plaza; every few hours an empty slot gets an
// order for items the player's Areas make; delivering pays better than selling. An order is a pure function
// of the board's serial and the world when it appeared, so a catch-up makes the same orders as a live game.
import type { ordersFileSchema } from '../../../content/schemas/shared/orders';
import type { z } from 'zod';
import { changeCurrency } from '../economy/ledger';
import { addAllToBag, takeFromBag } from '../inventory/bag';
import { INVENTORY } from '../config/inventory';
import { hashSeed, mulberry32 } from '../rng';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import type { BoardOrder, GoalsState } from './state';

export type OrderRules = z.infer<typeof ordersFileSchema>;

/** What an order may ask for depends on the world: its level and the Areas the player has opened. */
export interface BoardWorld {
  worldLevel: number;
  worldDevelopment: number;
  unlockedAreas: readonly string[];
}

/** What one unit of an item is worth (its sale price, else its shop price). */
export type ItemValue = (itemId: string) => number;

export const slotCount = (worldDevelopment: number, rules: Pick<OrderRules, 'slots'>): number =>
  rules.slots.filter((s) => worldDevelopment >= s.fromWorldDevelopment).at(-1)?.count ?? rules.slots[0]!.count;

const maxLines = (worldLevel: number, rules: Pick<OrderRules, 'lines'>): number =>
  rules.lines.filter((l) => worldLevel >= l.fromWorldLevel).at(-1)?.max ?? 1;

/** The order of `serial`: asks for 1..n items of the open Areas, pays `rewardMultiplier` × their value. */
export function makeOrder(serial: number, at: number, world: BoardWorld, rules: OrderRules, value: ItemValue): BoardOrder {
  const rng = mulberry32(hashSeed('board-order', serial));
  const pool = rules.requests.filter((r) => world.unlockedAreas.includes(r.area) && world.worldLevel >= r.fromWorldLevel);
  const wanted = pool.length > 0 ? pool : rules.requests.filter((r) => r.fromWorldLevel === 1);
  const lineCount = Math.min(wanted.length, 1 + Math.floor(rng.next() * maxLines(world.worldLevel, rules)));
  const left = [...wanted];
  const lines: BoardOrder['lines'] = [];
  for (let i = 0; i < lineCount; i += 1) {
    const total = left.reduce((n, r) => n + r.weight, 0);
    let roll = rng.next() * total;
    const index = Math.max(0, left.findIndex((r) => (roll -= r.weight) < 0));
    const r = left.splice(index, 1)[0]!;
    lines.push({ itemId: r.itemId, qty: r.min + Math.floor(rng.next() * (r.max - r.min + 1)) });
  }
  const worth = lines.reduce((n, l) => n + l.qty * value(l.itemId), 0);
  const coins = Math.max(1, Math.round(worth * rules.rewardMultiplier));
  const xp = Math.min(rules.xp.max, Math.max(rules.xp.min, Math.round(coins / rules.xp.coinsPerXp)));
  const bonus = rng.next() < rules.bonus.chance ? { itemId: rules.bonus.itemId, qty: rules.bonus.quantity } : null;
  return { id: `order_${serial}`, lines, coins, xp, bonus, createdAt: at };
}

export interface BoardAdvance {
  goals: GoalsState;
  /** Orders that appeared, in order. */
  spawned: BoardOrder[];
}

/**
 * The board at `now`: slots resized to the world, then one order per `spawnEveryMs` while a slot is empty, each
 * stamped with the moment it appeared. The same GoalsState when nothing changes.
 */
export function advanceBoard(goals: GoalsState, now: number, world: BoardWorld, rules: OrderRules, value: ItemValue): BoardAdvance {
  const want = slotCount(world.worldDevelopment, rules);
  let slots = goals.board.slots;
  if (slots.length < want) slots = [...slots, ...Array.from({ length: want - slots.length }, () => null)];
  let { serial, nextAt } = goals.board;
  const spawned: BoardOrder[] = [];
  const empty = () => slots.findIndex((o, i) => o === null && i < want);
  if (empty() >= 0 && nextAt === null) nextAt = now;
  while (nextAt !== null && nextAt <= now && empty() >= 0) {
    const order = makeOrder(serial, nextAt, world, rules, value);
    slots = slots.map((o, i) => (i === empty() ? order : o));
    spawned.push(order);
    serial += 1;
    nextAt += rules.spawnEveryMs;
  }
  if (empty() < 0) nextAt = null;
  if (spawned.length === 0 && slots === goals.board.slots && nextAt === goals.board.nextAt) return { goals, spawned };
  return { goals: { ...goals, board: { serial, slots, nextAt } }, spawned };
}

export type BoardEvent =
  | { type: 'BOARD_ORDER_NEW'; orderId: string }
  | { type: 'BOARD_ORDER_DONE'; orderId: string; coins: number; xp: number }
  | { type: 'BOARD_ORDER_REROLLED'; orderId: string };

type BoardResult = ActionResultOf<WorldSave, BoardEvent | WorldLevelUp>;

/** Lines of the order the bag cannot cover yet (empty = it can be delivered). */
export const missingLines = (order: BoardOrder, items: Readonly<Record<string, number>>): BoardOrder['lines'] =>
  order.lines.filter((l) => (items[l.itemId] ?? 0) < l.qty);

/** The slot's order is delivered: items out, coins and XP in, the slot opens (the next order comes in a while). */
export function deliverOrder(
  world: WorldSave,
  args: { slot: number },
  ctx: ActionContext,
  rules: OrderRules,
  /** Adds XP of the world (not an Area) and returns the level-up events. */
  addXp: (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] },
): BoardResult {
  const order = world.goals.board.slots[args.slot];
  if (!order) return { ok: false, error: 'ORDER_NOT_FOUND' };
  let items = world.inventory.items;
  for (const line of order.lines) {
    const taken = takeFromBag(items, line.itemId, line.qty);
    if (!taken.ok) return { ok: false, error: 'INSUFFICIENT_ITEM' };
    items = taken.items;
  }
  if (order.bonus) {
    const bonus = addAllToBag(items, { [order.bonus.itemId]: order.bonus.qty }, INVENTORY);
    if (!bonus.ok) return bonus;
    items = bonus.items;
  }
  const paid = changeCurrency({ ...world, inventory: { items } }, 'coins', order.coins, { type: 'BOARD_ORDER', refId: order.id }, ctx);
  if (!paid.ok) return paid;
  const { board } = world.goals;
  const slots = board.slots.map((o, i) => (i === args.slot ? null : o));
  const stats = { ...world.progression.stats, boardOrders: (world.progression.stats.boardOrders ?? 0) + 1 };
  const settled: WorldSave = {
    ...paid.state,
    goals: { ...world.goals, board: { ...board, slots, nextAt: board.nextAt ?? ctx.now + rules.spawnEveryMs } },
    progression: { ...world.progression, stats },
  };
  const xp = addXp(settled, order.xp);
  return { ok: true, state: xp.state, events: [{ type: 'BOARD_ORDER_DONE', orderId: order.id, coins: order.coins, xp: order.xp }, ...xp.events] };
}

/** Swaps an order for a new one for Gems (the slot never waits). */
export function rerollOrder(
  world: WorldSave,
  args: { slot: number },
  ctx: ActionContext,
  rules: OrderRules,
  boardWorld: BoardWorld,
  value: ItemValue,
): BoardResult {
  const { board } = world.goals;
  if (!board.slots[args.slot]) return { ok: false, error: 'ORDER_NOT_FOUND' };
  const paid = changeCurrency(world, 'gems', -rules.rerollGems, { type: 'BOARD_REROLL', refId: board.slots[args.slot]!.id }, ctx);
  if (!paid.ok) return paid;
  const order = makeOrder(board.serial, ctx.now, boardWorld, rules, value);
  const slots = board.slots.map((o, i) => (i === args.slot ? order : o));
  const state = { ...paid.state, goals: { ...world.goals, board: { ...board, serial: board.serial + 1, slots } } };
  return { ok: true, state, events: [{ type: 'BOARD_ORDER_REROLLED', orderId: order.id }] };
}
