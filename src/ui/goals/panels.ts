// The popups of the world's goals (spec V2 §9): orders (the plaza's board and the farm's pig orders in tabs),
// goals and achievements, the Codex. The shell hands in what it owns (the farm's orders screen, the tab state).
import type { AssetRegistry } from '../../core/assets/registry';
import type { CodexKind } from '../../core/collection/codex';
import type { Goals, WorldAction } from '../../core/goals/api';
import type { WorldSave } from '../../core/save/world';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { localDay } from '../localDay';
import { achievementsVm, boardVm, codexVm, dailyGoalsVm, loginVm } from './goalsVm';
import { renderBoard, renderCodex, renderGoals } from './goalsScreens';

export type OrdersTab = 'board' | 'farm';

export interface WorldPanelDeps {
  world: WorldSave;
  goals: Goals;
  codexKinds: readonly CodexKind[];
  assets: AssetRegistry | null;
  now: number;
  act: (run: WorldAction) => void;
}

/** The orders popup: the world's board first, the farm's own orders on the other tab. */
export function renderOrdersPanel(d: WorldPanelDeps, tab: OrdersTab, setTab: (tab: OrdersTab) => void, farmOrders: HTMLElement): HTMLElement {
  const button = (id: OrdersTab, label: string) =>
    el('button', {
      class: `c-button orders__tab${tab === id ? ' is-active' : ' c-button--ghost'}`,
      text: label,
      attrs: { type: 'button', 'aria-pressed': String(tab === id) },
      on: { click: () => setTab(id) },
    });
  return el(
    'div',
    { class: 'orders-panel', data: { screen: 'orders' } },
    el('div', { class: 'orders__tabs' }, button('board', vi.board.tabBoard), button('farm', vi.board.tabFarm)),
    tab === 'board' ? renderBoard(boardVm(d.world, d.goals, d.now), d.act) : farmOrders,
  );
}

export const renderGoalsPanel = (d: WorldPanelDeps): HTMLElement =>
  renderGoals(dailyGoalsVm(d.world, d.goals, d.now), loginVm(d.world, d.goals, localDay(d.now)), achievementsVm(d.world, d.goals), d.act);

export const renderCodexPanel = (d: WorldPanelDeps): HTMLElement => renderCodex(codexVm(d.world, d.goals, d.codexKinds, d.assets), d.act);
