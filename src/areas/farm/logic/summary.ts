// The farm's lines for the "while you were away" screen (AreaModule.getSummary, spec §5): what happened
// (counted from the catch-up's events) and what needs the player now (read from the farm), each with
// the place to go. Lines are string-table keys with parameters; the screen turns them into text. Pure.
import type { SummaryLine } from '../../../core/area-registry/registry';
import type { GameEvent } from './events';
import { pigStage } from './mortality';
import type { FarmGame } from './types';

/** Where a line's button leads (the farm UI interprets it). */
export type FarmGoto = { target: 'pig'; id: string } | { target: 'trough' } | { target: 'well' } | { target: 'orders' };

const COUNTED: readonly [GameEvent['type'], string][] = [
  ['BIRTH', 'summary.farm.births'],
  ['PIG_BECAME_ADULT', 'summary.farm.grown'],
  ['PIG_BECAME_SICK', 'summary.farm.sick'],
  ['PIG_BECAME_CRITICAL', 'summary.farm.critical'],
  ['PIG_DIED', 'summary.farm.died'],
  ['ORDER_NEW', 'summary.farm.orders'],
  ['ORDER_EXPIRED', 'summary.farm.ordersExpired'],
];

export function farmSummaryLines(events: readonly GameEvent[], farm: FarmGame, now: number): SummaryLine[] {
  const counted: SummaryLine[] = COUNTED.flatMap(([type, key]) => {
    const count = events.filter((e) => e.type === type).length;
    return count > 0 ? [{ key, params: { count } }] : [];
  });
  const gifts = events.some((e) => e.type === 'GIFT_SPAWNED') ? farm.gifts.boxes.length : 0;

  // What needs the player now, worst first: critical pigs, then ill ones, then the pen.
  const ill = farm.pigs.filter((p) => p.isSick);
  const critical = ill.filter((p) => pigStage(p, now) !== 'ill');
  const needs: SummaryLine[] = [];
  if (critical.length > 0) {
    needs.push({ key: 'summary.farm.needCritical', params: { count: critical.length }, tone: 'alert', goto: { target: 'pig', id: critical[0]!.id } });
  }
  const mild = ill.length - critical.length;
  if (mild > 0) {
    needs.push({ key: 'summary.farm.needTreat', params: { count: mild }, tone: 'warn', goto: { target: 'pig', id: ill.find((p) => !critical.includes(p))!.id } });
  }
  if ((farm.manure ?? 0) > 0) {
    needs.push({ key: 'summary.farm.needRake', params: { count: farm.manure! }, goto: { target: 'well' } });
  }
  if (gifts > 0) counted.push({ key: 'summary.farm.gifts', params: { count: gifts } });
  return [...needs, ...counted];
}
