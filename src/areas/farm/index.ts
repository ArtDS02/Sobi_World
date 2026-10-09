// Sobi Farm as an Area (ARCHITECTURE §5 Area Contract): manifest (content/farm/area.json) and hooks.
// The app registers it in core/area-registry; nothing outside this folder knows how pigs work.
import type { AreaModule } from '../../core/area-registry/registry';
import { areaXp } from '../../core/progression/levels';
import { FARM_CONTENT } from './logic/config/content';
import { levelFromXp } from './logic/config/levels';
import type { GameEvent } from './logic/events';
import { farmSaveSpec, initFarm } from './logic/save/farmSave';
import { FARM_AREA_ID, farmOf } from './logic/save/lens';
import { farmStage } from './stage';
import { farmSummaryLines } from './logic/summary';
import { advanceFarmWorld, farmSimulatedAt, rebaseFarm } from './logic/world';
import { farmEventsToWorld } from './logic/worldEvents';

export const farmArea: AreaModule = {
  manifest: FARM_CONTENT.area,
  save: farmSaveSpec,
  init: initFarm,
  // One formula for every mode (ARCHITECTURE §6); the mode only holds back death during a catch-up.
  simulate: (world, now, rng, dayOffsetMs, mode) => advanceFarmWorld(world, now, rng, dayOffsetMs, mode),
  simulatedAt: farmSimulatedAt,
  rebase: rebaseFarm,
  level: (world) => levelFromXp(areaXp(world, FARM_AREA_ID)),
  toWorldEvents: farmEventsToWorld,
  getSummary: (events, world, now) => farmSummaryLines(events as GameEvent[], farmOf(world), now),
  // Presentation only (GĐ3): the numbers run the same whether the player is here or not.
  onEnter: farmStage.enter,
  onExit: farmStage.exit,
};
