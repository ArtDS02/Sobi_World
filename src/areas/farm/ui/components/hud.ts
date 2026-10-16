// Which top bar the player sees: the plaza's (money and four buttons) or an Area's (gauges and dock).
import type { PanelId } from '../../../../ui/components/popup';
import type { FarmGame } from '../../logic/types';
import { renderPlazaBar, type PlazaBarDeps } from './plazaBar';
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
  /** What only the plaza's HUD needs (level, dock, art); absent in an Area. */
  plaza?: Pick<PlazaBarDeps, 'level' | 'doors' | 'hasArt' | 'door'> | undefined;
}

export function renderHud(save: FarmGame, d: HudDeps): HTMLElement {
  if (d.place === 'plaza') {
    const p = d.plaza ?? { level: null, doors: [], hasArt: () => false, door: () => {} };
    return renderPlazaBar(save, {
      ...p,
      gems: d.gems,
      menu: () => d.go('menu'),
      items: () => d.go('inventory'),
      collection: () => d.go('collection'),
    });
  }
  return renderTopBar(save, d.now, {
    menu: () => d.go('menu'),
    ...(d.leave ? { home: d.leave } : {}),
    trough: d.openTrough,
    history: () => d.go('history'),
    nav: d.go,
    pig: d.selectPig,
    goalsDot: d.goalsDot ?? 0,
  });
}
