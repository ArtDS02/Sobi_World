// Pure view-models: SaveGame → display strings. No DOM, so they are unit-tested directly.
import { BALANCE } from '../core/config/balance';
import { BREEDS } from '../core/config/breeds';
import { DAY_NIGHT } from '../core/config/dayNight';
import { levelFromXp } from '../core/config/levels';
import { formatHm, minuteOf, phaseAt } from '../core/engine/dayNight';
import {
  freeSlots,
  generationOf,
  growthStage,
  pigCapacity,
  waitingPigs,
  weight,
} from '../core/engine/derived';
import { happiness } from '../core/engine/happiness';
import { diseaseState, type DiseaseState } from '../core/engine/pigHealth';
import { sellMultiplier } from '../core/engine/pricing';
import type { Pig, SaveGame } from '../core/types';
import { formatDateTime, formatDec, formatDuration, formatInt, t } from '../i18n/format';
import { vi } from '../i18n/vi';

export interface TopBarVm {
  level: string;
  xp: string;
  /** 0-100 progress from the current level's threshold to the next one. */
  xpProgress: number;
  gold: string;
  /** The number alone ("2.876"); the HUD pill adds vi.hud.goldUnit, hidden on short screens. */
  goldAmount: string;
  trough: string;
  /** "18/20" for the trough pill. */
  troughShort: string;
  /** 0-100 trough fill. */
  troughProgress: number;
  /** Pig count pill (PS-1): "8/20", its tooltip, and full = no free slot (reserved included). */
  pigs: string;
  pigsTitle: string;
  pigsFull: boolean;
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
    goldAmount: formatInt(gold),
    trough: food <= 0 ? vi.hud.troughEmpty : t(vi.hud.trough, { food, capacity }),
    troughShort: t(vi.hud.troughShort, { food, capacity }),
    troughProgress: capacity > 0 ? Math.round((food / capacity) * 100) : 0,
    troughEmpty: food <= 0,
    ...pigsVm(save),
  };
}

function pigsVm(save: SaveGame): Pick<TopBarVm, 'pigs' | 'pigsTitle' | 'pigsFull'> {
  const count = save.pigs.length;
  const max = pigCapacity(save);
  const reserved = waitingPigs(save);
  const full = freeSlots(save) <= 0;
  const title = [
    t(vi.hud.pigsTitle, { count, max }),
    reserved > 0 ? t(vi.hud.pigsReserved, { n: reserved }) : '',
    full ? vi.hud.pigsFull : '',
  ];
  return {
    pigs: t(vi.hud.pigs, { count, max }),
    pigsTitle: title.filter(Boolean).join(' · '),
    pigsFull: full,
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

/** lastTickedAt is the last world tick (≤ 1 s old), good enough for a label. */
const HEALTH_TEXT: Record<DiseaseState, string> = {
  healthy: vi.stat.healthy,
  ill: vi.stat.sick,
  recovering: vi.stat.recovering,
};

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
    health: HEALTH_TEXT[diseaseState(pig, pig.lastTickedAt)],
    isSick: pig.isSick,
    isPregnant: pig.pregnancy !== null,
  };
}

export interface PigPanelVm extends PigCardVm {
  gender: string;
  growthValue: number; // 0-100 for the bar
  weight: string;
  /** "Thế hệ 2" (PS-2). */
  generation: string;
  /** "Con của Heo Trắng × Heo Đen" for a bred pig (BR-1), null for shop pigs. */
  parents: string | null;
  happiness: string;
  priceMultiplier: string;
  pregnancy: string | null;
}

/** `decorBonus`: the farm's decoration bonus (engine/decor.ts), part of happiness (PG-3). */
export function pigPanelVm(pig: Pig, now: number, decorBonus = 0): PigPanelVm {
  const happy = happiness(pig, decorBonus);
  return {
    ...pigCardVm(pig),
    gender: vi.gender[pig.gender],
    growthValue: pig.growthProgress,
    weight: t(vi.ui.weightKg, { n: formatInt(weight(pig)) }),
    generation: t(vi.ui.generation, { n: generationOf(pig) }),
    parents: pig.parents
      ? t(vi.nursery.parents, {
          mother: BREEDS[pig.parents.motherBreed].nameVi,
          father: BREEDS[pig.parents.fatherBreed].nameVi,
        })
      : null,
    happiness: String(happy),
    priceMultiplier: t(vi.stat.priceMultiplier, { mult: formatDec(sellMultiplier(happy)) }),
    pregnancy: pig.pregnancy
      ? t(vi.stat.pregnantLeft, { time: formatDuration(pig.pregnancy.endsAt - now) })
      : null,
  };
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

export interface ClockVm {
  icon: string;
  time: string;
  phase: string;
}

/**
 * HUD clock (DN): local time and the phase icon, or null when day / night is off. Reads the given
 * `now` in the device time zone (the same clock the farm lighting uses).
 */
export function clockVm(now: number): ClockVm | null {
  if (!DAY_NIGHT.enabled) return null;
  const d = new Date(now);
  const minute = minuteOf(d.getHours(), d.getMinutes());
  const phase = vi.dayPhase[phaseAt(minute, DAY_NIGHT)];
  return { icon: phase.icon, time: formatHm(minute), phase: phase.name };
}
