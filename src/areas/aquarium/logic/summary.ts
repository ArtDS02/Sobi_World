// The Aquarium's lines for the "while you were away" screen (AreaModule.getSummary, spec §5): what happened (counted
// from the catch-up's events) and what needs the player now (read from the tank). Pure.
import type { SummaryLine } from '../../../core/area-registry/registry';
import type { EventBase } from '../../../core/events';
import { fishHealth } from './fishLife';
import { isAquariumEvent, type AquariumEvent } from './events';
import type { AquariumState } from './state';

export const AQUARIUM_GOTO = { target: 'aquarium' } as const;

const count = (events: readonly AquariumEvent[], type: AquariumEvent['type']): number => events.filter((e) => e.type === type).length;

export function aquariumSummaryLines(all: readonly EventBase[], a: AquariumState, now: number): SummaryLine[] {
  const events = all.filter(isAquariumEvent);
  const critical = a.fish.filter((f) => fishHealth(f, now) === 'critical').length;
  const sick = a.fish.filter((f) => f.isSick).length - critical;
  const hungry = a.fish.filter((f) => f.hunger < 30).length;

  const needs: SummaryLine[] = [];
  if (critical > 0) needs.push({ key: 'summary.aquarium.needCritical', params: { count: critical }, tone: 'alert', goto: AQUARIUM_GOTO });
  if (sick > 0) needs.push({ key: 'summary.aquarium.needTreat', params: { count: sick }, tone: 'warn', goto: AQUARIUM_GOTO });
  if (a.tank.water < 35) needs.push({ key: 'summary.aquarium.needWater', tone: 'warn', goto: AQUARIUM_GOTO });
  if (hungry > 0) needs.push({ key: 'summary.aquarium.needFeed', params: { count: hungry }, goto: AQUARIUM_GOTO });
  if (a.tank.scales > 0) needs.push({ key: 'summary.aquarium.scales', params: { count: a.tank.scales }, goto: AQUARIUM_GOTO });

  const counted: SummaryLine[] = [];
  const hatched = count(events, 'AQUARIUM_EGG_HATCHED');
  const sickNow = count(events, 'AQUARIUM_FISH_SICK');
  const died = count(events, 'AQUARIUM_FISH_DIED');
  if (hatched > 0) counted.push({ key: 'summary.aquarium.hatched', params: { count: hatched } });
  if (sickNow > 0) counted.push({ key: 'summary.aquarium.sick', params: { count: sickNow } });
  if (died > 0) counted.push({ key: 'summary.aquarium.died', params: { count: died }, tone: 'alert' });
  return [...needs, ...counted];
}
