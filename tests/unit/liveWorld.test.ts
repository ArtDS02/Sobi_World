// The living world (GĐ12): the weather of a day, what it does to crops, fish and breeding; the four festivals with their Event
// Tokens and shop; the visiting merchant; and the save format v11 with its migration.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { gardenArea } from '../../src/areas/garden';
import { plantCrops } from '../../src/areas/garden/logic/actions/plants';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { simulateGarden } from '../../src/areas/garden/logic/simulate';
import { castLine } from '../../src/areas/aquarium/logic/actions/fishing';
import { catchOdds, CLEAR_WATER } from '../../src/areas/aquarium/logic/fishing';
import { DAY_MS, HOUR_MS } from '../../src/core/clock';
import { FESTIVAL_RULES, FESTIVALS, MERCHANT_RULES } from '../../src/core/config/live';
import { WEATHER_RULES } from '../../src/core/config/weather';
import { festivalSchema } from '../../content/schemas/shared/festivals';
import {
  boughtInRun,
  buyShopEntry,
  canClaimGift,
  claimGift,
  earnTokens,
  festivalOfDay,
  festivalRun,
  liveFestival,
  nextFestival,
  NO_FESTIVAL,
  shopOf,
} from '../../src/core/live/festival';
import { advanceMerchant, deliverOffer } from '../../src/core/live/merchant';
import { initialLive } from '../../src/core/live/state';
import { merchantVisits, merchantWants } from '../../src/core/live/visit';
import { itemValue } from '../../src/core/goals/api';
import type { WorldEvent } from '../../src/core/events';
import { mulberry32 } from '../../src/core/rng';
import { migrate } from '../../src/core/save/migrate';
import { WORLD_SAVE_VERSION, type WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { dailyMarket } from '../../src/systems/valuation/market';
import { MARKET_RULES } from '../../src/systems/valuation/marketRules';
import { weatherNow } from '../../src/systems/weather/live';
import {
  baseWeather,
  cropWeather,
  daySegments,
  fishingWeather,
  forecast,
  liveWeather,
  monthOfDay,
  mutationWeather,
  seasonOfDay,
  weatherOfDay,
  WEATHER_VALUES,
  type WeatherId,
} from '../../src/systems/weather/weather';
import { festivalVm, merchantVm, weatherVm } from '../../src/ui/live/liveVm';

const R = WEATHER_RULES;
const ctx = (now: number, offset = 0): ActionContext => ({ now, rng: mulberry32(5), dayOffsetMs: offset });
const world = (now: number): WorldSave => SAVE_CODEC.newWorld(ctx(now));
const ok = <S>(r: { ok: boolean; state?: S; error?: string }): S => {
  if (!r.ok) throw new Error(`failed: ${r.error}`);
  return r.state as S;
};
const err = (r: { ok: boolean; error?: string }): string => (r.ok ? 'ok' : r.error!);
const withLive = (w: WorldSave, patch: Partial<WorldSave['live']['dev']>): WorldSave => ({ ...w, live: { ...w.live, dev: { ...w.live.dev, ...patch } } });
const harvested = (quantity: number): WorldEvent => ({ type: 'crop.harvested', area: 'sobi_garden', plotId: 'p', cropId: 'crop_corn', quantity });

/** A day number that has the weather, found by search (the calendar is fixed, so the search is stable). */
const dayWith = (w: WeatherId, from = 20_000): number => Array.from({ length: 400 }, (_, i) => from + i).find((d) => weatherOfDay(d, R) === w)!;
const startOf = (fest: string): number => FESTIVALS[fest]!.startDay;
/** The first day of the calendar's festival `id` at or after day 20,000. */
const festivalDay = (id: string, plus = 0): number => {
  const d = Array.from({ length: 60 }, (_, i) => 20_000 + i).find((x) => festivalOfDay(x, FESTIVAL_RULES)?.id === id && festivalOfDay(x - 1, FESTIVAL_RULES)?.id !== id)!;
  return d + plus;
};
const quietDay = (): number => Array.from({ length: 60 }, (_, i) => 20_000 + i).find((x) => festivalOfDay(x, FESTIVAL_RULES) === null)!;

describe('the weather of a day', () => {
  it('is a pure function of the day: the same every time, and the forecast of tomorrow is exact', () => {
    for (let d = 19_000; d < 19_200; d += 1) expect(weatherOfDay(d, R)).toBe(weatherOfDay(d, R));
    expect(forecast(20_000, null, R)).toEqual({ today: weatherOfDay(20_000, R), tomorrow: weatherOfDay(20_001, R) });
    expect(forecast(20_000, 'rainy', R)).toEqual({ today: 'rainy', tomorrow: 'rainy' }); // the Admin's switch holds on every day
    expect(liveWeather(20_000, 'bogus', R)).toBe(weatherOfDay(20_000, R));
  });

  it('knows the calendar: months and seasons of a day number', () => {
    expect(monthOfDay(0)).toBe(1); // 1970-01-01
    expect(monthOfDay(31)).toBe(2);
    expect(monthOfDay(20_000)).toBe(10); // 2024-10-04
    expect(seasonOfDay(20_000)).toBe('autumn');
    expect(seasonOfDay(20_000 + 60)).toBe('winter'); // 2024-12-03
  });

  it('follows the weights of the season: no snow outside winter, all kinds over a year, a rainbow only after rain', () => {
    const count: Record<string, number> = {};
    for (let d = 19_800; d < 19_800 + 730; d += 1) {
      const w = weatherOfDay(d, R);
      count[w] = (count[w] ?? 0) + 1;
      if (w === 'snowy') expect(seasonOfDay(d)).toBe('winter');
      if (w === 'rainbow') expect(baseWeather(d - 1, R)).toBe('rainy');
    }
    for (const id of WEATHER_VALUES) expect(count[id], id).toBeGreaterThan(0);
    expect(count.sunny!).toBeGreaterThan(count.rainy!); // fine weather is the usual one
    expect((count.sunny! + count.rainy! + count.foggy! + count.snowy! + count.rainbow!) | 0).toBe(730);
  });

  it('a stretch of time is cut at every local midnight, wherever the player lives', () => {
    const offset = 7 * HOUR_MS; // UTC+7
    const from = 20_000 * DAY_MS - offset - 2 * HOUR_MS; // 22:00 the evening before day 20,000
    const segs = daySegments(from, from + 30 * HOUR_MS, offset);
    expect(segs.map((s) => s.day)).toEqual([19_999, 20_000, 20_001]);
    expect(segs[0]).toMatchObject({ from, to: 20_000 * DAY_MS - offset });
    expect(segs.reduce((n, s) => n + s.to - s.from, 0)).toBe(30 * HOUR_MS);
    expect(daySegments(10, 10, 0)).toEqual([]);
  });

  it('gives only small gifts: rain grows and waters, rain at night favours rare fish, fog lifts a cast, a rainbow helps a mutation', () => {
    expect(cropWeather('rainy', R)).toEqual({ rate: R.effects.rain.growthRate, watered: true });
    for (const w of ['sunny', 'foggy', 'snowy', 'rainbow'] as const) expect(cropWeather(w, R)).toEqual({ rate: 1, watered: false });
    expect(fishingWeather('rainy', true, R).rareLuck).toBe(R.effects.rainNight.rareLuck);
    expect(fishingWeather('rainy', false, R).rareLuck).toBe(1);
    expect(fishingWeather('foggy', false, R).scoreBonus).toBe(R.effects.fog.biteBonus);
    expect(mutationWeather('rainbow', R)).toBe(R.effects.rainbow.mutationBoost);
    expect(mutationWeather('rainy', R)).toBe(0);
  });
});

describe('rain in the garden', () => {
  const T = 20_000 * DAY_MS + 8 * HOUR_MS;
  const sown = (weather: string): WorldSave => {
    const w = withLive(gardenArea.init(world(T), ctx(T)), { weather });
    return ok(plantCrops(w, { cropId: 'crop_corn', plots: [0, 1] }, ctx(T)));
  };

  it('a rainy day waters every plot and speeds the crop up; a sunny one leaves a dry plot at half speed', () => {
    const rainy = simulateGarden(gardenOf(sown('rainy')), T + 6 * HOUR_MS, 0, 'rainy').state;
    const sunny = simulateGarden(gardenOf(sown('sunny')), T + 6 * HOUR_MS, 0, 'sunny').state;
    expect(rainy.plots[0]!.ripeAt).not.toBeNull(); // corn: 4 h watered / 1.25 = 3.2 h
    expect(rainy.plots[0]!.ripeAt!).toBeCloseTo(T + 3.2 * HOUR_MS, -2);
    expect(sunny.plots[0]!.ripeAt).toBeNull(); // dry: 8 h
  });

  it('gives the same crop whether the time passes in a minute, ten minutes, an hour or one jump — across midnights too', () => {
    const start = sown('rainy');
    const to = T + 40 * HOUR_MS; // crosses a midnight
    const jump = simulateGarden(gardenOf(start), to, 0, 'rainy').state;
    const stepped = (stepMs: number) => {
      let g = gardenOf(start);
      for (let t = T + stepMs; t < to + stepMs; t += stepMs) g = simulateGarden(g, Math.min(t, to), 0, 'rainy').state;
      return g;
    };
    for (const step of [60_000, 600_000, HOUR_MS]) {
      const g = stepped(step);
      expect(g.plots[0]!.ripeAt!).toBeCloseTo(jump.plots[0]!.ripeAt!, -2);
      expect(g.plots[0]!.grown).toBeCloseTo(jump.plots[0]!.grown, -2);
    }
  });

  it('a day of rain followed by a day of sun grows a crop by the sum of both (cut at the local midnight)', () => {
    const rainDay = dayWith('rainy');
    const next = rainDay + 1;
    expect(weatherOfDay(next, R)).not.toBe('rainy'); // find a clear day after rain
    const start = rainDay * DAY_MS + 20 * HOUR_MS;
    const w0 = ok(plantCrops(gardenArea.init(world(start), ctx(start)), { cropId: 'crop_corn', plots: [0] }, ctx(start)));
    const after = simulateGarden(gardenOf(w0), start + 8 * HOUR_MS, 0).state; // 4 h of rain, then 4 h of whatever the next day is
    const cropRate = cropWeather(weatherOfDay(next, R), R).rate;
    const rainy = 4 * HOUR_MS * R.effects.rain.growthRate;
    const rest = 4 * HOUR_MS * cropRate * (cropWeather(weatherOfDay(next, R), R).watered ? 1 : 0.5);
    expect(after.plots[0]!.grown).toBeCloseTo(Math.min(rainy + rest, 4 * HOUR_MS), -2);
  });
});

describe('the sky over the dock', () => {
  it('rain at night lifts the rare fish only at night; fog makes a poor cast count', () => {
    const rare = (o: ReturnType<typeof catchOdds>) => o.filter((x) => x.species && ['RARE', 'EPIC', 'LEGENDARY'].includes(x.species.rarity)).reduce((n, x) => n + x.share, 0);
    const clear = rare(catchOdds(0.5, true, CLEAR_WATER));
    const rainy = rare(catchOdds(0.5, true, fishingWeather('rainy', true, R)));
    expect(rainy).toBeGreaterThan(clear);
    expect(rare(catchOdds(0.5, false, fishingWeather('rainy', false, R)))).toBeCloseTo(rare(catchOdds(0.5, false, CLEAR_WATER)), 10);
  });

  it('a cast under the line is a miss on a clear day and a catch in the fog', () => {
    const T = 20_000 * DAY_MS + 12 * HOUR_MS;
    const open = (weather: string): WorldSave => {
      const w = world(T);
      return withLive({ ...AREAS.get('sobi_aquarium')!.init({ ...w, progression: { ...w.progression, areas: { sobi_farm: { xp: 100_000 } } } }, ctx(T)) }, { weather });
    };
    const miss = castLine(open('sunny'), { score: 0.2 }, ctx(T));
    const fog = castLine(open('foggy'), { score: 0.2 }, ctx(T));
    const quantity = (r: typeof miss) => (r.ok ? (r.events[0] as unknown as { quantity: number }).quantity : -1);
    expect(quantity(miss)).toBe(0);
    expect(quantity(fog)).toBe(1);
  });
});

describe('the festivals', () => {
  it('four festivals share the calendar without overlapping, and a day runs at most one', () => {
    expect(FESTIVAL_RULES.festivals.map((f) => f.id)).toEqual(['fest_harvest', 'fest_fish', 'fest_flower', 'fest_pig']);
    let running = 0;
    for (let d = 0; d < FESTIVAL_RULES.cycleDays; d += 1) running += festivalOfDay(d, FESTIVAL_RULES) ? 1 : 0;
    expect(running).toBe(4 * FESTIVAL_RULES.lengthDays);
    expect(festivalOfDay(startOf('fest_fish') + 28 * 100, FESTIVAL_RULES)?.id).toBe('fest_fish');
    expect(festivalOfDay(startOf('fest_fish') + FESTIVAL_RULES.lengthDays, FESTIVAL_RULES)).toBeNull();
    // Every festival belongs to an Area, pays for the actions of that Area, and has something to buy.
    for (const f of FESTIVAL_RULES.festivals) {
      expect(festivalSchema.safeParse(f).success).toBe(true);
      expect(shopOf(f, FESTIVAL_RULES).length).toBeGreaterThan(4);
    }
    expect(FESTIVAL_RULES.shop.filter((s) => s.festival === null)).not.toHaveLength(0);
  });

  it('the Admin can run one on every day or none at all', () => {
    const d = quietDay();
    expect(liveFestival(d, null, FESTIVAL_RULES)).toBeNull();
    expect(liveFestival(d, 'fest_pig', FESTIVAL_RULES)?.id).toBe('fest_pig');
    expect(liveFestival(festivalDay('fest_harvest'), NO_FESTIVAL, FESTIVAL_RULES)).toBeNull();
    expect(nextFestival(d, FESTIVAL_RULES).inDays).toBeGreaterThan(0);
    expect(nextFestival(d, FESTIVAL_RULES).inDays).toBeLessThanOrEqual(FESTIVAL_RULES.cycleDays);
  });

  it('pays tokens for what the player does, carries the remainder, stops at the daily cap', () => {
    const day = festivalDay('fest_harvest');
    const now = day * DAY_MS + 10 * HOUR_MS;
    let w = world(now);
    // 6 crops = 1 token; 5 crops = nothing yet but remembered.
    const a = earnTokens(w, [harvested(5)], ctx(now), FESTIVAL_RULES);
    expect(a.state.wallet.eventTokens).toBe(0);
    const b = earnTokens(a.state, [harvested(1)], ctx(now), FESTIVAL_RULES);
    expect(b.state.wallet.eventTokens).toBe(1);
    expect(b.events).toEqual([{ type: 'FESTIVAL_TOKENS', festivalId: 'fest_harvest', tokens: 1 }]);
    // An order pays 2 on the spot; a thing the festival does not pay for pays nothing.
    const c = earnTokens(b.state, [{ type: 'order.completed', area: 'world', orderId: 'o' }], ctx(now), FESTIVAL_RULES);
    expect(c.state.wallet.eventTokens).toBe(3);
    expect(earnTokens(c.state, [{ type: 'fish.caught', area: 'x', speciesId: 's', itemId: 'i' }], ctx(now), FESTIVAL_RULES).state).toBe(c.state);
    // The cap holds what a day can pay, and a new day starts again.
    w = c.state;
    const big = earnTokens(w, [harvested(600)], ctx(now), FESTIVAL_RULES);
    expect(big.state.wallet.eventTokens).toBe(FESTIVAL_RULES.dailyCap);
    expect(earnTokens(big.state, [harvested(60)], ctx(now), FESTIVAL_RULES).state.wallet.eventTokens).toBe(FESTIVAL_RULES.dailyCap);
    const tomorrow = (day + 1) * DAY_MS + HOUR_MS;
    expect(earnTokens(big.state, [harvested(6)], ctx(tomorrow), FESTIVAL_RULES).state.wallet.eventTokens).toBe(FESTIVAL_RULES.dailyCap + 1);
    // Tokens go through the ledger like every currency.
    expect(big.state.transactions[0]).toMatchObject({ currency: 'eventTokens', type: 'FESTIVAL_TOKENS' });
  });

  it('pays nothing outside a festival, and nothing for what happens while the player is away', () => {
    const now = quietDay() * DAY_MS + 3 * HOUR_MS;
    const w = world(now);
    expect(earnTokens(w, [harvested(60)], ctx(now), FESTIVAL_RULES).state).toBe(w);
    expect(FESTIVAL_RULES.festivals.flatMap((f) => f.earn.map((e) => e.event))).not.toContain('creature.born');
    expect(err(claimGift(w, ctx(now), FESTIVAL_RULES))).toBe('FESTIVAL_CLOSED');
  });

  it('gives a gift once for each festival day', () => {
    const day = festivalDay('fest_flower');
    const now = day * DAY_MS + 9 * HOUR_MS;
    const w = world(now);
    expect(canClaimGift(w, day, FESTIVAL_RULES)).toBe(true);
    const got = ok(claimGift(w, ctx(now), FESTIVAL_RULES));
    expect(got.wallet.eventTokens).toBe(FESTIVAL_RULES.dailyGift);
    expect(err(claimGift(got, ctx(now + HOUR_MS), FESTIVAL_RULES))).toBe('ALREADY_CLAIMED');
    expect(canClaimGift(got, day, FESTIVAL_RULES)).toBe(false);
    const again = ok(claimGift(got, ctx(now + DAY_MS), FESTIVAL_RULES));
    expect(again.wallet.eventTokens).toBe(2 * FESTIVAL_RULES.dailyGift);
  });

  it('sells for tokens: its own stock, with limits per run of the festival, never without tokens or outside a festival', () => {
    const day = festivalDay('fest_pig');
    const now = day * DAY_MS + 9 * HOUR_MS;
    const rich: WorldSave = { ...world(now), wallet: { coins: 0, gems: 0, eventTokens: 100 } };
    expect(err(buyShopEntry(world(now), { entryId: 'fs_p_egg' }, ctx(now), FESTIVAL_RULES))).toBe('NOT_ENOUGH_TOKENS');
    expect(err(buyShopEntry(rich, { entryId: 'fs_h_carrot' }, ctx(now), FESTIVAL_RULES))).toBe('INVALID_REQUEST'); // the harvest's stock, not the pigs'
    const egg = ok(buyShopEntry(rich, { entryId: 'fs_p_egg' }, ctx(now), FESTIVAL_RULES));
    expect(egg.wallet.eventTokens).toBe(70);
    expect(egg.inventory.items.item_pig_egg_wild).toBe(1);
    expect(err(buyShopEntry(egg, { entryId: 'fs_p_egg' }, ctx(now), FESTIVAL_RULES))).toBe('PURCHASE_LIMIT');
    expect(boughtInRun(egg, 'fs_p_egg', festivalRun(day, FESTIVALS.fest_pig!, FESTIVAL_RULES))).toBe(1);
    // The next run of the festival sells it again.
    const next = (day + FESTIVAL_RULES.cycleDays) * DAY_MS + HOUR_MS;
    expect(ok(buyShopEntry(egg, { entryId: 'fs_p_egg' }, ctx(next), FESTIVAL_RULES)).inventory.items.item_pig_egg_wild).toBe(2);
    // Gems for tokens, limited.
    const gem = ok(buyShopEntry(rich, { entryId: 'fs_gem' }, ctx(now), FESTIVAL_RULES));
    expect(gem.wallet).toMatchObject({ gems: 1, eventTokens: 80 });
    expect(err(buyShopEntry(gem, { entryId: 'fs_potion_healing' }, ctx(quietDay() * DAY_MS), FESTIVAL_RULES))).toBe('FESTIVAL_CLOSED');
  });

  it('the whole loop through the world: an action pays tokens at settle, the shop is bought through the action', () => {
    const day = festivalDay('fest_harvest');
    const now = day * DAY_MS + 10 * HOUR_MS;
    const before = world(now);
    const settled = GOALS.settle(before, before, [harvested(12)], ctx(now));
    expect(settled.state.wallet.eventTokens).toBe(2);
    expect(settled.events).toContainEqual({ type: 'FESTIVAL_TOKENS', festivalId: 'fest_harvest', tokens: 2 });
    const bought = GOALS.buyFestivalItem('fs_fertilizer')({ ...settled.state, wallet: { ...settled.state.wallet, eventTokens: 5 } }, ctx(now));
    expect(bought.ok && bought.state.inventory.items.item_fertilizer).toBe((settled.state.inventory.items.item_fertilizer ?? 0) + 5);
    expect(AREAS.toWorldEvents([])).toEqual([]);
  });
});

describe('the visiting merchant', () => {
  const day = (pred: (d: number) => boolean) => Array.from({ length: 80 }, (_, i) => 20_000 + i).find(pred)!;

  it('comes on some days, always the same ones, and the market follows: the group he wants pays more', () => {
    const visits = Array.from({ length: 400 }, (_, i) => merchantVisits(19_000 + i, MERCHANT_RULES));
    const share = visits.filter(Boolean).length / visits.length;
    expect(share).toBeGreaterThan(MERCHANT_RULES.visitChance - 0.1);
    expect(share).toBeLessThan(MERCHANT_RULES.visitChance + 0.1);
    expect(visits).toEqual(Array.from({ length: 400 }, (_, i) => merchantVisits(19_000 + i, MERCHANT_RULES)));
    const here = day((d) => merchantVisits(d, MERCHANT_RULES));
    const away = day((d) => !merchantVisits(d, MERCHANT_RULES));
    const m = dailyMarket(here, MARKET_RULES);
    const plain = dailyMarket(here, { up: MARKET_RULES.up, down: MARKET_RULES.down });
    expect(m.merchant).toBe(merchantWants(here));
    expect(m.factors[m.merchant!]).toBeCloseTo(plain.factors[m.merchant!] + MERCHANT_RULES.demandBonus, 10);
    expect(dailyMarket(away, MARKET_RULES).merchant).toBeNull();
    expect(dailyMarket(away, MARKET_RULES).factors).toEqual(dailyMarket(away, { up: MARKET_RULES.up, down: MARKET_RULES.down }).factors);
  });

  const view = { worldLevel: 8, worldDevelopment: 20, unlockedAreas: ['sobi_farm', 'sobi_garden', 'sobi_aquarium'] };
  const ORDERS = GOALS.rules.orders;

  it('makes his orders once a day and keeps them: they pay more than the board, and are the same however they are reached', () => {
    const d = day((x) => merchantVisits(x, MERCHANT_RULES));
    const live = advanceMerchant(initialLive(), d, d * DAY_MS, view, ORDERS, itemValue, MERCHANT_RULES);
    expect(live.merchant).toMatchObject({ day: d, present: true });
    expect(live.merchant.offers).toHaveLength(MERCHANT_RULES.offers.count);
    expect(live.merchant.done).toEqual([false, false, false]);
    expect(advanceMerchant(live, d, d * DAY_MS + 5 * HOUR_MS, { ...view, worldLevel: 20 }, ORDERS, itemValue, MERCHANT_RULES)).toBe(live); // kept all day
    expect(advanceMerchant(initialLive(), d, d * DAY_MS + 9 * HOUR_MS, view, ORDERS, itemValue, MERCHANT_RULES).merchant.offers.map((o) => o.lines)).toEqual(live.merchant.offers.map((o) => o.lines));
    for (const o of live.merchant.offers) {
      const worth = o.lines.reduce((n, l) => n + l.qty * itemValue(l.itemId), 0);
      expect(o.coins).toBe(Math.max(1, Math.round(worth * MERCHANT_RULES.offers.rewardMultiplier)));
      expect(o.coins).toBeGreaterThanOrEqual(Math.round(worth * ORDERS.rewardMultiplier));
    }
    // He leaves the next day (and a day he does not come has no orders).
    const gone = day((x) => !merchantVisits(x, MERCHANT_RULES));
    expect(advanceMerchant(live, gone, gone * DAY_MS, view, ORDERS, itemValue, MERCHANT_RULES).merchant).toMatchObject({ day: gone, present: false, offers: [] });
    // The Admin's switch brings him on any day.
    const forced = { ...initialLive(), dev: { ...initialLive().dev, merchant: true } };
    expect(advanceMerchant(forced, gone, gone * DAY_MS, view, ORDERS, itemValue, MERCHANT_RULES).merchant.present).toBe(true);
  });

  it('takes an order: items out, coins, XP and a festival token in, once', () => {
    const d = day((x) => merchantVisits(x, MERCHANT_RULES));
    const now = d * DAY_MS + 6 * HOUR_MS;
    let w = world(now);
    w = { ...w, live: advanceMerchant(w.live, d, now, view, ORDERS, itemValue, MERCHANT_RULES) };
    const offer = w.live.merchant.offers[0]!;
    const stock = Object.fromEntries(offer.lines.map((l) => [l.itemId, l.qty]));
    const addXp = (s: WorldSave, xp: number) => ({ state: { ...s, progression: { ...s.progression, areas: { ...s.progression.areas, sobi_farm: { xp: (s.progression.areas.sobi_farm?.xp ?? 0) + xp } } } }, events: [] });
    expect(err(deliverOffer(w, { index: 0 }, ctx(now), MERCHANT_RULES, addXp))).toBe('INSUFFICIENT_ITEM');
    const stocked = { ...w, inventory: { items: { ...w.inventory.items, ...stock } } };
    const done = ok(deliverOffer(stocked, { index: 0 }, ctx(now), MERCHANT_RULES, addXp));
    expect(done.wallet.coins).toBe(stocked.wallet.coins + offer.coins);
    expect(done.wallet.eventTokens).toBe(MERCHANT_RULES.offers.tokens);
    expect(done.live.merchant.done).toEqual([true, false, false]);
    for (const l of offer.lines) expect(done.inventory.items[l.itemId] ?? 0).toBeLessThanOrEqual((stocked.inventory.items[l.itemId] ?? 0) - l.qty + (offer.bonus?.itemId === l.itemId ? offer.bonus.qty : 0));
    expect(err(deliverOffer(done, { index: 0 }, ctx(now), MERCHANT_RULES, addXp))).toBe('ALREADY_CLAIMED');
    expect(err(deliverOffer(done, { index: 9 }, ctx(now), MERCHANT_RULES, addXp))).toBe('ORDER_NOT_FOUND');
    // The next day his orders are gone with him.
    expect(err(deliverOffer(done, { index: 1 }, ctx(now + DAY_MS), MERCHANT_RULES, addXp))).toBe('MERCHANT_AWAY');
  });

  it('the settle step brings him in at the start of his day, and the screen shows what he wants', () => {
    const d = day((x) => merchantVisits(x, MERCHANT_RULES));
    const now = d * DAY_MS + 7 * HOUR_MS;
    const w0 = world(now);
    const settled = GOALS.settle(w0, w0, [], ctx(now));
    expect(settled.state.live.merchant).toMatchObject({ day: d, present: true });
    const vm = merchantVm(settled.state, now, 0, (i) => GOALS.deliverMerchant(i));
    expect(vm.present).toBe(true);
    expect(vm.offers).toHaveLength(MERCHANT_RULES.offers.count);
    expect(vm.demand).not.toBeNull();
    expect(vm.offers[0]!.deliver.reason).not.toBeNull(); // nothing in the bag
    const away = day((x) => !merchantVisits(x, MERCHANT_RULES));
    const idle = merchantVm(world(away * DAY_MS), away * DAY_MS, 0, (i) => GOALS.deliverMerchant(i));
    expect(idle.present).toBe(false);
    expect(idle.offers).toEqual([]);
  });
});

describe('the screens', () => {
  it('the weather card tells today and tomorrow with what each gives', () => {
    const d = dayWith('rainy');
    const now = d * DAY_MS + HOUR_MS;
    const vm = weatherVm(world(now), now, 0);
    expect(vm.today.id).toBe('rainy');
    expect(vm.tomorrow.id).toBe(weatherOfDay(d + 1, R));
    expect(vm.today.effect).toContain('25%');
    expect(weatherNow(withLive(world(now), { weather: 'snowy' }), now, 0)).toBe('snowy');
  });

  it('the festival screen shows the day, the stock with why a button is off, and the next festival when none runs', () => {
    const d = festivalDay('fest_fish', 1);
    const now = d * DAY_MS + HOUR_MS;
    const vm = festivalVm(world(now), now, 0);
    expect(vm.active?.id).toBe('fest_fish');
    expect(vm.active?.dayText).toContain('2/4');
    expect(vm.active?.gift.reason).toBeNull();
    expect(vm.active?.shop.every((r) => r.buy.reason !== null)).toBe(true); // no tokens yet
    const rich = festivalVm({ ...world(now), wallet: { coins: 0, gems: 0, eventTokens: 99 } }, now, 0);
    expect(rich.active?.shop.some((r) => r.buy.reason === null)).toBe(true);
    const q = quietDay();
    const quiet = festivalVm(world(q * DAY_MS), q * DAY_MS, 0);
    expect(quiet.active).toBeNull();
    expect(quiet.next).toContain('Lễ hội');
  });
});

describe('save v11', () => {
  it('a new world has the living world at rest, and it round-trips through the codec', () => {
    const w = world(20_000 * DAY_MS);
    expect(w.schemaVersion).toBe(WORLD_SAVE_VERSION);
    expect(w.live).toEqual(initialLive());
    const parsed = migrate(JSON.parse(JSON.stringify(w)), SAVE_CODEC);
    expect(parsed.ok && parsed.save).toEqual(w);
  });

  it('a v10 save is upgraded without losing anything it had', () => {
    const w = world(20_000 * DAY_MS);
    const rich: WorldSave = { ...w, wallet: { coins: 1234, gems: 7, eventTokens: 0 }, inventory: { items: { item_manure: 9 } } };
    const v10 = JSON.parse(JSON.stringify({ ...rich, schemaVersion: 10 })) as Record<string, unknown>;
    delete v10.live;
    const r = migrate(v10, SAVE_CODEC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fromVersion).toBe(10);
    expect(r.save.schemaVersion).toBe(11);
    expect(r.save.live).toEqual(initialLive());
    expect(r.save.wallet).toEqual(rich.wallet);
    expect(r.save.inventory).toEqual(rich.inventory);
    expect(r.save.areas).toEqual(rich.areas);
  });
});
