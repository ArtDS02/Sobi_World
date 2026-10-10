// Sobi Adventure as an Area (ARCHITECTURE §5 Area Contract): manifest (content/adventure/area.json) and hooks. The app
// registers it in core/area-registry; nothing outside this folder knows how a battle or a run works. Its fighters are the
// creatures of other Areas, which it sees only through the registry's roster.
import type { AreaModule } from '../../core/area-registry/registry';
import { ADVENTURE_CONTENT } from './logic/config/content';
import { advanceAdventureWorld } from './logic/simulate';
import { adventureOf, withAdventure } from './logic/save/lens';
import { ADVENTURE_MIGRATIONS, ADVENTURE_STATE_VERSION, adventureStateSchema, initialAdventure } from './logic/state';
import { adventureSuggestions } from './logic/suggest';
import { adventureSummaryLines } from './logic/summary';
import { adventureEventsToWorld } from './logic/worldEvents';
import { adventureStage } from './stage';

export const adventureArea: AreaModule = {
  manifest: ADVENTURE_CONTENT.area,
  save: { schema: adventureStateSchema, migrations: ADVENTURE_MIGRATIONS, version: ADVENTURE_STATE_VERSION },
  init: (world, ctx) => withAdventure(world, initialAdventure(ctx.now)),
  simulate: (world, now) => advanceAdventureWorld(world, now),
  simulatedAt: (world) => adventureOf(world).lastTickedAt,
  rebase: (world, to) => withAdventure(world, { ...adventureOf(world), lastTickedAt: to }),
  suggest: (world) => adventureSuggestions(adventureOf(world)),
  toWorldEvents: adventureEventsToWorld,
  getSummary: (_events, world, now) => adventureSummaryLines(adventureOf(world), now),
  // Presentation only: the numbers run the same whether the player is here or not.
  onEnter: adventureStage.enter,
  onExit: adventureStage.exit,
};
