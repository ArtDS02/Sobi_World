// Sell confirmation, rename, trough-fill and order dialogs (spec §10.1, §10.2); breeding: breedDialog.ts.
import { adoptPig } from '../logic/actions/adoptPig';
import { renamePig, cleanPigName } from '../logic/actions/renamePig';
import { BREEDS } from '../logic/config/breeds';
import { sellQuote } from '../logic/pricing';
import { localOffsetMs } from '../../../ui/localDay';
import { freeSlots, pigCapacity } from '../logic/derived';
import type { NurseryPig, Pig, FarmGame } from '../logic/types';
import { formatDec, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { BoundAction } from '../store';
import { productPurchase, troughFill, troughSpace, troughUpgrade, type ActionVm } from './actionsVm';
import type { OrderCardVm } from './ordersVm';
import { actionButton } from './components/actionButton';
import { openConfirmDialog, openDialog } from '../../../ui/components/dialog';
import { el } from '../../../ui/dom';

export type Act = (run: BoundAction) => Promise<boolean>;

/** Rare breeds always warn (§10.2: mandatory confirmation for SUPERMAN and MYTHICAL). */
const RARE = new Set<Pig['breed']>(['PIG_SUPERMAN', 'PIG_MYTHICAL']);

/** `bonus`: the farm's decoration bonus, so the shown price is the one paid (PG-3). */
export function openSellDialog(
  host: HTMLElement,
  pig: Pig,
  sell: ActionVm,
  act: Act,
  bonus = 0,
  now = Date.now(),
) {
  const quote = sellQuote(pig, { now, dayOffsetMs: localOffsetMs(now), decorBonus: bonus });
  const d = openDialog(host, t(vi.sell.title, { name: pig.name }), undefined, 'gold');
  d.body.append(
    el('p', { text: t(vi.sell.base, { gold: formatInt(BREEDS[pig.breed].sellGold) }) }),
    el('p', { text: t(vi.sell.quality, { quality: vi.quality[quote.quality], mult: formatDec(quote.qualityFactor) }) }),
    quote.bondLift ? el('p', { class: 'c-dialog__hint', text: vi.bond.qualityLift }) : '',
    el('p', { text: t(vi.sell.weight, { kg: formatInt(quote.weightKg), mult: formatDec(quote.weightFactor) }) }),
    quote.healthFactor < 1 ? el('p', { class: 'c-dialog__warn', text: t(vi.sell.health, { mult: formatDec(quote.healthFactor) }) }) : '',
    quote.traitFactor !== 1 ? el('p', { text: t(vi.sell.trait, { mult: formatDec(quote.traitFactor) }) }) : '',
    el('p', { text: t(vi.sell.market, { mult: formatDec(quote.marketFactor) }) }),
    el('p', { class: 'c-dialog__strong', text: t(vi.sell.final, { gold: formatInt(quote.price) }) }),
    RARE.has(pig.breed) ? el('p', { class: 'c-dialog__warn', text: vi.sell.warning }) : '',
  );
  d.footer.append(
    actionButton({ ...sell, label: vi.action.confirm }, () => void act(sell.run).then(d.close)),
  );
}

export function openRenameDialog(host: HTMLElement, pig: Pig, act: Act) {
  const d = openDialog(host, vi.action.rename);
  const input = el('input', {
    class: 'c-input',
    attrs: { type: 'text', value: pig.name, maxlength: '32', 'aria-label': vi.action.rename },
  });
  const slot = el('div');
  const refresh = () => {
    const name = input.value;
    const vm: ActionVm = {
      label: vi.action.confirm,
      reason: cleanPigName(name) === null ? vi.error.INVALID_REQUEST : null,
      run: (s, c) => renamePig(s, { pigId: pig.id, name }, c),
    };
    slot.replaceChildren(actionButton(vm, () => void act(vm.run).then(d.close)));
  };
  input.addEventListener('input', refresh);
  d.body.append(input);
  d.footer.append(slot);
  refresh();
  input.focus();
  input.select();
}

/** §8.6: fill from inventory first, shortfall bought with gold. `units` presets the amount. */
export function openTroughDialog(
  host: HTMLElement,
  save: FarmGame,
  now: number,
  act: Act,
  units = troughSpace(save),
) {
  const d = openDialog(host, vi.trough.title, undefined, 'trough');
  const space = troughSpace(save);
  const up = troughUpgrade(save, now);
  const input = el('input', {
    class: 'c-input',
    attrs: { type: 'number', min: '1', max: String(Math.max(1, space)), value: String(units) },
  });
  const info = el('div', { class: 'c-dialog__info' });
  const slot = el('div');
  const refresh = () => {
    const vm = troughFill(save, Math.floor(Number(input.value)), now);
    info.replaceChildren(
      el('p', { text: vm.current }),
      el('p', { text: vm.fromInventory }),
      el('p', { text: vm.toBuy }),
    );
    slot.replaceChildren(actionButton(vm.confirm, () => void act(vm.confirm.run).then(d.close)));
  };
  const preset = (label: string, n: number) =>
    el('button', {
      class: 'c-button c-button--ghost',
      text: label,
      attrs: { type: 'button', ...(n < 1 ? { disabled: '' } : {}) },
      on: {
        click: () => {
          input.value = String(n);
          refresh();
        },
      },
    });
  const fromStock = Math.min(save.inventory.FOOD_BASIC, space);
  input.addEventListener('input', refresh);
  d.body.append(
    el('p', { class: 'c-dialog__hint', text: vi.trough.hint }),
    el('p', { text: up.level }),
    el(
      'div',
      { class: 'c-dialog__presets' },
      preset(t(vi.trough.fromInventory, { n: fromStock }), fromStock),
      preset(t(vi.trough.fill, { n: space }), space),
    ),
    input,
    info,
  );
  d.footer.append(slot);
  if (up.upgrade) {
    const upgrade = up.upgrade;
    d.footer.append(actionButton(upgrade, () => void act(upgrade.run).then(d.close)));
  }
  refresh();
}

/** §8.10: quantity 1–99 packs of a shop product, total updates live; reason from the real action. */
export function openBuyItemDialog(
  host: HTMLElement,
  save: FarmGame,
  productId: string,
  now: number,
  act: Act,
) {
  const first = productPurchase(save, productId, 1, now);
  const d = openDialog(host, first.name, undefined, 'shop');
  const input = el('input', {
    class: 'c-input',
    attrs: {
      type: 'number',
      min: '1',
      max: String(first.max),
      value: '1',
      'aria-label': vi.shop.quantity,
    },
  });
  const total = el('p', { class: 'c-dialog__strong' });
  const slot = el('div');
  const refresh = () => {
    const vm = productPurchase(save, productId, Math.floor(Number(input.value)), now);
    total.textContent = vm.total;
    slot.replaceChildren(actionButton(vm.confirm, () => void act(vm.confirm.run).then(d.close)));
  };
  input.addEventListener('input', refresh);
  d.body.append(
    el('p', { text: first.desc }),
    el('label', { class: 'c-dialog__hint', text: vi.shop.quantity }),
    input,
    total,
  );
  d.footer.append(slot);
  refresh();
  input.focus();
  input.select();
}

/** §9.3: importing overwrites the current farm (which becomes a backup); confirm first. */
export function openImportDialog(host: HTMLElement, onConfirm: () => Promise<void>) {
  openConfirmDialog(host, vi.settings.import, vi.settings.importWarning, onConfirm);
}

/** §8.14: pick which fitting pig is sold into the order. */
export function openOrderDialog(host: HTMLElement, card: OrderCardVm, act: Act) {
  const d = openDialog(host, vi.order.pickPig, undefined, 'orders');
  d.body.append(
    el('p', { class: 'c-dialog__strong', text: card.want }),
    el('p', { text: card.reward }),
    el(
      'div',
      { class: 'c-dialog__choices' },
      ...card.choices.map((c) =>
        actionButton(c, () => void act(c.run).then(d.close), 'c-button--ghost c-dialog__choice'),
      ),
    ),
  );
}

/**
 * BR-1: "raise this newborn now?" Yes → adoptPig (needs a free pen slot; on a full farm the store
 * rejects with NO_PIG_SLOT, the error toast explains and the newborn stays in the nursery).
 * No → just closes.
 */
export function openAdoptDialog(host: HTMLElement, save: FarmGame, baby: NurseryPig, act: Act) {
  const d = openDialog(host, vi.nursery.askTitle, vi.nursery.no);
  const free = Math.max(0, freeSlots(save));
  d.body.append(
    el('p', { text: t(vi.nursery.askBody, { name: baby.name, free, max: pigCapacity(save) }) }),
    free > 0 ? '' : el('p', { class: 'c-dialog__warn', text: vi.nursery.full }),
  );
  const run: BoundAction = (s, c) => adoptPig(s, { nurseryId: baby.id }, c);
  d.footer.append(
    el('button', {
      class: 'c-button',
      text: vi.nursery.yes,
      attrs: { type: 'button' },
      data: { adopt: baby.id },
      on: { click: () => void act(run).then(d.close) },
    }),
  );
}
