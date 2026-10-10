// Sobi Farm as an Area (ARCHITECTURE §5 Area Contract): manifest (content/farm/area.json) and hooks.
// The app registers it in core/area-registry; nothing outside this folder knows how pigs work.
import type { AreaModule } from '../../core/area-registry/registry';
import { BREEDS, BREED_IDS } from './logic/config/breeds';
import { codexTexts } from './logic/codexText';
import { vi } from '../../i18n/vi';
import { FARM_CONTENT } from './logic/config/content';
import { DECOR_IDS } from './logic/config/decor';
import type { GameEvent } from './logic/events';
import { farmSaveSpec, initFarm } from './logic/save/farmSave';
import { farmOf } from './logic/save/lens';
import { farmRoster, farmReceiveGift } from './logic/roster';
import { farmStage } from './stage';
import { farmSuggestions } from './logic/suggest';
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
  codex: () => [
    {
      id: 'breed',
      name: vi.codex.kinds.breed,
      entries: BREED_IDS.filter((id) => BREEDS[id].enabled).map((id) => ({ id, name: BREEDS[id].nameVi, artId: BREEDS[id].artId, rarity: BREEDS[id].rarity, ...codexTexts(id) })),
    },
  ],
  totals: () => ({ decorOwned: DECOR_IDS.length }),
  roster: farmRoster,
  receiveGift: farmReceiveGift,
  suggest: (world, now, dayOffsetMs) => farmSuggestions(farmOf(world), now, dayOffsetMs),
  toWorldEvents: farmEventsToWorld,
  getSummary: (events, world, now) => farmSummaryLines(events as GameEvent[], farmOf(world), now),
  // Presentation only (GĐ3): the numbers run the same whether the player is here or not.
  onEnter: farmStage.enter,
  onExit: farmStage.exit,
};
