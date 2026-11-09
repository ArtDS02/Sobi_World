// The Cloud's plot skin forge body (decision 056): the shared forge dialog filled from the Cloud's world and the cloud tier on screen.
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { skinForgeBody } from '../../../ui/components/skinForgeDialog';
import { skinCardsVm, skinStripVm } from '../../../ui/world/skinForgeVm';
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
): HTMLElement {
  return skinForgeBody(
    {
      cards: skinCardsVm(w, (skinId, pay) => probe(w, forge(skinId, pay), now)),
      strip: skinStripVm(w, skinOfGroup(cloudOf(w).tierSkins, group)),
      groupName: t(vi.cloud.tierTitle, { n: group + 1, name: vi.cloud.tierNames[group] ?? '' }),
      coins: w.wallet.coins,
      gems: w.wallet.gems,
    },
    { onForge, onApply },
  );
}
