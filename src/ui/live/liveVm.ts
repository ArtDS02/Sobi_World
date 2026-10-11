// View-models of the living world's screens (GĐ12): the weather card, the festival with its shop, the merchant's orders. Pure
// (no DOM): availability comes from dry-running the real actions on the save, so a disabled button says what dispatch would say.
import type { ErrorCode } from '../../core/config/errors';
import type { ItemId } from '../../core/config/ids';
import { FESTIVAL_RULES, FESTIVALS, MERCHANT_RULES } from '../../core/config/live';
import { WEATHER_RULES } from '../../core/config/weather';
import { DAY_MS } from '../../core/clock';
import { buyShopEntry, canClaimGift, claimGift, festivalProgress, festivalRun, boughtInRun, liveFestival, nextFestival, shopOf } from '../../core/live/festival';
import { merchantVisits, merchantWants } from '../../core/live/visit';
import type { WorldAction } from '../../core/goals/api';
import { missingLines } from '../../core/goals/orders';
import { mulberry32 } from '../../core/rng';
import type { WorldSave } from '../../core/save/world';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { forecastNow } from '../../systems/weather/live';
import type { WeatherId } from '../../systems/weather/weather';

const itemName = (id: string): string => (vi.shop as Record<string, string>)[id] ?? id;
const dayAt = (now: number, offset: number): number => Math.floor((now + offset) / DAY_MS);

/** Placeholder pictures of the weather (art comes in GĐ14): one glyph each. */
export const WEATHER_GLYPH: Readonly<Record<WeatherId, string>> = { sunny: '☀', rainy: '☂', foggy: '☁', snowy: '❄', rainbow: '🌈' };

// ---- Weather ---------------------------------------------------------------------------------------------------

export interface WeatherCardVm {
  id: WeatherId;
  glyph: string;
  name: string;
  effect: string;
  label: string;
}

export function weatherCard(id: WeatherId, label: string): WeatherCardVm {
  const E = WEATHER_RULES.effects;
  const params = { percent: Math.round((E.rain.growthRate - 1) * 100), points: E.rainbow.mutationBoost };
  return { id, glyph: WEATHER_GLYPH[id], name: vi.weather.names[id], effect: t(vi.weather.effects[id], params), label };
}

export function weatherVm(world: WorldSave, now: number, dayOffsetMs: number): { today: WeatherCardVm; tomorrow: WeatherCardVm } {
  const f = forecastNow(world, now, dayOffsetMs);
  return { today: weatherCard(f.today, vi.weather.today), tomorrow: weatherCard(f.tomorrow, vi.weather.tomorrow) };
}

// ---- Festival --------------------------------------------------------------------------------------------------

export interface ShopRowVm {
  id: string;
  name: string;
  cost: string;
  /** "Còn 1/2 lượt…" or null when the entry has no limit. */
  limit: string | null;
  buy: { label: string; reason: string | null };
}

export interface FestivalVm {
  tokens: number;
  active: {
    id: string;
    name: string;
    desc: string;
    area: string;
    dayText: string;
    earned: string;
    gift: { label: string; reason: string | null };
    earn: string[];
    shop: ShopRowVm[];
  } | null;
  /** When none runs: the next one. */
  next: string | null;
}

const dry = (world: WorldSave, now: number, dayOffsetMs: number, run: WorldAction): ErrorCode | null => {
  const r = run(world, { now, rng: mulberry32(0), dayOffsetMs });
  return r.ok ? null : r.error;
};

export function festivalVm(world: WorldSave, now: number, dayOffsetMs: number): FestivalVm {
  const day = dayAt(now, dayOffsetMs);
  const fest = liveFestival(day, world.live.dev.festival, FESTIVAL_RULES);
  const tokens = world.wallet.eventTokens;
  if (!fest) {
    const next = nextFestival(day, FESTIVAL_RULES);
    const text = next.inDays === 1 ? vi.festival.nextTomorrow : vi.festival.next;
    return { tokens, active: null, next: t(text, { name: next.festival.nameVi, days: next.inDays }) };
  }
  const progress = festivalProgress(day, fest, FESTIVAL_RULES);
  const run = festivalRun(day, fest, FESTIVAL_RULES);
  const earnedToday = world.live.festival.earnDay === day ? world.live.festival.earnedToday : 0;
  const giftReason = canClaimGift(world, day, FESTIVAL_RULES) ? dry(world, now, dayOffsetMs, (w, c) => claimGift(w, c, FESTIVAL_RULES)) : 'ALREADY_CLAIMED';
  return {
    tokens,
    active: {
      id: fest.id,
      name: fest.nameVi,
      desc: fest.descVi,
      area: t(vi.festival.goTo, { area: vi.festival.areas[fest.area as keyof typeof vi.festival.areas] ?? fest.area }),
      dayText: t(vi.festival.dayOf, { day: progress.dayOf, length: FESTIVAL_RULES.lengthDays, left: progress.daysLeft }),
      earned: t(vi.festival.earned, { earned: earnedToday, cap: FESTIVAL_RULES.dailyCap }),
      gift: { label: giftReason === null ? t(vi.festival.gift, { tokens: FESTIVAL_RULES.dailyGift }) : vi.festival.giftDone, reason: giftReason ? vi.error[giftReason] : null },
      earn: fest.earn.map((r) => t(vi.festival.per, { what: t(vi.festival.earn[r.event], { per: r.per }), tokens: r.tokens })),
      shop: shopOf(fest, FESTIVAL_RULES).map((s): ShopRowVm => {
        const had = boughtInRun(world, s.id, run);
        const reason = dry(world, now, dayOffsetMs, (w, c) => buyShopEntry(w, { entryId: s.id }, c, FESTIVAL_RULES));
        return {
          id: s.id,
          name: s.reward.kind === 'item' ? `${itemName(s.reward.itemId)} x${s.reward.quantity}` : t(vi.festival.gems, { amount: s.reward.amount }),
          cost: t(vi.festival.cost, { cost: s.cost }),
          limit: s.limit === undefined ? null : t(vi.festival.limit, { left: Math.max(0, s.limit - had), limit: s.limit }),
          buy: { label: vi.festival.buy, reason: reason ? vi.error[reason] : null },
        };
      }),
    },
    next: null,
  };
}

export const festivalName = (id: string): string => FESTIVALS[id]?.nameVi ?? id;

// ---- Merchant --------------------------------------------------------------------------------------------------

export interface MerchantOfferVm {
  id: string;
  lines: { name: string; have: number; need: number; enough: boolean }[];
  reward: string;
  bonus: string | null;
  done: boolean;
  deliver: { label: string; reason: string | null };
}

export interface MerchantVm {
  name: string;
  greeting: string;
  present: boolean;
  /** What he says today, or when he comes back. */
  line: string;
  demand: string | null;
  offers: MerchantOfferVm[];
}

/** Days from `day` (exclusive) until the next visit, searching ten days ahead; null when none is in sight. */
const nextVisitIn = (day: number, forced: boolean | null): number | null => {
  for (let i = 1; i <= 10; i += 1) if (merchantVisits(day + i, MERCHANT_RULES, forced)) return i;
  return null;
};

export function merchantVm(world: WorldSave, now: number, dayOffsetMs: number, deliver: (index: number) => WorldAction): MerchantVm {
  const day = dayAt(now, dayOffsetMs);
  const m = world.live.merchant;
  const present = merchantVisits(day, MERCHANT_RULES, world.live.dev.merchant);
  const base = { name: MERCHANT_RULES.nameVi, greeting: MERCHANT_RULES.greetingVi, present };
  if (!present || m.day !== day || !m.present) {
    const inDays = nextVisitIn(day, world.live.dev.merchant);
    const line = inDays === null ? vi.merchant.unknownNext : inDays === 1 ? vi.merchant.nextTomorrow : t(vi.merchant.nextIn, { days: inDays });
    return { ...base, present: false, line: `${vi.merchant.away} ${line}`, demand: null, offers: [] };
  }
  const wants = merchantWants(day);
  const lines = MERCHANT_RULES.linesVi;
  return {
    ...base,
    line: lines[day % lines.length]!,
    demand: t(vi.merchant.demand, { group: vi.market.groups[wants], percent: Math.round(MERCHANT_RULES.demandBonus * 100) }),
    offers: m.offers.map((o, i): MerchantOfferVm => {
      const short = missingLines(o, world.inventory.items);
      const done = m.done[i] === true;
      const reason = done ? 'ALREADY_CLAIMED' : dry(world, now, dayOffsetMs, deliver(i));
      return {
        id: o.id,
        lines: o.lines.map((l) => ({ name: itemName(l.itemId), have: world.inventory.items[l.itemId] ?? 0, need: l.qty, enough: !short.some((s) => s.itemId === l.itemId) })),
        reward: t(MERCHANT_RULES.offers.tokens > 0 ? vi.merchant.reward : vi.merchant.rewardNoToken, { coins: formatInt(o.coins), xp: o.xp, tokens: MERCHANT_RULES.offers.tokens }),
        bonus: o.bonus ? t(vi.merchant.bonus, { item: itemName(o.bonus.itemId as ItemId), qty: o.bonus.qty }) : null,
        done,
        deliver: { label: done ? vi.merchant.done : vi.merchant.deliver, reason: reason ? (reason === 'INSUFFICIENT_ITEM' ? vi.merchant.missing : vi.error[reason]) : null },
      };
    }),
  };
}
