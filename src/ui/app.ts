// App shell: top bar, current screen, bottom nav, toasts. Re-renders on every store notify.
import type { SaveGame } from '../core/types';
import { vi } from '../i18n/vi';
import type { GameStore, StoreSnapshot } from '../store/gameStore';
import { renderNavBar, type ScreenId } from './components/navBar';
import { createToaster } from './components/toast';
import { renderTopBar } from './components/topBar';
import { el } from './dom';
import { renderFarmScreen } from './screens/farmScreen';
import { renderPlaceholderScreen } from './screens/placeholderScreen';
import { renderMultiTabBanner, renderStatusScreen } from './screens/statusScreen';
import { eventToast } from './viewModel';

interface UiState {
  screen: ScreenId;
  selectedPigId: string | null;
}

export function mountApp(root: HTMLElement, store: GameStore, now: () => number): () => void {
  document.title = vi.app.title;
  const ui: UiState = { screen: 'farm', selectedPigId: null };
  const topbar = el('header', { class: 'topbar' });
  const banner = el('div', { class: 'app__banner' });
  const main = el('main', { class: 'app__main' });
  const navbar = el('nav', { class: 'navbar', attrs: { 'aria-label': vi.app.title } });
  const toasts = el('div', { class: 'c-toast-host', attrs: { 'aria-live': 'polite' } });
  root.replaceChildren(el('div', { class: 'app' }, topbar, banner, main, navbar, toasts));
  const toast = createToaster(toasts);

  let current: SaveGame | null = null;
  let previous: SaveGame | null = null;

  const go = (id: ScreenId) => {
    ui.screen = id;
    render(store.getSnapshot());
  };
  const select = (pigId: string) => {
    ui.selectedPigId = ui.selectedPigId === pigId ? null : pigId;
    render(store.getSnapshot());
  };

  function render(snap: StoreSnapshot) {
    banner.replaceChildren(snap.readOnly ? renderMultiTabBanner() : '');
    if (snap.status !== 'ready' || !snap.save) {
      topbar.replaceChildren();
      navbar.replaceChildren();
      main.replaceChildren(renderStatusScreen(snap.status === 'ready' ? 'loading' : snap.status));
      return;
    }
    topbar.replaceChildren(renderTopBar(snap.save, () => go('settings')));
    navbar.replaceChildren(renderNavBar(ui.screen, go));
    main.replaceChildren(
      ui.screen === 'farm'
        ? renderFarmScreen(snap.save, now(), ui.selectedPigId, select)
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

  render(store.getSnapshot());
  return () => {
    offState();
    offEvents();
  };
}
