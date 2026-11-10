// The Garden's plot skin forge body (decision 056): the shared forge dialog filled from the Garden's world and the zone on screen.
import { autoOfGroup, skinMoment, type SkinAutoMode } from '../../../core/plots/skinAuto';
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { skinForgeBody } from '../../../ui/components/skinForgeDialog';
import { localOffsetMs } from '../../../ui/localDay';
import { skinAutoVm, skinCardsVm, skinStripVm } from '../../../ui/world/skinForgeVm';
import { skinOfGroup } from '../../../systems/plants/tiers';
import { gardenOf } from '../logic/save/lens';
import { probe, type GardenRun } from './gardenVm';

export function gardenForgeBody(
  w: WorldSave,
  group: number,
  now: number,
  forge: (skinId: string, pay: 'coins' | 'gems') => GardenRun,
  onForge: (skinId: string, count: number) => void,
  onApply: (skinId: string | null) => void,
  onAuto: (mode: SkinAutoMode | null) => void,
): HTMLElement {
  const wearing = skinOfGroup(gardenOf(w).zoneSkins, group);
  return skinForgeBody(
    {
      cards: skinCardsVm(w, (skinId, pay) => probe(w, forge(skinId, pay), now)),
      strip: skinStripVm(w, wearing),
      auto: skinAutoVm(w, wearing, autoOfGroup(gardenOf(w).zoneSkinAuto, group), skinMoment(now, localOffsetMs(now))),
      groupName: t(vi.garden.zoneTitle, { n: group + 1, name: vi.garden.zoneNames[group] ?? '' }),
      coins: w.wallet.coins,
      gems: w.wallet.gems,
    },
    { onForge, onApply, onAuto },
  );
}
