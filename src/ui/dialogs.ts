// Sell confirmation, rename and trough-fill dialogs (spec §10.1, §10.2).
import { renamePig, cleanPigName } from '../core/actions/renamePig';
import { BREEDS } from '../core/config/breeds';
import { happiness } from '../core/engine/happiness';
import { sellMultiplier, sellPrice } from '../core/engine/pricing';
import type { Pig, SaveGame } from '../core/types';
import { formatDec, formatInt, t } from '../i18n/format';
import { vi } from '../i18n/vi';
import type { BoundAction } from '../store/gameStore';
import { troughFill, troughSpace, type ActionVm } from './actionsVm';
import { actionButton } from './components/actionButton';
import { openDialog } from './components/dialog';
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

export function openTroughDialog(host: HTMLElement, save: SaveGame, now: number, act: Act) {
  const d = openDialog(host, vi.trough.title);
  const space = troughSpace(save);
  const input = el('input', {
    class: 'c-input',
    attrs: { type: 'number', min: '1', max: String(Math.max(1, space)), value: String(space) },
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
  input.addEventListener('input', refresh);
  d.body.append(el('p', { class: 'c-dialog__hint', text: vi.trough.hint }), input, info);
  d.footer.append(slot);
  refresh();
}

/** §9.3: importing overwrites the current farm (which becomes a backup); confirm first. */
export function openImportDialog(host: HTMLElement, onConfirm: () => Promise<void>) {
  const d = openDialog(host, vi.settings.import);
  d.body.append(el('p', { class: 'c-dialog__warn', text: vi.settings.importWarning }));
  d.footer.append(
    el('button', {
      class: 'c-button',
      text: vi.action.confirm,
      attrs: { type: 'button' },
      on: { click: () => void onConfirm().finally(d.close) },
    }),
  );
}
