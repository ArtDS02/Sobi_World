// Sobi Cloud as an Area (ARCHITECTURE §5 Area Contract): manifest (content/cloud/area.json) and hooks. The app registers it
// in core/area-registry; nothing outside this folder knows how the flowers grow or how the cauldron works.
import type { AreaModule } from '../../core/area-registry/registry';
import { INVENTORY } from '../../core/config/inventory';
import { ITEMS } from '../../core/config/items';
import type { ItemId } from '../../core/config/ids';
import { addToBag } from '../../core/inventory/bag';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { CB, CLOUD_CONTENT, FLOWER_LIST, WATER_ITEM } from './logic/config/content';
import { advanceCloudWorld } from './logic/simulate';
import { cloudOf, withCloud } from './logic/save/lens';
import { CLOUD_MIGRATIONS, CLOUD_STATE_VERSION, cloudStateSchema, initialCloud } from './logic/state';
import { cloudSuggestions } from './logic/suggest';
import { cloudSummaryLines } from './logic/summary';
import { cloudEventsToWorld } from './logic/worldEvents';
import { cloudStage } from './stage';

export const cloudArea: AreaModule = {
  manifest: CLOUD_CONTENT.area,
  save: { schema: cloudStateSchema, migrations: CLOUD_MIGRATIONS, version: CLOUD_STATE_VERSION },
  // A new cloud begins with a little pure water in the bag, so the first flowers can be watered at once.
  init: (world, ctx) => {
    const bag = addToBag(world.inventory.items, WATER_ITEM, CB.start.water, INVENTORY);
    return withCloud({ ...world, inventory: { items: bag.ok ? bag.items : world.inventory.items } }, initialCloud(ctx.now));
  },
  // One formula for every mode (ARCHITECTURE §6): flowers, spring and cauldron are closed forms of time.
  simulate: (world, now) => advanceCloudWorld(world, now),
  simulatedAt: (world) => cloudOf(world).lastTickedAt,
  rebase: (world, to) => withCloud(world, { ...cloudOf(world), lastTickedAt: to }),
  codex: () => [
    {
      id: 'flower',
      name: vi.codex.kinds.flower,
      entries: FLOWER_LIST.map((f) => {
        const rarity = vi.rarity[ITEMS[f.produceItem as ItemId].rarity];
        const kind = vi.cloud.codex.kind[f.kind];
        return {
          id: f.id,
          name: f.nameVi,
          artId: `${f.art}_ripe`,
          rarity: ITEMS[f.produceItem as ItemId].rarity,
          hint: t(vi.cloud.codex.hintUnknown, { rarity, when: f.kind === 'NIGHT' ? vi.cloud.codex.whenNight : vi.cloud.codex.whenAny }),
          detail: t(vi.cloud.codex.detail, { rarity: kind, hours: Math.round(f.growMs / 3_600_000), yield: f.yield }),
        };
      }),
    },
  ],
  suggest: (world, now, dayOffsetMs) => cloudSuggestions(cloudOf(world), now, dayOffsetMs),
  toWorldEvents: cloudEventsToWorld,
  getSummary: (events, world, now) => cloudSummaryLines(events, cloudOf(world), now),
  // Presentation only: the numbers run the same whether the player is here or not.
  onEnter: cloudStage.enter,
  onExit: cloudStage.exit,
};
