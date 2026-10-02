// Farm DOM pieces around the canvas (§10.1, §10.2, DECISIONS R05C-1): the pig popup body, the well
// popup (clean all) and the empty-farm hint. The farm itself is drawn and clicked in src/game.
import type { Pig, SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import type { BoundAction } from '../../store/gameStore';
import { farmActions } from '../actionsVm';
import { actionButton } from '../components/actionButton';
import { renderPigPanel, type PigPanelHandlers } from '../components/pigPanel';
import { art } from '../components/icon';
import { el } from '../dom';

export function renderPigPopup(
  save: SaveGame,
  pig: Pig,
  now: number,
  on: PigPanelHandlers,
): HTMLElement {
  return el('div', { class: 'farm', data: { screen: 'farm' } }, renderPigPanel(save, pig, now, on));
}

export function renderWellPopup(
  save: SaveGame,
  now: number,
  act: (run: BoundAction) => void,
): HTMLElement {
  const a = farmActions(save, now);
  return el(
    'div',
    { class: 'farm', data: { screen: 'farm' } },
    art('prop_water_well', 'farm__art'),
    el('p', { class: 'farm__hint', text: vi.farm.wellHint }),
    el(
      'div',
      { class: 'farm__toolbar' },
      actionButton(a.cleanAll, () => act(a.cleanAll.run), '', 'cleanAll'),
    ),
  );
}

/** Shown over the canvas while the farm has no pig. */
export function renderFarmHint(save: SaveGame, goShop: () => void): HTMLElement | null {
  if (save.pigs.length > 0) return null;
  return el(
    'div',
    { class: 'app__hint' },
    el('p', { text: vi.ui.farmEmpty }),
    el('button', {
      class: 'c-button',
      text: vi.farm.shop,
      attrs: { type: 'button' },
      on: { click: goShop },
    }),
  );
}
