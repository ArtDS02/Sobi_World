// The DOM layers of the Areas that are played with clicks (the Garden, the Aquarium, the Cloud): one overlay the shell places over
// the world, each Area's HUD showing only while the player is in it, plus what the app asks of them as a group — the
// place the shell should show, the away-screen lines and the presentation of their events.
import { adventureArea } from '../areas/adventure';
import { adventurePresentation } from '../areas/adventure/feedback';
import { ADVENTURE_AREA_ID } from '../areas/adventure/logic/config/content';
import { hasAdventure } from '../areas/adventure/logic/save/lens';
import { createAdventureUi } from '../areas/adventure/ui/adventureUi';
import { aquariumArea } from '../areas/aquarium';
import { aquariumPresentation } from '../areas/aquarium/feedback';
import { AQUARIUM_AREA_ID } from '../areas/aquarium/logic/config/content';
import { hasAquarium } from '../areas/aquarium/logic/save/lens';
import { createAquariumUi } from '../areas/aquarium/ui/aquariumUi';
import { cloudArea } from '../areas/cloud';
import { cloudPresentation } from '../areas/cloud/feedback';
import { CLOUD_AREA_ID } from '../areas/cloud/logic/config/content';
import { hasCloud } from '../areas/cloud/logic/save/lens';
import { createCloudUi } from '../areas/cloud/ui/cloudUi';
import type { Place } from '../areas/farm/ui/appTypes';
import { gardenArea } from '../areas/garden';
import { gardenPresentation } from '../areas/garden/feedback';
import { GARDEN_AREA_ID } from '../areas/garden/logic/config/content';
import { hasGarden } from '../areas/garden/logic/save/lens';
import { createGardenUi } from '../areas/garden/ui/gardenUi';
import type { CreatureGift, GiftResult, RosterEntry, SummaryLine } from '../core/area-registry/registry';
import type { ActionContext } from '../core/types';
import type { EventBase } from '../core/events';
import { PLAZA_ID } from '../core/player/player';
import type { WorldSave } from '../core/save/world';
import type { GameStore } from '../core/world/gameStore';
import { el } from '../ui/dom';
import type { PanelId } from '../ui/components/popup';

export interface AreaOverlaysDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
  /** The creatures of every Area the Adventure may use, and the way to hand one to the Area that keeps it. */
  roster: (world: WorldSave) => RosterEntry[];
  give: (world: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult;
}

export function createAreaOverlays(d: AreaOverlaysDeps) {
  const gardenHost = el('div', { class: 'garden-host' });
  const aquariumHost = el('div', { class: 'aquarium-host' });
  const cloudHost = el('div', { class: 'cloud-host' });
  const adventureHost = el('div', { class: 'adventure-host' });
  const root = el('div', { class: 'area-overlays' }, gardenHost, aquariumHost, cloudHost, adventureHost);
  const common = { world: d.world, now: d.now, leave: d.leave, openPanel: d.openPanel };
  const gardenUi = createGardenUi({ ...common, host: gardenHost });
  const aquariumUi = createAquariumUi({
    ...common,
    host: aquariumHost,
    frame: (fn) => {
      const id = window.setInterval(fn, 33);
      return () => window.clearInterval(id);
    },
  });
  const cloudUi = createCloudUi({ ...common, host: cloudHost });
  const adventureUi = createAdventureUi({
    ...common,
    host: adventureHost,
    roster: d.roster,
    give: d.give,
    frame: (fn, ms) => {
      const id = window.setInterval(fn, ms);
      return () => window.clearInterval(id);
    },
  });
  return {
    root,
    gardenUi,
    aquariumUi,
    cloudUi,
    adventureUi,
    /** The player moved to `to`: the shell's place, and whose HUD shows. */
    enter(to: string): Place {
      gardenUi.setActive(to === GARDEN_AREA_ID);
      aquariumUi.setActive(to === AQUARIUM_AREA_ID);
      cloudUi.setActive(to === CLOUD_AREA_ID);
      adventureUi.setActive(to === ADVENTURE_AREA_ID);
      if (to === PLAZA_ID) return 'plaza';
      return to === GARDEN_AREA_ID ? 'garden' : to === AQUARIUM_AREA_ID ? 'aquarium' : to === CLOUD_AREA_ID ? 'cloud' : to === ADVENTURE_AREA_ID ? 'adventure' : 'area';
    },
    isModalOpen: () => gardenUi.isModalOpen() || aquariumUi.isModalOpen() || cloudUi.isModalOpen() || adventureUi.isModalOpen(),
    /** The lines of the "while you were away" screen that belong to these Areas. */
    summaryLines(events: readonly EventBase[], save: WorldSave | null): SummaryLine[] {
      if (!save) return [];
      const now = d.now();
      return [
        ...(hasGarden(save) ? (gardenArea.getSummary?.(events, save, now) ?? []) : []),
        ...(hasAquarium(save) ? (aquariumArea.getSummary?.(events, save, now) ?? []) : []),
        ...(hasCloud(save) ? (cloudArea.getSummary?.(events, save, now) ?? []) : []),
        ...(hasAdventure(save) ? (adventureArea.getSummary?.(events, save, now) ?? []) : []),
      ];
    },
    presentation: (event: EventBase, origin: 'action' | 'tick' | 'catchup') => gardenPresentation(event, origin) ?? aquariumPresentation(event, origin) ?? cloudPresentation(event, origin) ?? adventurePresentation(event, origin),
  };
}
