// Collection book view-model (spec §8.15): every species, grouped by rarity (U04). Thumbnails come
// from the manifest registry; undiscovered species show as silhouettes.
import type { AssetRegistry } from '../../../core/assets/registry';
import { BREEDS } from '../../../core/config/breeds';
import { BREED_ID_VALUES } from '../../../core/config/ids';
import { RARITY_VALUES, type Rarity } from '../../../core/config/rarity';
import type { SaveGame } from '../../../core/types';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';

export interface BookEntryVm {
  id: string;
  /** Real name when discovered, vi.collection.undiscovered otherwise (silhouette). */
  name: string;
  thumb: string | null;
  found: boolean;
}

export interface BookGroupVm {
  rarity: Rarity;
  progress: string;
  entries: BookEntryVm[];
}

export interface CollectionVm {
  breeds: BookEntryVm[];
  /** The same species entries, one group per rarity that has any. */
  breedGroups: BookGroupVm[];
  breedProgress: string;
}

export function collectionVm(save: SaveGame, assets: AssetRegistry | null): CollectionVm {
  const { discoveredBreeds } = save.collection;
  const breeds = BREED_ID_VALUES.map((b): BookEntryVm => {
    const found = discoveredBreeds.includes(b);
    return {
      id: BREEDS[b].artId,
      name: found ? BREEDS[b].nameVi : vi.collection.undiscovered,
      thumb: assets?.url(BREEDS[b].artId) ?? null,
      found,
    };
  });
  const progress = (list: BookEntryVm[]) =>
    t(vi.collection.progress, { found: list.filter((e) => e.found).length, total: list.length });
  const breedGroups = RARITY_VALUES.map((rarity) => {
    const entries = breeds.filter((_, i) => BREEDS[BREED_ID_VALUES[i]!].rarity === rarity);
    return { rarity, progress: progress(entries), entries };
  }).filter((g) => g.entries.length > 0);
  return { breeds, breedGroups, breedProgress: progress(breeds) };
}
