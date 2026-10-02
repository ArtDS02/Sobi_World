// Sell confirmation, rename, trough-fill, breeding and order dialogs (spec §10.1, §10.2).
import { renamePig, cleanPigName } from '../core/actions/renamePig';
import { BREEDS } from '../core/config/breeds';
import { happiness } from '../core/engine/happiness';
import { sellMultiplier, sellPrice } from '../core/engine/pricing';
import type { Pig, SaveGame } from '../core/types';
import { formatDec, formatInt, t } from '../i18n/format';
import { vi } from '../i18n/vi';
import type { BoundAction } from '../store/gameStore';
import type { ItemId } from '../core/config/ids';
import { itemPurchase, troughFill, troughSpace, type ActionVm } from './actionsVm';
import { breedingVm } from './breedVm';
import type { OrderCardVm } from './ordersVm';
import { actionButton } from './components/actionButton';
import { openConfirmDialog, openDialog } from './components/dialog';
import { el } from './dom';

export type Act = (run: BoundAction) => Promise<boolean>;

/** Rare breeds always warn (§10.2: mandatory confirmation for SUPERMAN and MYTHICAL). */
const RARE = new Set<Pig['breed']>(['PIG_SUPERMAN', 'PIG_MYTHICAL']);

export function openSellDialog(host: HTMLElement, pig: Pig, sell: ActionVm, act: Act) {
  const happy = happiness(pig);
  const d = openDialog(host, t(vi.sell.title, { name: pig.name }));
  d.body.append(
    el('p', { text: t(vi.sell.base, { gold: formatInt(BREEDS[pig.breed].sellGold) }) }),
    el('p', {
      text: t(vi.sell.multiplier, { happiness: happy, mult: formatDec(sellMultiplier(happy)) }),
    }),
    el('p', {
      class: 'c-dialog__strong',
      text: t(vi.sell.final, { gold: formatInt(sellPrice(pig)) }),
    }),
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
  save: SaveGame,
  now: number,
  act: Act,
  units = troughSpace(save),
) {
  const d = openDialog(host, vi.trough.title);
  const space = troughSpace(save);
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
  refresh();
}

/** §8.10: quantity 1–99, total updates live; disabled reason from the real action. */
export function openBuyItemDialog(
  host: HTMLElement,
  save: SaveGame,
  itemId: ItemId,
  now: number,
  act: Act,
) {
  const d = openDialog(host, vi.shop[itemId]);
  const first = itemPurchase(save, itemId, 1, now);
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
    const vm = itemPurchase(save, itemId, Math.floor(Number(input.value)), now);
    total.textContent = vm.total;
    slot.replaceChildren(actionButton(vm.confirm, () => void act(vm.confirm.run).then(d.close)));
  };
  input.addEventListener('input', refresh);
  d.body.append(
    el('p', { text: vi.shop[`${itemId}_desc`] }),
    el('label', { class: 'c-dialog__hint', text: vi.shop.quantity }),
    input,
    total,
  );
  d.footer.append(slot);
  refresh();
  input.focus();
  input.select();
}

/** §10.2: pick a valid partner, see the matrix chances and the pregnancy length, confirm. */
export function openBreedDialog(
  host: HTMLElement,
  save: SaveGame,
  pig: Pig,
  now: number,
  act: Act,
) {
  const d = openDialog(host, vi.breed.title);
  const vm = breedingVm(save, pig, now);
  if (vm.partners.length === 0) {
    d.body.append(el('p', { text: t(vi.breed.noPartners, { name: pig.name }) }));
    return;
  }
  const list = el('div', { class: 'c-dialog__choices' });
  const detail = el('div', { class: 'c-dialog__info' });
  const slot = el('div');
  const select = (i: number) => {
    const p = vm.partners[i]!;
    [...list.children].forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
    detail.replaceChildren(
      el('p', { class: 'c-dialog__strong', text: vi.breed.chances }),
      ...p.chances.map((c) => el('p', { text: c })),
      el('p', { text: p.duration }),
      el('p', { text: vm.fee }),
    );
    slot.replaceChildren(actionButton(p.confirm, () => void act(p.confirm.run).then(d.close)));
  };
  vm.partners.forEach((p, i) =>
    list.append(
      el('button', {
        class: 'c-button c-button--ghost c-dialog__choice',
        text: p.label,
        attrs: { type: 'button', 'aria-pressed': 'false' },
        on: { click: () => select(i) },
      }),
    ),
  );
  d.body.append(list, detail);
  d.footer.append(slot);
  select(0);
}

/** §9.3: importing overwrites the current farm (which becomes a backup); confirm first. */
export function openImportDialog(host: HTMLElement, onConfirm: () => Promise<void>) {
  openConfirmDialog(host, vi.settings.import, vi.settings.importWarning, onConfirm);
}

/** §8.14: pick which fitting pig is sold into the order. */
export function openOrderDialog(host: HTMLElement, card: OrderCardVm, act: Act) {
  const d = openDialog(host, vi.order.pickPig);
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
