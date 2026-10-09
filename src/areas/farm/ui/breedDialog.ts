// Breeding dialog (spec §10.2): the pair as portraits (this pig ♥ the chosen partner, compatibility
// hearts), the valid partners as picture tiles, then the child chances as tiles (unseen species
// stay a "?" mystery), pregnancy time, fee and space. Data: breedVm.ts; style: features/_breed.scss.
import type { Pig, FarmGame } from '../logic/types';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { breedingVm, type ChildChanceVm, type PigCardVm } from './breedVm';
import { actionButton } from './components/actionButton';
import { openDialog } from '../../../ui/components/dialog';
import { art } from '../../../ui/components/icon';
import { rarityBadge } from '../../../ui/components/rarityBadge';
import type { Act } from './dialogs';
import { el } from '../../../ui/dom';

/** Portrait card of one side of the pair: art on a soft round stage, name, species, gender. */
function breedCard(c: PigCardVm, side: 'self' | 'partner'): HTMLElement {
  return el(
    'div',
    { class: `c-breed__card is-${side} is-${c.gender.toLowerCase()}` },
    el('div', { class: 'c-breed__stage' }, art(c.artId, 'c-breed__art', c.breedName) ?? '🐷'),
    el('strong', { class: 'c-breed__name', text: c.name }),
    el('span', { class: 'c-breed__breed', text: c.breedName }),
    el(
      'span',
      { class: 'c-breed__tags' },
      rarityBadge(c.rarity),
      el('span', {
        class: `c-breed__gender is-${c.gender.toLowerCase()}`,
        text: `${c.gender === 'MALE' ? '♂' : '♀'} ${c.genderLabel}`,
      }),
    ),
  );
}

/** One possible child: its art (or a "?" mystery egg), name, rarity and a percent bar. */
function childTile(c: ChildChanceVm): HTMLElement {
  return el(
    'div',
    { class: `c-breed__kid${c.artId ? '' : ' is-mystery'}` },
    el(
      'div',
      { class: 'c-breed__kid-art' },
      (c.artId && art(c.artId, 'c-breed__kid-img', c.name)) || el('span', { text: '?' }),
    ),
    el('span', { class: 'c-breed__kid-name', text: c.name }),
    rarityBadge(c.rarity),
    el(
      'span',
      { class: 'c-breed__meter' },
      el('i', { attrs: { style: `width: ${Math.min(100, Math.max(4, c.weight))}%` } }),
    ),
    el('b', { class: 'c-breed__pct', text: c.percent }),
  );
}

/**
 * §10.2: the pair on top (this pig ♥ the chosen partner, with compatibility hearts), the partners
 * as picture tiles to choose from, then the child chances as tiles, pregnancy time, fee, space.
 */
export function openBreedDialog(
  host: HTMLElement,
  save: FarmGame,
  pig: Pig,
  now: number,
  act: Act,
) {
  const d = openDialog(host, vi.breed.title, undefined, 'breed');
  d.body.parentElement?.classList.add('c-dialog__panel--wide');
  d.body.classList.add('c-breed');
  const vm = breedingVm(save, pig, now);
  if (vm.partners.length === 0) {
    d.body.append(
      el('div', { class: 'c-breed__pair is-solo' }, breedCard(vm.self, 'self')),
      el('p', { text: t(vi.breed.noPartners, { name: pig.name }) }),
    );
    return;
  }
  const partnerSlot = el('div', { class: 'c-breed__slot' });
  const heart = el('div', { class: 'c-breed__heart' });
  const pair = el('div', { class: 'c-breed__pair' }, breedCard(vm.self, 'self'), heart, partnerSlot);
  const grid = el('div', { class: 'c-breed__partners', attrs: { role: 'listbox' } });
  const result = el('div', { class: 'c-breed__result' });
  const slot = el('div');
  const select = (i: number) => {
    const p = vm.partners[i]!;
    [...grid.children].forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
    partnerSlot.replaceChildren(breedCard(p.card, 'partner'));
    heart.replaceChildren(
      el('span', { class: 'c-breed__heart-icon', text: '♥', attrs: { 'aria-hidden': 'true' } }),
      el('span', { class: 'c-breed__hearts', text: '♥'.repeat(p.hearts) + '♡'.repeat(5 - p.hearts) }),
      el('span', { class: 'c-breed__heart-label', text: vi.breed.compatLabel }),
    );
    result.replaceChildren(
      el('p', { class: 'c-breed__heading', text: vi.breed.chances }),
      ...(p.known ? [el('p', { class: 'c-breed__known', text: `✨ ${p.known}` })] : []),
      el(
        'div',
        { class: 'c-breed__kids' },
        ...p.children.map(childTile),
        ...(p.other ? [el('div', { class: 'c-breed__kid is-other' }, el('span', { text: p.other }))] : []),
      ),
      el(
        'div',
        { class: 'c-breed__facts' },
        el('span', { class: 'c-breed__fact', text: `⏳ ${p.duration}` }),
        el('span', { class: 'c-breed__fact', text: `💰 ${vm.fee}` }),
        el('span', { class: 'c-breed__fact', text: `🏡 ${vm.capacity}` }),
      ),
    );
    slot.replaceChildren(actionButton(p.confirm, () => void act(p.confirm.run).then(d.close)));
  };
  vm.partners.forEach((p, i) =>
    grid.append(
      el(
        'button',
        {
          class: `c-breed__pick is-${p.card.gender.toLowerCase()}`,
          attrs: { type: 'button', role: 'option', 'aria-selected': 'false', title: p.label },
          on: { click: () => select(i) },
        },
        el('span', { class: 'c-breed__pick-art' }, art(p.card.artId, 'c-breed__pick-img', p.card.breedName) ?? '🐷'),
        el('span', { class: 'c-breed__pick-name', text: p.card.name }),
        el('span', { class: 'c-breed__pick-breed', text: p.card.breedName }),
        el('span', { class: 'c-breed__pick-hearts', text: '♥'.repeat(p.hearts) }),
      ),
    ),
  );
  d.body.append(
    pair,
    el('p', { class: 'c-breed__heading', text: t(vi.breed.partners, { n: vm.partners.length }) }),
    grid,
    result,
  );
  d.footer.append(slot);
  select(0);
}
