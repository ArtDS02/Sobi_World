// The Garden's crossing lab (decision 035) as the shared lab screen's input: the crops with what the bag holds of their
// harvest, the recipes and the lab state, and a dry-run of crossCrops. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import type { ActionResultOf } from '../../../core/types';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import type { LabInput, } from '../../../ui/components/labVm';
import type { LabReveal } from '../../../ui/components/labView';
import { gotText } from '../../../ui/components/labView';
import { crossCrops } from '../logic/actions/lab';
import { CROPS, CROP_LIST, GARDEN_HYBRIDS, GARDEN_LAB } from '../logic/config/content';
import { labOf } from '../logic/derived';
import { gardenOf } from '../logic/save/lens';
import { probe } from './gardenVm';

export function gardenLabInput(world: WorldSave, now: number): LabInput {
  const lab = labOf(gardenOf(world));
  return {
    title: vi.lab.gardenTitle,
    species: CROP_LIST.map((c) => ({ id: c.id, name: c.nameVi, art: itemArtId(c.produceItem), have: world.inventory.items[c.produceItem] ?? 0 })),
    recipes: GARDEN_HYBRIDS.recipes,
    rules: GARDEN_HYBRIDS,
    found: lab.found,
    misses: lab.misses,
    cost: GARDEN_LAB.cost,
    coins: world.wallet.coins,
    seeds: GARDEN_LAB.seeds,
    probe: (a, b) => probe(world, (w, c) => crossCrops(w, { a, b }, c), now),
  };
}

/** What the reveal card shows after a try, read off the action's event. */
export function gardenReveal(result: ActionResultOf<WorldSave>): LabReveal | null {
  if (!result.ok) return null;
  const e = result.events.find((x) => x.type === 'GARDEN_CROSSED') as
    | { cropId: string; success: boolean; firstTime: boolean; seeds: number; seedItem: string | null }
    | undefined;
  if (!e) return null;
  const crop = CROPS[e.cropId];
  return {
    success: e.success,
    firstTime: e.firstTime,
    got: e.seedItem && e.seeds > 0 ? gotText(e.seeds, vi.shop[e.seedItem as ItemId] ?? e.seedItem) : null,
    name: e.success ? (crop?.nameVi ?? '') : vi.lab.unknown,
    art: e.success && crop ? itemArtId(crop.produceItem) : e.seedItem ? itemArtId(e.seedItem) : '',
  };
}
