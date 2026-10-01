// App shell: top bar, current screen, bottom nav, toasts, dialogs. Re-renders on store notify.
import type { Pig, SaveGame } from '../core/types';
import { vi } from '../i18n/vi';
import type { BoundAction, GameStore, StoreSnapshot } from '../store/gameStore';
import type { ActionVm } from './actionsVm';
import { renderNavBar, type ScreenId } from './components/navBar';
import { createToaster } from './components/toast';
import { renderTopBar } from './components/topBar';
import { openRenameDialog, openSellDialog, openTroughDialog } from './dialogs';
import { el } from './dom';
import { renderFarmScreen } from './screens/farmScreen';
import { renderPlaceholderScreen } from './screens/placeholderScreen';
import { renderMultiTabBanner, renderStatusScreen } from './screens/statusScreen';
import { eventToast } from './viewModel';

interface UiState {
  screen: ScreenId;
  selectedPigId: string | null;
}

export interface AppOptions {
  /** Dev-only toolbar (time travel), injected by main.ts behind import.meta.env.DEV. */
  devTools?: HTMLElement;
}

/** Replace children only when the markup changed, so a click is never lost to a 1 s re-render. */
function patch(host: HTMLElement, next: HTMLElement | null) {
  const prev = host.firstElementChild;
  if (next === null) {
    if (prev) host.replaceChildren();
    return;
  }
  if (prev && prev.outerHTML === next.outerHTML) return;
  host.replaceChildren(next);
}

export function mountApp(
  root: HTMLElement,
  store: GameStore,
  now: () => number,
  opts: AppOptions = {},
): () => void {
  document.title = vi.app.title;
  const ui: UiState = { screen: 'farm', selectedPigId: null };
  const topbar = el('header', { class: 'topbar' });
  const banner = el('div', { class: 'app__banner' });
  const main = el('main', { class: 'app__main' });
  const navbar = el('nav', { class: 'navbar', attrs: { 'aria-label': vi.app.title } });
  const toasts = el('div', { class: 'c-toast-host', attrs: { 'aria-live': 'polite' } });
  const dialogs = el('div', { class: 'app__dialogs' });
  root.replaceChildren(
    el('div', { class: 'app' }, topbar, banner, opts.devTools ?? '', main, navbar, toasts, dialogs),
  );
  const toast = createToaster(toasts);

  let current: SaveGame | null = null;
  let previous: SaveGame | null = null;

  const rerender = () => render(store.getSnapshot());
  /** Dispatch; an error becomes a toast (buttons normally prevent it). */
  const act = async (run: BoundAction): Promise<boolean> => {
    const r = await store.dispatch(run);
    if (!r.ok) toast(vi.error[r.error]);
    return r.ok;
  };
  const handlers = {
    act: (run: BoundAction) => void act(run),
    select: (pigId: string) => {
      ui.selectedPigId = ui.selectedPigId === pigId ? null : pigId;
      rerender();
    },
    sell: (pig: Pig, vm: ActionVm) => openSellDialog(dialogs, pig, vm, act),
    rename: (pig: Pig) => openRenameDialog(dialogs, pig, act),
  };
  // Reads the latest save at click time: the top bar is only re-rendered when its text changes.
  const openTrough = () => {
    const save = store.getSnapshot().save;
    if (save) openTroughDialog(dialogs, save, now(), act);
  };
  const go = (id: ScreenId) => {
    ui.screen = id;
    rerender();
  };

  function render(snap: StoreSnapshot) {
    patch(banner, snap.readOnly ? renderMultiTabBanner() : null);
    if (snap.status !== 'ready' || !snap.save) {
      patch(topbar, null);
      patch(navbar, null);
      patch(main, renderStatusScreen(snap.status === 'ready' ? 'loading' : snap.status));
      return;
    }
    const save = snap.save;
    patch(topbar, renderTopBar(save, { settings: () => go('settings'), trough: openTrough }));
    patch(navbar, renderNavBar(ui.screen, go));
    patch(
      main,
      ui.screen === 'farm'
        ? renderFarmScreen(save, now(), ui.selectedPigId, handlers)
        : renderPlaceholderScreen(ui.screen),
    );
  }

  const offState = store.subscribe((snap) => {
    previous = current;
    current = snap.save;
    render(snap);
  });
  const offEvents = store.onEvents((events) => {
    if (!current) return;
    for (const e of events) {
      const text = eventToast(e, current, previous ?? current);
      if (text) toast(text);
    }
  });

  rerender();
  return () => {
    offState();
    offEvents();
  };
}
