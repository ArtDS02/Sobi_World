// Pure view-models: SaveGame → display strings. No DOM, so they are unit-tested directly.
import { BALANCE } from '../core/config/balance';
import { BREEDS } from '../core/config/breeds';
import { levelFromXp } from '../core/config/levels';
import { growthStage, weight } from '../core/engine/derived';
import { happiness } from '../core/engine/happiness';
import { sellMultiplier } from '../core/engine/pricing';
import type { GameEvent } from '../core/events';
import type { Pig, SaveGame } from '../core/types';
import { formatDateTime, formatDec, formatDuration, formatInt, t } from '../i18n/format';
import { vi } from '../i18n/vi';

export interface TopBarVm {
  level: string;
  xp: string;
  /** 0-100 progress from the current level's threshold to the next one. */
  xpProgress: number;
  gold: string;
  trough: string;
  troughEmpty: boolean;
}

export function topBarVm(save: SaveGame): TopBarVm {
  const { xp, gold } = save.player;
  const level = levelFromXp(xp);
  const next = BALANCE.LEVEL_XP[Math.min(level, BALANCE.MAX_LEVEL - 1)] ?? xp;
  const shownXp = level >= BALANCE.MAX_LEVEL ? next : xp; // displays as capped (§8.16)
  const floor = BALANCE.LEVEL_XP[level - 1] ?? 0;
  const xpProgress =
    level >= BALANCE.MAX_LEVEL ? 100 : Math.floor(((xp - floor) / (next - floor)) * 100);
  const { food, capacity } = save.trough;
  return {
    level: t(vi.hud.level, { level }),
    xp: t(vi.hud.xp, { current: formatInt(shownXp), next: formatInt(next) }),
    xpProgress,
    gold: t(vi.hud.gold, { amount: formatInt(gold) }),
    trough: food <= 0 ? vi.hud.troughEmpty : t(vi.hud.trough, { food, capacity }),
    troughEmpty: food <= 0,
  };
}

export interface PigCardVm {
  id: string;
  name: string;
  breed: string;
  stage: string;
  growth: string;
  hunger: string;
  cleanliness: string;
  health: string;
  isSick: boolean;
  isPregnant: boolean;
}

const pct = (n: number) => t(vi.ui.percent, { n: Math.floor(n) });

export function pigCardVm(pig: Pig): PigCardVm {
  return {
    id: pig.id,
    name: pig.name,
    breed: BREEDS[pig.breed].nameVi,
    stage: vi.stage[growthStage(pig.growthProgress)],
    growth: pct(pig.growthProgress),
    hunger: pct(pig.hunger),
    cleanliness: pct(pig.cleanliness),
    health: pig.isSick ? vi.stat.sick : vi.stat.healthy,
    isSick: pig.isSick,
    isPregnant: pig.pregnancy !== null,
  };
}

export interface PigPanelVm extends PigCardVm {
  gender: string;
  growthValue: number; // 0-100 for the bar
  weight: string;
  happiness: string;
  priceMultiplier: string;
  pregnancy: string | null;
}

export function pigPanelVm(pig: Pig, now: number): PigPanelVm {
  const happy = happiness(pig);
  return {
    ...pigCardVm(pig),
    gender: vi.gender[pig.gender],
    growthValue: pig.growthProgress,
    weight: t(vi.ui.weightKg, { n: formatInt(weight(pig)) }),
    happiness: String(happy),
    priceMultiplier: t(vi.stat.priceMultiplier, { mult: formatDec(sellMultiplier(happy)) }),
    pregnancy: pig.pregnancy
      ? t(vi.stat.pregnantLeft, { time: formatDuration(pig.pregnancy.endsAt - now) })
      : null,
  };
}

/**
 * Toast text for an event, or null when it has no toast. `before` is the state before the
 * dispatch so sold pigs can still be named.
 */
export function eventToast(event: GameEvent, after: SaveGame, before: SaveGame): string | null {
  const nameOf = (id: string) =>
    (after.pigs.find((p) => p.id === id) ?? before.pigs.find((p) => p.id === id))?.name ?? '';
  switch (event.type) {
    case 'PIG_BECAME_SICK':
      return t(vi.event.becameSick, { name: nameOf(event.pigId) });
    case 'PIG_BECAME_ADULT':
      return t(vi.event.becameAdult, { name: nameOf(event.pigId) });
    case 'PIG_HUNGRY_ZERO':
      return event.stalled ? t(vi.event.hungryZero, { name: nameOf(event.pigId) }) : null;
    case 'BIRTH':
      return t(vi.event.birth, { mother: nameOf(event.motherId), child: nameOf(event.childId) });
    case 'TROUGH_EMPTY':
      return vi.event.troughEmpty;
    case 'LEVEL_UP':
      return t(vi.event.levelUp, { level: event.level });
    case 'DISCOVERY': {
      const name = event.kind === 'BREED' ? BREEDS[event.id as Pig['breed']].nameVi : event.id;
      return t(vi.event.discovery, { name, gold: formatInt(event.gold) });
    }
    case 'ORDER_NEW':
      return vi.event.orderNew;
    case 'ORDER_EXPIRED':
      return vi.event.orderExpired;
    case 'PIG_SOLD':
      return t(vi.event.sold, { name: nameOf(event.pigId), gold: formatInt(event.gold) });
    case 'ORDER_FULFILLED':
      return t(vi.event.orderFulfilled, { gold: formatInt(event.gold) });
    case 'SLOT_BOUGHT':
      return null; // action feedback goes through FeedbackDirector (R05B)
  }
}

/** Signed gold as in the transaction: +500 vàng / -2.000 vàng. */
export function signedGold(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return t(vi.hud.gold, { amount: `${sign}${formatInt(Math.abs(amount))}` });
}

export interface HistoryRowVm {
  id: string;
  label: string;
  amount: string;
  tone: 'plus' | 'minus' | 'zero';
  at: string;
}

/** Transactions newest first (the save keeps them newest first, at most 200; DECISIONS Q7). */
export function historyVm(save: SaveGame): HistoryRowVm[] {
  return save.transactions.map((tx) => ({
    id: tx.id,
    label: vi.history[tx.type],
    amount: signedGold(tx.amount),
    tone: tx.amount > 0 ? 'plus' : tx.amount < 0 ? 'minus' : 'zero',
    at: formatDateTime(tx.at),
  }));
}
