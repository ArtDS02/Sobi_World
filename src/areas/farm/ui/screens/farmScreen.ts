// Farm DOM pieces around the canvas (§10.1, §10.2, DECISIONS R05C-1): the pig popup body, the well
// popup (clean all), the empty-farm hint and the neighbour's help card (DECISIONS PG-1). The farm itself is drawn and clicked in src/game.
import { claimRelief } from '../../logic/actions/claimRelief';
import { reliefNeed } from '../../logic/relief';
import type { Pig, FarmGame } from '../../logic/types';
import { rewardText } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import type { BoundAction } from '../../store';
import { farmActions } from '../actionsVm';
import { actionButton } from '../components/actionButton';
import { renderPigPanel, type PigPanelHandlers } from '../components/pigPanel';
import { art } from '../../../../ui/components/icon';
import { el } from '../../../../ui/dom';

export function renderPigPopup(
  save: FarmGame,
  pig: Pig,
  now: number,
  on: PigPanelHandlers,
): HTMLElement {
  return el('div', { class: 'farm', data: { screen: 'farm' } }, renderPigPanel(save, pig, now, on));
}

export function renderWellPopup(
  save: FarmGame,
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

/**
 * Shown over the canvas: the neighbour's help while the farm is stuck (soft-lock, PG-1), else the
 * empty-farm hint.
 */
export function renderFarmHint(
  save: FarmGame,
  goShop: () => void,
  act: (run: BoundAction) => void,
): HTMLElement | null {
  const need = reliefNeed(save);
  if (need) {
    return el(
      'div',
      { class: 'app__hint app__hint--relief', data: { hint: 'relief' } },
      el('h3', { class: 'app__hint-title', text: vi.relief.title }),
      el('p', { text: need.gold > 0 ? vi.relief.start : vi.relief.food }),
      el('p', { class: 'app__hint-reward', text: rewardText(need) }),
      el('button', {
        class: 'c-button',
        text: vi.relief.claim,
        attrs: { type: 'button' },
        on: { click: () => act((s, c) => claimRelief(s, {}, c)) },
      }),
    );
  }
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
