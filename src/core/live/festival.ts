// The festivals (spec V2 §10, GĐ12): four of them repeat on a fixed cycle of days, each about one Area. While one runs, what
// the player does pays Event Tokens (up to a daily cap, plus a gift each day), and a shop sells things for them. Tokens never
// expire and live in the wallet. The calendar is a pure function of the day; the bookkeeping is `live.festival` in the save.
import type { z } from 'zod';
import type { festivalsFileSchema } from '../../../content/schemas/shared/festivals';
import type { FestivalEvent as EarnEvent } from '../../../content/schemas/vocab';
import { DAY_MS } from '../clock';
import { INVENTORY } from '../config/inventory';
import { changeCurrency } from '../economy/ledger';
import type { WorldEvent } from '../events';
import { addToBag } from '../inventory/bag';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import type { LiveState } from './state';

export type FestivalRules = z.infer<typeof festivalsFileSchema>;
export type FestivalDef = FestivalRules['festivals'][number];
export type ShopEntry = FestivalRules['shop'][number];

export type FestivalEvent =
  | { type: 'FESTIVAL_TOKENS'; festivalId: string; tokens: number }
  | { type: 'FESTIVAL_GIFT'; festivalId: string; tokens: number }
  | { type: 'FESTIVAL_BOUGHT'; entryId: string; cost: number; reward: ShopEntry['reward'] };

/** The `none` value of the Admin's festival switch: no festival runs on any day. */
export const NO_FESTIVAL = 'none';

const mod = (n: number, m: number) => ((n % m) + m) % m;
const dayOf = (ctx: ActionContext): number => Math.floor((ctx.now + (ctx.dayOffsetMs ?? 0)) / DAY_MS);

/** The festival the calendar runs on game day `day`, or null. */
export function festivalOfDay(day: number, rules: FestivalRules): FestivalDef | null {
  return rules.festivals.find((f) => mod(day - f.startDay, rules.cycleDays) < rules.lengthDays) ?? null;
}

/** The festival running now: the Admin's switch (a festival id, or `none`) wins over the calendar. */
export function liveFestival(day: number, forced: string | null, rules: FestivalRules): FestivalDef | null {
  if (forced === NO_FESTIVAL) return null;
  return rules.festivals.find((f) => f.id === forced) ?? festivalOfDay(day, rules);
}

/** Which turn of the calendar `day` belongs to for this festival: its shop limits count per run. */
export const festivalRun = (day: number, f: FestivalDef, rules: FestivalRules): number => Math.floor((day - f.startDay) / rules.cycleDays);

/** 1-based day of the running festival and the days left including today (a forced festival shows the full length). */
export function festivalProgress(day: number, f: FestivalDef, rules: FestivalRules): { dayOf: number; daysLeft: number } {
  const dayIn = mod(day - f.startDay, rules.cycleDays);
  return dayIn < rules.lengthDays ? { dayOf: dayIn + 1, daysLeft: rules.lengthDays - dayIn } : { dayOf: 1, daysLeft: rules.lengthDays };
}

/** The next festival that starts after `day` and in how many days (the calendar's, whatever the Admin forced). */
export function nextFestival(day: number, rules: FestivalRules): { festival: FestivalDef; inDays: number } {
  for (let d = day + 1; d <= day + rules.cycleDays; d += 1) {
    const f = festivalOfDay(d, rules);
    if (f && festivalOfDay(d - 1, rules)?.id !== f.id) return { festival: f, inDays: d - day };
  }
  return { festival: rules.festivals[0]!, inDays: rules.cycleDays };
}

/** Units each earning event counts for in a set of world events. */
function unitsOf(events: readonly WorldEvent[]): Partial<Record<EarnEvent, number>> {
  const units: Partial<Record<EarnEvent, number>> = {};
  const add = (id: EarnEvent, n: number) => {
    units[id] = (units[id] ?? 0) + n;
  };
  for (const e of events) {
    switch (e.type) {
      case 'crop.harvested':
      case 'flower.harvested':
      case 'potion.brewed':
        add(e.type, e.quantity);
        break;
      case 'order.completed':
      case 'fish.caught':
      case 'tank.cleaned':
      case 'creature.hatched':
      case 'creature.sold':
      case 'creature.petted':
        add(e.type, 1);
        break;
      default:
        break;
    }
  }
  return units;
}

/** Tokens the day's play has paid so far (the counter resets on a new day). */
const earnedOn = (live: LiveState, day: number): number => (live.festival.earnDay === day ? live.festival.earnedToday : 0);

/**
 * What the player did (the standard world events of an action) turned into tokens while a festival runs. Units count toward
 * the next token across actions; the daily cap holds what is paid. Pure; the same world when nothing is earned.
 */
export function earnTokens(
  world: WorldSave,
  worldEvents: readonly WorldEvent[],
  ctx: ActionContext,
  rules: FestivalRules,
): { state: WorldSave; events: FestivalEvent[] } {
  const day = dayOf(ctx);
  const fest = liveFestival(day, world.live.dev.festival, rules);
  if (!fest || worldEvents.length === 0) return { state: world, events: [] };
  const units = unitsOf(worldEvents);
  const progress = { ...world.live.festival.progress };
  let gained = 0;
  let touched = false;
  for (const rule of fest.earn) {
    const n = units[rule.event] ?? 0;
    if (n === 0) continue;
    touched = true;
    const key = `${fest.id}:${rule.event}`;
    const total = (progress[key] ?? 0) + n;
    gained += Math.floor(total / rule.per) * rule.tokens;
    progress[key] = total % rule.per;
  }
  if (!touched) return { state: world, events: [] };
  const paid = Math.max(0, Math.min(gained, rules.dailyCap - earnedOn(world.live, day)));
  const live: LiveState = { ...world.live, festival: { ...world.live.festival, progress, earnDay: day, earnedToday: earnedOn(world.live, day) + paid } };
  const state: WorldSave = { ...world, live };
  if (paid === 0) return { state, events: [] };
  const credited = changeCurrency(state, 'eventTokens', paid, { type: 'FESTIVAL_TOKENS', refId: fest.id }, ctx);
  if (!credited.ok) return { state, events: [] };
  return { state: credited.state, events: [{ type: 'FESTIVAL_TOKENS', festivalId: fest.id, tokens: paid }] };
}

/** True when today's festival gift can still be claimed. */
export const canClaimGift = (world: WorldSave, day: number, rules: FestivalRules): boolean =>
  liveFestival(day, world.live.dev.festival, rules) !== null && rules.dailyGift > 0 && world.live.festival.giftDay !== day;

/** The festival gift of the day: free tokens, once for each day of a festival. */
export function claimGift(world: WorldSave, ctx: ActionContext, rules: FestivalRules): ActionResultOf<WorldSave, FestivalEvent> {
  const day = dayOf(ctx);
  const fest = liveFestival(day, world.live.dev.festival, rules);
  if (!fest) return { ok: false, error: 'FESTIVAL_CLOSED' };
  if (world.live.festival.giftDay === day) return { ok: false, error: 'ALREADY_CLAIMED' };
  const credited = changeCurrency(world, 'eventTokens', rules.dailyGift, { type: 'FESTIVAL_GIFT', refId: fest.id }, ctx);
  if (!credited.ok) return credited;
  const live: LiveState = { ...world.live, festival: { ...world.live.festival, giftDay: day } };
  return { ok: true, state: { ...credited.state, live }, events: [{ type: 'FESTIVAL_GIFT', festivalId: fest.id, tokens: rules.dailyGift }] };
}

/** Entries the shop shows during `fest`: the ones for every festival and the ones for this one. */
export const shopOf = (fest: FestivalDef, rules: FestivalRules): ShopEntry[] => rules.shop.filter((s) => s.festival === null || s.festival === fest.id);

/** How many of an entry were bought in the run `run`. */
export const boughtInRun = (world: Pick<WorldSave, 'live'>, entryId: string, run: number): number => {
  const b = world.live.festival.bought[entryId];
  return b && b.run === run ? b.count : 0;
};

/** Buys a shop entry with tokens. Nothing changes when anything is refused. */
export function buyShopEntry(world: WorldSave, args: { entryId: string }, ctx: ActionContext, rules: FestivalRules): ActionResultOf<WorldSave, FestivalEvent> {
  const day = dayOf(ctx);
  const fest = liveFestival(day, world.live.dev.festival, rules);
  if (!fest) return { ok: false, error: 'FESTIVAL_CLOSED' };
  const entry = shopOf(fest, rules).find((s) => s.id === args.entryId);
  if (!entry) return { ok: false, error: 'INVALID_REQUEST' };
  const run = festivalRun(day, fest, rules);
  const had = boughtInRun(world, entry.id, run);
  if (entry.limit !== undefined && had >= entry.limit) return { ok: false, error: 'PURCHASE_LIMIT' };
  if (world.wallet.eventTokens < entry.cost) return { ok: false, error: 'NOT_ENOUGH_TOKENS' };
  let state: WorldSave = world;
  if (entry.reward.kind === 'item') {
    const bag = addToBag(world.inventory.items, entry.reward.itemId, entry.reward.quantity, INVENTORY);
    if (!bag.ok) return bag;
    state = { ...state, inventory: { items: bag.items } };
  } else {
    const gems = changeCurrency(state, 'gems', entry.reward.amount, { type: 'FESTIVAL_SHOP', refId: entry.id }, ctx);
    if (!gems.ok) return gems;
    state = gems.state;
  }
  const paid = changeCurrency(state, 'eventTokens', -entry.cost, { type: 'FESTIVAL_SHOP', refId: entry.id }, ctx);
  if (!paid.ok) return { ok: false, error: 'NOT_ENOUGH_TOKENS' };
  const live: LiveState = { ...paid.state.live, festival: { ...paid.state.live.festival, bought: { ...paid.state.live.festival.bought, [entry.id]: { run, count: had + 1 } } } };
  return { ok: true, state: { ...paid.state, live }, events: [{ type: 'FESTIVAL_BOUGHT', entryId: entry.id, cost: entry.cost, reward: entry.reward }] };
}
