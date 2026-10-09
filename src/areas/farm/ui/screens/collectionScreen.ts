// Collection book (spec §8.15): every species, undiscovered ones as silhouettes.
import type { AssetRegistry } from '../../../../core/assets/registry';
import type { FarmGame } from '../../logic/types';
import { vi } from '../../../../i18n/vi';
import { rarityBadge } from '../../../../ui/components/rarityBadge';
import { thumb } from '../../../../ui/components/thumb';
import { el } from '../../../../ui/dom';
import { collectionVm, type BookEntryVm } from '../collectionVm';

const grid = (entries: BookEntryVm[]) =>
  el(
    'ul',
    { class: 'collection__grid' },
    ...entries.map((e) =>
      el(
        'li',
        { class: `collection__entry${e.found ? '' : ' is-hidden'}`, data: { entry: e.id } },
        thumb(e.thumb, e.name, !e.found),
        el('span', { class: 'collection__name', text: e.name }),
      ),
    ),
  );

const heading = (title: string, progress: string) =>
  el(
    'h3',
    { class: 'collection__heading' },
    el('span', { text: title }),
    el('span', { class: 'collection__progress', text: progress }),
  );

export function renderCollectionScreen(save: FarmGame, assets: AssetRegistry | null): HTMLElement {
  const vm = collectionVm(save, assets);
  return el(
    'section',
    { class: 'collection', data: { screen: 'collection' } },
    heading(vi.collection.breeds, vm.breedProgress),
    ...vm.breedGroups.flatMap((g) => [
      el(
        'h4',
        { class: 'collection__group' },
        rarityBadge(g.rarity),
        el('span', { class: 'collection__progress', text: g.progress }),
      ),
      grid(g.entries),
    ]),
  );
}
