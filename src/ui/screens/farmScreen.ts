// Farm screen DOM side (§10.1, §11): toolbar and the selected pig panel. The pigs themselves are
// drawn and clicked on the Phaser canvas in .app__stage (src/game). Buying pigs lives in the shop.
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { farmActions } from '../actionsVm';
import { actionButton } from '../components/actionButton';
import { renderPigPanel, type PigPanelHandlers } from '../components/pigPanel';
import { el } from '../dom';

export interface FarmHandlers extends PigPanelHandlers {
  goShop: () => void;
}

function renderToolbar(save: SaveGame, now: number, on: FarmHandlers): HTMLElement | null {
  if (save.pigs.length === 0) return null;
  const a = farmActions(save, now);
  return el(
    'div',
    { class: 'farm__toolbar' },
    actionButton(a.cleanAll, () => on.act(a.cleanAll.run)),
  );
}

export function renderFarmScreen(
  save: SaveGame,
  now: number,
  selectedId: string | null,
  on: FarmHandlers,
): HTMLElement {
  const pigs = [...save.pigs].sort((a, b) => a.slotIndex - b.slotIndex);
  const selected = pigs.find((p) => p.id === selectedId) ?? null;

  const empty = pigs.length
    ? null
    : el(
        'div',
        { class: 'c-empty' },
        el('p', { text: vi.ui.farmEmpty }),
        el('button', {
          class: 'c-button',
          text: vi.nav.shop,
          attrs: { type: 'button' },
          on: { click: on.goShop },
        }),
      );

  return el(
    'div',
    { class: 'farm', data: { screen: 'farm' } },
    renderToolbar(save, now, on),
    el(
      'div',
      { class: 'farm__body' },
      empty,
      selected
        ? renderPigPanel(save, selected, now, on)
        : pigs.length
          ? el('p', { class: 'c-empty', text: vi.ui.selectPig })
          : null,
    ),
  );
}
