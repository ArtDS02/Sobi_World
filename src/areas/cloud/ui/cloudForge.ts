// The Cloud's plot skin forge body (decision 056): the shared forge dialog filled from the Cloud's world and the cloud tier on screen.
import { autoOfGroup, skinMoment, type SkinAutoMode } from '../../../core/plots/skinAuto';
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { skinForgeBody } from '../../../ui/components/skinForgeDialog';
import { localOffsetMs } from '../../../ui/localDay';
import { skinAutoVm, skinCardsVm, skinStripVm } from '../../../ui/world/skinForgeVm';
import { skinOfGroup } from '../../../systems/plants/tiers';
import { cloudOf } from '../logic/save/lens';
import { probe, type CloudRun } from './cloudVm';

export function cloudForgeBody(
  w: WorldSave,
  group: number,
  now: number,
  forge: (skinId: string, pay: 'coins' | 'gems') => CloudRun,
  onForge: (skinId: string, count: number) => void,
  onApply: (skinId: string | null) => void,
  onAuto: (mode: SkinAutoMode | null) => void,
): HTMLElement {
  const wearing = skinOfGroup(cloudOf(w).tierSkins, group);
  return skinForgeBody(
    {
      cards: skinCardsVm(w, (skinId, pay) => probe(w, forge(skinId, pay), now)),
      strip: skinStripVm(w, wearing),
      auto: skinAutoVm(w, wearing, autoOfGroup(cloudOf(w).tierSkinAuto, group), skinMoment(now, localOffsetMs(now))),
      groupName: t(vi.cloud.tierTitle, { n: group + 1, name: vi.cloud.tierNames[group] ?? '' }),
      coins: w.wallet.coins,
      gems: w.wallet.gems,
    },
    { onForge, onApply, onAuto },
  );
}
