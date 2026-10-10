// What the farm suggests the player do now (AreaModule.suggest): the chip "next step" of the HUD. Care that cannot
// wait comes first (a critical pig, a dry trough), then what is ready (a pig to ship, piles to rake). Pure.
import type { Suggestion } from '../../../core/area-registry/registry';
import { BOND } from '../../../core/config/bond';
import { petsLeft } from '../../../systems/bond/bond';
import { gameDay } from '../../../systems/health/disease';
import { BALANCE } from './config/balance';
import { isPet } from './bond';
import { pigStage } from './mortality';
import type { FarmGame } from './types';

const LOW_TROUGH = 0.25;

export function farmSuggestions(farm: FarmGame, now: number, dayOffsetMs = 0): Suggestion[] {
  const out: Suggestion[] = [];
  const waiting = farm.nursery.length;
  if (farm.pigs.length === 0 && waiting === 0) {
    return [{ key: 'suggest.farm.buyPig', priority: 90, goto: { target: 'panel', id: 'shop' } }];
  }
  const ill = farm.pigs.filter((p) => p.isSick);
  const critical = ill.filter((p) => pigStage(p, now) !== 'ill');
  if (critical.length > 0) out.push({ key: 'suggest.farm.critical', params: { name: critical[0]!.name }, priority: 95, tone: 'alert', goto: { target: 'pig', id: critical[0]!.id } });
  const mild = ill.find((p) => !critical.includes(p));
  if (mild) out.push({ key: 'suggest.farm.treat', params: { name: mild.name }, priority: 85, tone: 'warn', goto: { target: 'pig', id: mild.id } });
  if (farm.pigs.length > 0) {
    if (farm.trough.food <= 0) out.push({ key: 'suggest.farm.fillTrough', priority: 88, tone: 'warn', goto: { target: 'trough' } });
    else if (farm.trough.food / Math.max(1, farm.trough.capacity) < LOW_TROUGH) out.push({ key: 'suggest.farm.troughLow', priority: 60, goto: { target: 'trough' } });
  }
  if (waiting > 0) out.push({ key: 'suggest.farm.nursery', params: { count: waiting }, priority: 55, goto: { target: 'panel', id: 'inventory' } });
  if ((farm.manure ?? 0) >= 3) out.push({ key: 'suggest.farm.rake', params: { count: farm.manure! }, priority: 45, goto: { target: 'well' } });
  const ready = farm.pigs.find((p) => p.growthProgress >= BALANCE.STAGE_ADULT_AT && !p.isSick && p.pregnancy === null && !isPet(p));
  if (ready) out.push({ key: 'suggest.farm.ship', params: { name: ready.name }, priority: 40, goto: { target: 'pig', id: ready.id } });
  if (farm.gifts.boxes.length > 0) out.push({ key: 'suggest.farm.gift', priority: 30 });
  const day = gameDay(now, dayOffsetMs);
  const lonely = farm.pigs.find((p) => petsLeft(p, day, BOND) > 0);
  if (lonely) out.push({ key: 'suggest.farm.pet', params: { name: lonely.name }, priority: 10, goto: { target: 'pig', id: lonely.id } });
  return out;
}
