// Nursery part of the inventory (DECISIONS BR-1): newborns from breeding wait here as their own pig
// instances; clicking one asks whether to raise it now (dialogs.openAdoptDialog).
import { pigTexture } from '../../scene/view/farmArt';
import type { AssetRegistry } from '../../../../core/assets/registry';
import { BALANCE } from '../../logic/config/balance';
import { BREEDS } from '../../logic/config/breeds';
import type { NurseryPig, FarmGame } from '../../logic/types';
import { t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import { rarityBadge } from '../../../../ui/components/rarityBadge';
import { thumb } from '../../../../ui/components/thumb';
import { el } from '../../../../ui/dom';

export function renderNursery(
  save: FarmGame,
  raise: (baby: NurseryPig) => void,
  assets?: AssetRegistry,
): HTMLElement {
  const title = el('h3', {
    class: 'inventory__heading',
    text: t(vi.nursery.title, { n: save.nursery.length, max: BALANCE.NURSERY_MAX }),
  });
  if (save.nursery.length === 0) {
    return el('div', { class: 'inventory__nursery' }, title, el('p', { class: 'inventory__desc', text: vi.nursery.empty }));
  }
  const card = (baby: NurseryPig) =>
    el(
      'button',
      {
        class: 'inventory__baby',
        attrs: { type: 'button', 'aria-label': `${baby.name} — ${vi.nursery.askTitle}` },
        data: { nursery: baby.id },
        on: { click: () => raise(baby) },
      },
      thumb(assets ? pigTexture(assets, baby.breed).url : null, BREEDS[baby.breed].nameVi),
      el(
        'span',
        { class: 'inventory__text' },
        el('span', { class: 'inventory__name', text: `${baby.name} ${baby.gender === 'MALE' ? '♂' : '♀'}` }),
        el('span', { class: 'inventory__desc', text: BREEDS[baby.breed].nameVi }),
        el('span', {
          class: 'inventory__desc',
          text: t(vi.nursery.parents, {
            mother: BREEDS[baby.parents.motherBreed].nameVi,
            father: BREEDS[baby.parents.fatherBreed].nameVi,
          }),
        }),
        el('span', { class: 'inventory__desc', text: t(vi.ui.generation, { n: baby.generation }) }),
      ),
      rarityBadge(BREEDS[baby.breed].rarity),
    );
  return el(
    'div',
    { class: 'inventory__nursery' },
    title,
    el('p', { class: 'inventory__desc', text: vi.nursery.hint }),
    el('div', { class: 'inventory__babies' }, ...save.nursery.map(card)),
  );
}
