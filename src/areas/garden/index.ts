// Sobi Garden as an Area (ARCHITECTURE §5 Area Contract): manifest (content/garden/area.json) and hooks.
// The app registers it in core/area-registry; nothing outside this folder knows how plants grow.
import type { AreaModule } from '../../core/area-registry/registry';
import { areaXp } from '../../core/progression/levels';
import { GARDEN_AREA_ID, GARDEN_CONTENT, gardenLevel } from './logic/config/content';
import { gardenStage } from './stage';
import { advanceGardenWorld } from './logic/simulate';
import { gardenOf, withGarden } from './logic/save/lens';
import { GARDEN_MIGRATIONS, GARDEN_STATE_VERSION, gardenStateSchema, initialGarden } from './logic/state';
import { gardenSummaryLines } from './logic/summary';
import { gardenEventsToWorld } from './logic/worldEvents';

export const gardenArea: AreaModule = {
  manifest: GARDEN_CONTENT.area,
  save: { schema: gardenStateSchema, migrations: GARDEN_MIGRATIONS, version: GARDEN_STATE_VERSION },
  init: (world, ctx) => withGarden(world, initialGarden(ctx.now)),
  // One formula for every mode (ARCHITECTURE §6): the plots and workshops are closed forms of time.
  simulate: (world, now) => advanceGardenWorld(world, now),
  simulatedAt: (world) => gardenOf(world).lastTickedAt,
  rebase: (world, to) => withGarden(world, { ...gardenOf(world), lastTickedAt: to }),
  level: (world) => gardenLevel(areaXp(world, GARDEN_AREA_ID)),
  toWorldEvents: gardenEventsToWorld,
  getSummary: (events, world, now) => gardenSummaryLines(events, gardenOf(world), now),
  // Presentation only: the numbers run the same whether the player is here or not.
  onEnter: gardenStage.enter,
  onExit: gardenStage.exit,
};
