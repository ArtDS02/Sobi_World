// The dialog of one fish (needs, hearts, traits, purpose, care) and the sale quote.
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { feedFish, petFish, treatFish } from '../logic/actions/care';
import { sellFish } from '../logic/actions/trade';
import { aquariumOf } from '../logic/save/lens';
import { fishCardVm, quoteLines, type FishCardVm } from './fishCardVm';
import { actionButton, needBar, type DialogKit } from './dialogKit';

const traitList = (card: FishCardVm): HTMLElement =>
  el(
    'div',
    { class: 'aquarium-dialog__traits' },
    el('b', { text: vi.heredity.traits }),
    card.traits.length === 0
      ? el('span', { class: 'c-dialog__hint', text: vi.heredity.noTraits })
      : el(
          'ul',
          { class: 'aquarium-dialog__chips' },
          ...card.traits.map((c) =>
            el(
              'li',
              { class: `aquarium-dialog__chip${c.tier ? ` is-${c.tier.toLowerCase()}` : ''}${c.hidden ? ` is-${c.hidden}` : ''}`, attrs: { title: [c.desc, c.effects].filter(Boolean).join(' · ') } },
              el('b', { text: c.name }),
              c.effects ? el('small', { text: c.effects }) : null,
            ),
          ),
        ),
  );

export function fishDialogs(k: DialogKit) {
  function openSell(fishId: string) {
    k.open(vi.aquarium.sell, (w, close) => {
      const fish = aquariumOf(w).fish.find((f) => f.id === fishId);
      const card = fishCardVm(w, fishId, k.now(), k.offset());
      if (!fish || !card) {
        close();
        return null;
      }
      return el(
        'div',
        { class: 'aquarium-dialog' },
        el('p', { class: 'c-dialog__strong', text: t(vi.aquarium.quote.title, { name: fish.name }) }),
        el('ul', { class: 'aquarium-dialog__quote' }, ...quoteLines(fish, k.now()).map((line) => el('li', { text: line }))),
        actionButton(card.sell, () => {
          k.run((s, c) => sellFish(s, { fishId }, c));
          close();
        }),
      );
    });
  }

  function openFish(fishId: string) {
    const first = k.world() && fishCardVm(k.world()!, fishId, k.now(), k.offset());
    k.open(first?.name ?? vi.aquarium.title, (w, close) => {
      const card = fishCardVm(w, fishId, k.now(), k.offset());
      if (!card) {
        close();
        return null;
      }
      return el(
        'div',
        { class: 'aquarium-dialog' },
        el(
          'div',
          { class: 'aquarium-dialog__head' },
          art(card.art, 'aquarium-dialog__portrait', card.speciesName),
          el(
            'div',
            {},
            el('p', { class: 'c-dialog__strong', text: `${card.name} · ${card.speciesName}` }),
            el('p', { text: `${card.stageText} · ${card.genderText} · ${card.generation}` }),
            el('p', { class: card.health.state === 'healthy' ? '' : 'aquarium-dialog__ill', text: card.health.text }),
          ),
        ),
        card.health.warning ? el('p', { class: 'c-dialog__warn', text: card.health.warning }) : null,
        needBar(card.needText.hunger, card.needs.hunger),
        needBar(card.needText.clean, card.needs.clean),
        needBar(card.needText.growth, card.needs.growth, 'is-growth'),
        el('p', {}, el('span', { class: 'aquarium-dialog__hearts', text: card.heartsText }), ` ${card.heartsSummary} · ${card.quality}`),
        el('p', {}, t(vi.aquarium.favorite, { item: card.favorite.item })),
        card.parents ? el('p', { class: 'c-dialog__hint', text: card.parents }) : null,
        traitList(card),
        el('b', { text: vi.aquarium.purpose }),
        el(
          'div',
          { class: 'aquarium-dialog__purposes', attrs: { role: 'radiogroup', 'aria-label': vi.aquarium.purpose } },
          ...card.purposes.map((p) =>
            el('button', {
              class: `aquarium-dialog__purpose${p.active ? ' is-selected' : ''}`,
              text: p.label,
              attrs: { type: 'button', role: 'radio', 'aria-checked': String(p.active), title: p.reason ?? p.title, ...(p.reason ? { disabled: '' } : {}) },
              on: { click: () => k.run(p.run) },
            }),
          ),
        ),
        el(
          'div',
          { class: 'aquarium-dialog__actions' },
          actionButton(card.feed, () => k.run((s, c) => feedFish(s, { fishIds: [fishId] }, c))),
          actionButton(card.feedFavorite, () => k.run((s, c) => feedFish(s, { fishIds: [fishId], itemId: card.favorite.itemId }, c))),
          actionButton(card.pet, () => k.run((s, c) => petFish(s, { fishId }, c))),
          actionButton(card.treat, () => k.run((s, c) => treatFish(s, { fishId }, c))),
          actionButton(card.sell, () => openSell(fishId), 'c-button--ghost'),
        ),
      );
    });
  }

  return { openFish, openSell };
}
