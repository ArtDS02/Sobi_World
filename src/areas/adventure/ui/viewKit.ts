// What the Adventure's screens share: the little local state they remember between two renders, what the controller hands
// them (the world, the roster, a way to act), and two small DOM pieces (a bar, a toggle button).
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import { el } from '../../../ui/dom';
import type { BattleActionVm } from './battleVm';
import type { AdventureRun } from './vmKit';

/** What the screens remember between two renders. */
export interface UiState {
  zoneId: string;
  selected: string[];
  auto: boolean;
  fast: boolean;
  menu: 'skills' | 'items' | null;
  /** An action waiting for the player to choose who it is aimed at. */
  aim: { action: BattleActionVm; side: 'enemy' | 'ally' } | null;
}

export interface ViewCtx {
  world: WorldSave;
  now: number;
  roster: readonly RosterEntry[];
  state: UiState;
  /** Draws the screens again (the local state changed). */
  rerender(): void;
  dispatch(run: AdventureRun): void;
  /** Runs `first`, then `then` (the summary's "take the reward and go home"). */
  dispatchThen(first: AdventureRun, then: AdventureRun): void;
  give: (world: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult;
  openGear(key: string): void;
}

export const bar = (percent: number, kind: string) =>
  el('span', { class: `c-bar adventure-ui__meter adventure-ui__meter--${kind}`, attrs: { role: 'progressbar', 'aria-valuenow': String(percent) } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${percent}%` } }));

export const toggle = (label: string, on: boolean, click: () => void) =>
  el('button', { class: `c-button c-button--ghost${on ? ' is-on' : ''}`, text: label, attrs: { type: 'button', 'aria-pressed': String(on) }, on: { click } });

