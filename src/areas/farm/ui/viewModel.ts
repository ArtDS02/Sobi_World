// Pure view-models: FarmGame → display strings. No DOM, so they are unit-tested directly.
import { BREEDS } from '../logic/config/breeds';
import { DAY_NIGHT } from '../../../core/config/dayNight';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress } from '../../../core/progression/levels';
import { formatHm, minuteOf, phaseAt } from '../../../core/engine/dayNight';
import {
  freeSlots,
  generationOf,
  growthStage,
  pigCapacity,
  waitingPigs,
  weight,
} from '../logic/derived';
import { happiness } from '../logic/happiness';
import { diseaseState } from '../logic/pigHealth';
import { pigStage } from '../logic/mortality';
import { HEALTH } from '../../../core/config/health';
import type { HealthStage } from '../../../systems/health/disease';
import { pigQuality } from '../logic/pricing';
import { QUALITY_RULES } from '../../../systems/quality/quality';
import type { Pig, FarmGame } from '../logic/types';
import { formatDateTime, formatDec, formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';

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
  /** Pigs that are ill: the worst-first pig to look at and the text of the HUD alert (null = all well). */
  alert: { text: string; critical: boolean; pigId: string } | null;
}

/** The HUD alert for ill pigs (GĐ2): critical ones first. `now` defaults to the pigs' last tick. */
function alertVm(save: FarmGame, now: number): TopBarVm['alert'] {
  const ill = save.pigs.filter((p) => p.isSick);
  if (ill.length === 0) return null;
  const critical = ill.filter((p) => pigStage(p, now) !== 'ill');
  if (critical.length > 0) return { text: t(vi.hud.alertCritical, { count: critical.length }), critical: true, pigId: critical[0]!.id };
  return { text: t(vi.hud.alertSick, { count: ill.length }), critical: false, pigId: ill[0]!.id };
}

export function topBarVm(save: FarmGame, now = Math.max(0, ...save.pigs.map((p) => p.lastTickedAt))): TopBarVm {
  const { xp, gold } = save.player;
  const { level, floor, next: nextXp, percent: xpProgress } = levelProgress(xp, WORLD_LEVELS);
  const next = nextXp ?? floor; // displays as capped (§8.16): the bar reads full at the top level
  const shownXp = nextXp === null ? floor : xp;
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
    alert: alertVm(save, now),
    ...pigsVm(save),
  };
}

function pigsVm(save: FarmGame): Pick<TopBarVm, 'pigs' | 'pigsTitle' | 'pigsFull'> {
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
const HEALTH_TEXT: Record<HealthStage, string> = {
  healthy: vi.stat.healthy,
  ill: vi.stat.sick,
  recovering: vi.stat.recovering,
  critical: vi.stat.critical,
  dead: vi.stat.critical, // past its time but held back by the catch-up grace: still treatable
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
    health: HEALTH_TEXT[pigStage(pig, pig.lastTickedAt) === 'healthy' ? diseaseState(pig, pig.lastTickedAt) : pigStage(pig, pig.lastTickedAt)],
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
  quality: string;
  pregnancy: string | null;
  /** A warning for an ill pig: when it turns critical, or how long it has left (null = well). */
  warning: string | null;
}

/** `decorBonus`: the farm's decoration bonus (engine/decor.ts), part of happiness (PG-3). */
function warningText(pig: Pig, now: number): string | null {
  if (!pig.isSick || pig.lastSickAt === undefined) return null;
  const ill = now - pig.lastSickAt;
  if (ill < HEALTH.criticalAfterMs) return t(vi.stat.warnSick, { time: formatDuration(HEALTH.criticalAfterMs - ill) });
  return t(vi.stat.warnCritical, { time: formatDuration(Math.max(0, HEALTH.deathAfterMs - ill)) });
}

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
    quality: ((q) => t(vi.stat.quality, { quality: vi.quality[q], mult: formatDec(QUALITY_RULES.priceFactor[q]) }))(pigQuality(pig, decorBonus)),
    pregnancy: pig.pregnancy
      ? t(vi.stat.pregnantLeft, { time: formatDuration(pig.pregnancy.endsAt - now) })
      : null,
    warning: warningText(pig, now),
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
export function historyVm(save: FarmGame): HistoryRowVm[] {
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
