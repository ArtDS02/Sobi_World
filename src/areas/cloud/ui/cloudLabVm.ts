// The Cloud's crossing lab (decision 035) as the shared lab screen's input: the flowers with what the bag holds of their
// harvest, the recipes and the lab state, and a dry-run of crossFlowers. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import type { ActionResultOf } from '../../../core/types';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import type { LabInput, } from '../../../ui/components/labVm';
import type { LabReveal } from '../../../ui/components/labView';
import { gotText } from '../../../ui/components/labView';
import { crossFlowers } from '../logic/actions/lab';
import { FLOWERS, FLOWER_LIST, CLOUD_HYBRIDS, CLOUD_LAB } from '../logic/config/content';
import { labOf } from '../logic/derived';
import { cloudOf } from '../logic/save/lens';
import { probe } from './cloudVm';

export function cloudLabInput(world: WorldSave, now: number): LabInput {
  const lab = labOf(cloudOf(world));
  return {
    title: vi.lab.cloudTitle,
    species: FLOWER_LIST.map((c) => ({ id: c.id, name: c.nameVi, art: itemArtId(c.produceItem), have: world.inventory.items[c.produceItem] ?? 0 })),
    recipes: CLOUD_HYBRIDS.recipes,
    rules: CLOUD_HYBRIDS,
    found: lab.found,
    misses: lab.misses,
    cost: CLOUD_LAB.cost,
    coins: world.wallet.coins,
    seeds: CLOUD_LAB.seeds,
    probe: (a, b) => probe(world, (w, c) => crossFlowers(w, { a, b }, c), now),
  };
}

/** What the reveal card shows after a try, read off the action's event. */
export function cloudReveal(result: ActionResultOf<WorldSave>): LabReveal | null {
  if (!result.ok) return null;
  const e = result.events.find((x) => x.type === 'CLOUD_CROSSED') as
    | { flowerId: string; success: boolean; firstTime: boolean; seeds: number; seedItem: string | null }
    | undefined;
  if (!e) return null;
  const crop = FLOWERS[e.flowerId];
  return {
    success: e.success,
    firstTime: e.firstTime,
    got: e.seedItem && e.seeds > 0 ? gotText(e.seeds, vi.shop[e.seedItem as ItemId] ?? e.seedItem) : null,
    name: e.success ? (crop?.nameVi ?? '') : vi.lab.unknown,
    art: e.success && crop ? itemArtId(crop.produceItem) : e.seedItem ? itemArtId(e.seedItem) : '',
  };
}
