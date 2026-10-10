// Sobi Aquarium as an Area (ARCHITECTURE §5 Area Contract): manifest (content/aquarium/area.json) and hooks. The app
// registers it in core/area-registry; nothing outside this folder knows how fish live.
import type { AreaModule } from '../../core/area-registry/registry';
import { addToBag } from '../../core/inventory/bag';
import { INVENTORY } from '../../core/config/inventory';
import { pick, randomId } from '../../core/rng';
import { vi } from '../../i18n/vi';
import { AB, AQUARIUM_CONTENT, FEED_ITEM, FISH, FISH_LIST, FISH_NAMES } from './logic/config/content';
import { advanceAquariumWorld } from './logic/simulate';
import { aquariumOf, withAquarium } from './logic/save/lens';
import { AQUARIUM_MIGRATIONS, AQUARIUM_STATE_VERSION, aquariumStateSchema, initialAquarium, type Fish } from './logic/state';
import { aquariumSuggestions } from './logic/suggest';
import { aquariumSummaryLines } from './logic/summary';
import { aquariumEventsToWorld } from './logic/worldEvents';
import { aquariumStage } from './stage';

/** The tank's first resident: a half-grown fish of the starter species, and a few meals for it. */
export const aquariumArea: AreaModule = {
  manifest: AQUARIUM_CONTENT.area,
  save: { schema: aquariumStateSchema, migrations: AQUARIUM_MIGRATIONS, version: AQUARIUM_STATE_VERSION },
  init: (world, ctx) => {
    const starter: Fish = {
      id: randomId(ctx.rng),
      breed: FISH[AB.start.fish]!.id,
      name: pick(ctx.rng, FISH_NAMES),
      gender: ctx.rng.next() < 0.5 ? 'MALE' : 'FEMALE',
      growthProgress: AB.life.stageAdultAt,
      hunger: 80,
      cleanliness: 100,
      isSick: false,
      generation: 1,
      createdAt: ctx.now,
      lastTickedAt: ctx.now,
    };
    const bag = addToBag(world.inventory.items, FEED_ITEM, AB.start.feed, INVENTORY);
    return withAquarium({ ...world, inventory: { items: bag.ok ? bag.items : world.inventory.items } }, initialAquarium(ctx.now, starter));
  },
  // One formula for every mode (ARCHITECTURE §6): water, fish and eggs are closed forms of time.
  simulate: (world, now, _rng, dayOffsetMs, mode) => advanceAquariumWorld(world, now, dayOffsetMs, mode),
  simulatedAt: (world) => aquariumOf(world).lastTickedAt,
  rebase: (world, to) => withAquarium(world, { ...aquariumOf(world), lastTickedAt: to }),
  codex: () => [
    {
      id: 'fish',
      name: vi.codex.kinds.fish,
      entries: FISH_LIST.map((f) => ({
        id: f.id,
        name: f.nameVi,
        artId: f.art,
        rarity: f.rarity,
        hint: f.nightOnly ? vi.aquarium.codex.hintNight : vi.aquarium.codex.hintDay,
        detail: f.descVi,
      })),
    },
  ],
  suggest: (world, now) => aquariumSuggestions(aquariumOf(world), now),
  toWorldEvents: aquariumEventsToWorld,
  getSummary: (events, world, now) => aquariumSummaryLines(events, aquariumOf(world), now),
  // Presentation only: the numbers run the same whether the player is here or not.
  onEnter: aquariumStage.enter,
  onExit: aquariumStage.exit,
};
