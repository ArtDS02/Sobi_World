// What the Aquarium's events say and play (spec §11.3): sound and toast per event, data-driven like the Garden's table.
// Handed to the FeedbackDirector, the one place that turns events into presentation. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import type { ItemId } from '../../core/config/ids';
import type { EventBase } from '../../core/events';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { FISH } from './logic/config/content';
import { isAquariumEvent } from './logic/events';
import { TRAITS } from '../../systems/breeding';

export interface Presentation {
  sound: AudioKey | null;
  toast: string | null;
}

const T = vi.aquarium.toast;
const itemName = (id: string) => vi.shop[id as ItemId] ?? id;
const speciesName = (id: string) => FISH[id]?.nameVi ?? id;

/** A catch-up is never replayed (§9.5): the away summary covers it. */
export function aquariumPresentation(e: EventBase, origin: 'action' | 'tick' | 'catchup'): Presentation | null {
  if (!isAquariumEvent(e) || origin === 'catchup') return null;
  switch (e.type) {
    case 'AQUARIUM_FISH_FED':
      return { sound: 'feed_munch', toast: null };
    case 'AQUARIUM_FEED_BOUGHT':
      return { sound: 'coin_collect', toast: t(T.feedBought, { count: e.quantity, gold: formatInt(e.gold) }) };
    case 'AQUARIUM_FISH_PETTED':
      return { sound: 'pig_oink_happy', toast: null };
    case 'AQUARIUM_FISH_TREATED':
      return { sound: 'level_up', toast: null };
    case 'AQUARIUM_TRAIT_REVEALED':
      return { sound: 'notify', toast: t(T.trait, { name: e.name, trait: TRAITS.get(e.traitId)?.nameVi ?? e.traitId }) };
    case 'AQUARIUM_WATER_CHANGED':
      return { sound: 'water_splash', toast: T.water };
    case 'AQUARIUM_CAST':
      if (e.itemId === null) return { sound: 'ui_error', toast: T.miss };
      return { sound: 'coin_collect', toast: t(e.speciesId ? T.cast : T.castOyster, { name: e.speciesId ? speciesName(e.speciesId) : itemName(e.itemId) }) };
    case 'AQUARIUM_RELEASED':
      return { sound: 'water_splash', toast: t(T.released, { name: speciesName(e.speciesId) }) };
    case 'AQUARIUM_FISH_SOLD':
      return { sound: 'coin_collect', toast: t(T.sold, { name: speciesName(e.speciesId), gold: formatInt(e.gold) }) };
    case 'AQUARIUM_CATCH_SOLD':
      return { sound: 'coin_collect', toast: t(T.catchSold, { name: `${formatInt(e.quantity)} ${itemName(e.itemId)}`, gold: formatInt(e.gold) }) };
    case 'AQUARIUM_SCALES_COLLECTED':
      return { sound: 'coin_collect', toast: t(T.scales, { count: e.quantity }) };
    case 'AQUARIUM_SCALES_SHED':
      return { sound: null, toast: t(T.shed, { count: e.count }) };
    case 'AQUARIUM_TANK_UPGRADED':
      return { sound: 'level_up', toast: t(T.upgraded, { level: e.level }) };
    case 'AQUARIUM_EGGS_LAID':
      return { sound: 'breed_chime', toast: e.mutated ? T.eggsMutated : T.eggs };
    case 'AQUARIUM_EGG_HATCHED':
      return { sound: 'birth_fanfare', toast: t(T.hatched, { name: e.name }) };
    case 'AQUARIUM_FISH_SICK':
      return { sound: 'notify', toast: t(T.sick, { name: e.name }) };
    case 'AQUARIUM_FISH_CRITICAL':
      return { sound: 'ui_error', toast: t(T.critical, { name: e.name }) };
    case 'AQUARIUM_FISH_DIED':
      return { sound: 'notify', toast: t(T.died, { name: e.name }) };
    case 'AQUARIUM_PURPOSE_SET':
      return { sound: null, toast: null };
    case 'AQUARIUM_LEVEL_UP':
      return { sound: 'level_up', toast: t(T.levelUp, { level: e.level }) };
  }
}
