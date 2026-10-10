// The dialogs of the tank itself: the bag of caught fish, the tank card (water, scales, eggs, upgrade) and breeding.
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { boostOptions, boostPicker } from '../../../ui/components/boostPicker';
import { breedFish } from '../logic/actions/breed';
import { cleanTank } from '../logic/actions/care';
import { releaseFish } from '../logic/actions/fishing';
import { collectScales, sellCatch, upgradeTank } from '../logic/actions/trade';
import { AB } from '../logic/config/content';
import { aquariumOf } from '../logic/save/lens';
import { bagVm, breedablePairs, breedReason, tankVm } from './aquariumVm';
import { actionButton, needBar, type DialogKit } from './dialogKit';

export function tankDialogs(k: DialogKit) {
  function openBag() {
    k.open(vi.aquarium.bagTitle, (w, close) => {
      const rows = bagVm(w, k.now(), k.offset());
      if (rows.length === 0) {
        close();
        return null;
      }
      return el(
        'div',
        { class: 'aquarium-dialog' },
        el('p', { class: 'c-dialog__hint', text: vi.aquarium.bagHint }),
        el(
          'ul',
          { class: 'aquarium-dialog__bag' },
          ...rows.map((r) =>
            el(
              'li',
              {},
              art(r.art, 'aquarium-dialog__bag-icon'),
              el('b', { text: `${r.name} ×${r.count}` }),
              el(
                'div',
                { class: 'aquarium-dialog__actions' },
                r.release ? actionButton(r.release, () => k.run((s, c) => releaseFish(s, { itemId: r.itemId }, c))) : null,
                actionButton(r.sellOne, () => k.run((s, c) => sellCatch(s, { itemId: r.itemId, quantity: 1 }, c)), 'c-button--ghost'),
                r.count > 1 ? actionButton(r.sellAll, () => k.run((s, c) => sellCatch(s, { itemId: r.itemId, quantity: r.count }, c)), 'c-button--ghost') : null,
              ),
            ),
          ),
        ),
      );
    });
  }

  function openTank() {
    k.open(vi.aquarium.tankTitle, (w) => {
      const vm = tankVm(w, k.now(), k.offset());
      const a = aquariumOf(w);
      return el(
        'div',
        { class: 'aquarium-dialog' },
        el('p', { class: 'c-dialog__strong', text: vm.levelText }),
        needBar(vm.waterText, vm.waterPercent, vm.waterPercent < 35 ? 'is-low' : ''),
        el('p', { text: vm.waterState }),
        el('p', { text: vm.scalesText }),
        a.eggs.length > 0 ? el('div', {}, el('b', { text: t(vi.aquarium.eggsLine, { count: a.eggs.length }) }), el('ul', {}, ...vm.eggs.map((line) => el('li', { text: line })))) : null,
        el(
          'div',
          { class: 'aquarium-dialog__actions' },
          actionButton({ label: vi.aquarium.bar.water, reason: vm.waterPercent >= 99 ? vi.aquarium.waterClear : null }, () => k.run((s, c) => cleanTank(s, {}, c))),
          actionButton({ label: t(vi.aquarium.bar.scales, { count: a.tank.scales }), reason: a.tank.scales === 0 ? vi.aquarium.noScales : null }, () => k.run((s, c) => collectScales(s, {}, c))),
        ),
        vm.upgrade
          ? el('div', {}, el('p', { class: 'c-dialog__hint', text: vi.aquarium.upgradeHint }), actionButton(vm.upgrade, () => k.run((s, c) => upgradeTank(s, {}, c))))
          : el('p', { class: 'c-dialog__hint', text: vm.maxText ?? '' }),
      );
    });
  }

  function openBreed() {
    let boost: string | undefined;
    k.open(vi.aquarium.breedTitle, (w, close) => {
      const pairs = breedablePairs(w, k.now());
      const options = boostOptions(w.inventory.items);
      if (boost !== undefined && !options.some((o) => o.itemId === boost)) boost = undefined;
      return el(
        'div',
        { class: 'aquarium-dialog' },
        el('p', { class: 'c-dialog__hint', text: t(vi.aquarium.breedHint, { feed: AB.breeding.feed, hours: AB.breeding.eggHours }) }),
        boostPicker(options, boost, (next) => {
          boost = next;
          k.redraw();
        }),
        pairs.length === 0
          ? el('p', { text: vi.aquarium.breedNone })
          : el(
              'ul',
              { class: 'aquarium-dialog__bag' },
              ...pairs.map((p) =>
                el(
                  'li',
                  {},
                  art(p.art, 'aquarium-dialog__bag-icon'),
                  el('div', {}, el('b', { text: `${p.speciesName}: ${p.label}` }), p.traitNames.length > 0 ? el('small', { text: `${vi.heredity.traits}: ${p.traitNames.join(', ')}` }) : null),
                  actionButton({ label: vi.aquarium.breedGo, reason: breedReason(w, p, k.now(), k.offset()) }, () => {
                    k.run((s, c) => breedFish(s, { fishAId: p.aId, fishBId: p.bId, ...(boost ? { boostItem: boost } : {}) }, c));
                    close();
                  }),
                ),
              ),
            ),
      );
    });
  }

  return { openBag, openTank, openBreed };
}
