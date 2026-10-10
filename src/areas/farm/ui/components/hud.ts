// Which top bar the player sees: the plaza's (money and four buttons) or an Area's (gauges and dock).
import type { PanelId } from '../../../../ui/components/popup';
import type { FarmGame } from '../../logic/types';
import { renderPlazaBar } from './plazaBar';
import { renderTopBar } from './topBar';

export interface HudDeps {
  place: 'plaza' | 'area';
  now: number;
  gems: number | null;
  go: (panel: PanelId) => void;
  leave: (() => void) | undefined;
  openTrough: () => void;
  selectPig: (pigId: string) => void;
  /** Rewards waiting in the goals panel (the dock dot); absent = none. */
  goalsDot?: number | undefined;
}

export function renderHud(save: FarmGame, d: HudDeps): HTMLElement {
  if (d.place === 'plaza') return renderPlazaBar(save, d.gems, { menu: () => d.go('menu'), items: () => d.go('inventory') });
  return renderTopBar(save, d.now, {
    settings: () => d.go('settings'),
    ...(d.leave ? { home: d.leave } : {}),
    trough: d.openTrough,
    history: () => d.go('history'),
    nav: d.go,
    pig: d.selectPig,
    goalsDot: d.goalsDot ?? 0,
  });
}
