// What the Adventure's screens share: the little local state they remember between two renders, what the controller hands them (the
// world, the roster, a way to act), and small DOM pieces (a bar, a toggle, a button that says why it is off).
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import { el } from '../../../ui/dom';
import type { BattleActionVm } from './battleVm';
import type { AdventureRun, ButtonVm } from './vmKit';

/** What the screens remember between two renders. */
export interface UiState {
  zoneId: string;
  /** Where the next trip starts (an area with a lit portal); null = the zone's entrance. */
  startMap: string | null;
  selected: string[];
  /** Rations the player chose to carry (item ids). */
  prep: string[];
  auto: boolean;
  fast: boolean;
  menu: 'skills' | 'items' | null;
  /** An action waiting for the player to choose who it is aimed at. */
  aim: { action: BattleActionVm; side: 'enemy' | 'ally' } | null;
  /** The thing in reach on the map (the scene says). */
  focus: string | null;
  showMap: boolean;
}

export interface ViewCtx {
  world: WorldSave;
  now: number;
  roster: readonly RosterEntry[];
  state: UiState;
  /** Draws the screens again (the local state changed). */
  rerender(): void;
  dispatch(run: AdventureRun): void;
  /** Runs `first`, then `then` (the summary's "take the reward"). */
  dispatchThen(first: AdventureRun, then: AdventureRun): void;
  give: (world: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult;
  openSheet(key: string): void;
  openPortal(): void;
  /** The key bound to "interact" (for the hint). */
  interactKey(): string;
}

export const bar = (percent: number, kind: string, label?: string) =>
  el(
    'span',
    { class: `c-bar adventure-ui__meter adventure-ui__meter--${kind}`, attrs: { role: 'progressbar', 'aria-valuenow': String(percent), ...(label ? { 'aria-label': label } : {}) } },
    el('span', { class: 'c-bar__fill', attrs: { style: `width: ${Math.max(0, Math.min(100, percent))}%` } }),
  );

export const toggle = (label: string, on: boolean, click: () => void) =>
  el('button', { class: `c-button c-button--ghost${on ? ' is-on' : ''}`, text: label, attrs: { type: 'button', 'aria-pressed': String(on) }, on: { click } });

/** A button that always says why it is off. */
export function actionButton(vm: ButtonVm, onClick: () => void, variant = ''): HTMLElement {
  const off = vm.reason !== null;
  return el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: `c-button ${variant}`.trim(),
      text: vm.label,
      attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true', title: vm.reason ?? '' } : {}) },
      on: { click: () => !off && onClick() },
    }),
    off ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}
