// Sobi Farm as an Area (ARCHITECTURE §5 Area Contract): manifest (content/farm/area.json) and hooks.
// The app registers it in core/area-registry; nothing outside this folder knows how pigs work.
import type { AreaModule, SummaryLine } from '../../core/area-registry/registry';
import type { EventBase } from '../../core/events';
import { areaXp } from '../../core/progression/levels';
import { FARM_CONTENT } from './logic/config/content';
import { levelFromXp } from './logic/config/levels';
import type { GameEvent } from './logic/events';
import { farmSaveSpec, initFarm } from './logic/save/farmSave';
import { FARM_AREA_ID } from './logic/save/lens';
import { advanceFarmWorld, farmSimulatedAt } from './logic/world';
import { farmEventsToWorld } from './logic/worldEvents';

const COUNTED: readonly [GameEvent['type'], string][] = [
  ['BIRTH', 'summary.farm.births'],
  ['PIG_BECAME_ADULT', 'summary.farm.grown'],
  ['PIG_BECAME_SICK', 'summary.farm.sick'],
  ['ORDER_NEW', 'summary.farm.orders'],
  ['GIFT_SPAWNED', 'summary.farm.gifts'],
];

/** Away-screen lines: how many of each notable thing happened (i18n `summary.farm`). */
function farmSummary(events: readonly EventBase[]): SummaryLine[] {
  return COUNTED.flatMap(([type, key]) => {
    const count = events.filter((e) => e.type === type).length;
    return count > 0 ? [{ key, params: { count } }] : [];
  });
}

export const farmArea: AreaModule = {
  manifest: FARM_CONTENT.area,
  save: farmSaveSpec,
  init: initFarm,
  // One formula for every mode (ARCHITECTURE §6); Sobi Farm's rules have no death to hold back.
  simulate: (world, now, rng, dayOffsetMs) => advanceFarmWorld(world, now, rng, dayOffsetMs),
  simulatedAt: farmSimulatedAt,
  level: (world) => levelFromXp(areaXp(world, FARM_AREA_ID)),
  toWorldEvents: farmEventsToWorld,
  getSummary: farmSummary,
};
