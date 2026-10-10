// What the Aquarium's dialogs share: the button that says why it is off, the need bar, and the "live" dialog — one
// open at a time, its body rebuilt from the world on every change so its numbers stay true.
import { openDialog } from '../../../ui/components/dialog';
import { el, patch } from '../../../ui/dom';
import { localOffsetMs } from '../../../ui/localDay';
import type { EventBase } from '../../../core/events';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import type { AquariumRun, ButtonVm } from './aquariumVm';

/** A button that always says why it is off. */
export function actionButton(vm: ButtonVm, onClick: () => void, variant = ''): HTMLElement {
  const off = vm.reason !== null;
  return el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: `c-button ${variant}`.trim(),
      text: vm.label,
      attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}) },
      on: { click: () => !off && onClick() },
    }),
    off ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}

/** A labelled bar (hunger, cleanliness, growth, water). */
export const needBar = (label: string, percent: number, tone = ''): HTMLElement =>
  el(
    'div',
    { class: 'aquarium-dialog__need' },
    el('span', { text: label }),
    el('span', { class: 'c-bar', attrs: { role: 'progressbar', 'aria-valuenow': String(percent) } }, el('span', { class: `c-bar__fill ${tone}`.trim(), attrs: { style: `width: ${percent}%` } })),
  );

export interface AquariumDialogsDeps {
  /** Where dialogs open (one at a time). */
  host: HTMLElement;
  world: () => WorldSave | null;
  now: () => number;
  /** Runs an action and answers with its events (the rod's result is read from them). */
  dispatch: (run: AquariumRun) => Promise<{ ok: boolean; events?: readonly EventBase[] }>;
  /** Plays a frame callback; returns the cancel. Absent in tests (the rod's marker then stays put). */
  frame?: (fn: () => void) => () => void;
}

/** What each dialog file gets to open itself and act. */
export interface DialogKit {
  open(title: string, render: (w: WorldSave, close: () => void) => HTMLElement | null): void;
  world(): WorldSave | null;
  now(): number;
  offset(): number;
  /** Fire and forget: the world change redraws the open dialog. */
  run(action: AquariumRun): void;
  dispatch: AquariumDialogsDeps['dispatch'];
  /** Redraws the open dialog now (local state of the dialog changed). */
  redraw(): void;
  /** Runs fn every frame while this dialog is open. */
  onFrame(fn: () => void): void;
}

export function createDialogKit(d: AquariumDialogsDeps) {
  /** The open dialog's body renderer; re-run on every world change. */
  let live: { body: HTMLElement; render: (w: WorldSave) => HTMLElement | null } | null = null;
  let stopFrames: (() => void) | null = null;
  const stop = () => {
    stopFrames?.();
    stopFrames = null;
  };

  const kit: DialogKit = {
    open(title, render) {
      const w = d.world();
      if (!w) return;
      stop();
      const handle = openDialog(d.host, title, vi.aquarium.close);
      const draw = (now: WorldSave) => render(now, handle.close);
      live = { body: handle.body, render: draw };
      patch(handle.body, draw(w));
    },
    world: d.world,
    now: d.now,
    offset: () => localOffsetMs(d.now()),
    run: (action) => void d.dispatch(action),
    dispatch: d.dispatch,
    redraw() {
      const w = d.world();
      if (w && live) patch(live.body, live.render(w));
    },
    onFrame(fn) {
      if (d.frame) stopFrames = d.frame(fn);
    },
  };

  return {
    kit,
    /** The world changed: the open dialog follows it (and is forgotten once the player closed it). */
    follow(w: WorldSave) {
      if (!live) return;
      if (d.host.childElementCount === 0) {
        live = null;
        stop();
      } else patch(live.body, live.render(w));
    },
    close() {
      live = null;
      stop();
      d.host.replaceChildren();
    },
    isOpen: () => d.host.childElementCount > 0,
  };
}
