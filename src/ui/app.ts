// App shell (DECISIONS R05C-1): top bar, the farm canvas filling the window, one popup at a time
// opened by clicking world objects, toasts, dialogs. Re-renders on store notify.
import { openGift } from '../core/actions/openGift';
import { decorBonus } from '../core/engine/decor';
import type { Pig, SaveGame } from '../core/types';
import { vi } from '../i18n/vi';
import type { BoundAction, GameStore, StoreSnapshot } from '../store/gameStore';
import { troughSpace, type ActionVm } from './actionsVm';
import {
  closePopupShell,
  createPopupShell,
  type PanelId,
  type PopupShell,
} from './components/popup';
import { createToaster } from './components/toast';
import { renderTopBar } from './components/topBar';
import {
  openBreedDialog,
  openBuyItemDialog,
  openOrderDialog,
  openRenameDialog,
  openSellDialog,
  openTroughDialog,
} from './dialogs';
import type { AppOptions, FarmPick, MountedApp } from './appTypes';
import { setIconSource } from './components/icon';
import { el, patch } from './dom';
import { renderFarmHint, renderPigPopup, renderWellPopup } from './screens/farmScreen';
import { renderHistoryScreen } from './screens/historyScreen';
import { renderInventoryScreen } from './screens/inventoryScreen';
import { renderAchievementsScreen } from './screens/achievementsScreen';
import { renderCollectionScreen } from './screens/collectionScreen';
import { renderOrdersScreen } from './screens/ordersScreen';
import { renderSettingsScreen } from './screens/settingsScreen';
import { settingsHandlers } from './settingsHandlers';
import { renderShopScreen, type ShopHandlers, type ShopTab } from './screens/shopScreen';
import { renderMultiTabBanner, renderStatusScreen } from './screens/statusScreen';
import { createSession } from './session';

interface UiState {
  panel: PanelId | null;
  selectedPigId: string | null;
  shopTab: ShopTab;
}

export type { AppOptions, FarmCanvas, FarmPick, FarmPickAction, MountedApp } from './appTypes';

export function mountApp(
  root: HTMLElement,
  store: GameStore,
  now: () => number,
  opts: AppOptions = {},
): MountedApp {
  document.title = vi.app.title;
  setIconSource(opts.assets ? (id) => opts.assets?.url(id) ?? null : null);
  const ui: UiState = { panel: null, selectedPigId: null, shopTab: 'pigs' };
  const topbar = el('header', { class: 'topbar' });
  const banner = el('div', { class: 'app__banner' });
  const saveBanner = el('div', { class: 'app__banner' });
  // Fixed host for the Phaser canvas: never passed to patch(), so it is never replaced.
  const stage = el('div', { class: 'app__stage' });
  const hint = el('div', { class: 'app__hint-host' });
  const coach = el('div', { class: 'app__coach-host' });
  const appEl = el('div', { class: 'app' });
  // Status screens (loading / recovery) only; the game itself is the canvas plus popups.
  const main = el('main', { class: 'app__main' });
  const popupHost = el('div', { class: 'app__popup' });
  let popup: PopupShell | null = null;
  const toasts = el('div', { class: 'c-toast-host', attrs: { 'aria-live': 'polite' } });
  const dialogs = el('div', { class: 'app__dialogs' });
  // The HUD floats over the farm (farm layout rework); banners stay above it in the flow.
  appEl.append(
    banner,
    saveBanner,
    opts.devTools ?? '',
    el('div', { class: 'app__world' }, stage, topbar, hint, coach),
    main,
    popupHost,
    toasts,
    dialogs,
  );
  root.replaceChildren(appEl);
  const toast = createToaster(toasts);

  const rerender = () => render(store.getSnapshot());
  /** Dispatch; a rejection reaches the FeedbackDirector through store.onReject (§11.3). */
  const assets = opts.assets ?? null;
  const act = async (run: BoundAction): Promise<boolean> => (await store.dispatch(run)).ok;
  const handlers = {
    act: (run: BoundAction) => void act(run),
    sell: (pig: Pig, vm: ActionVm) => {
      const save = store.getSnapshot().save;
      openSellDialog(dialogs, pig, vm, act, save ? decorBonus(save) : 0);
    },
    rename: (pig: Pig) => openRenameDialog(dialogs, pig, act),
    breed: (pig: Pig) => {
      const save = store.getSnapshot().save;
      if (save) openBreedDialog(dialogs, save, pig, now(), act);
    },
  };
  // Canvas click: a pig opens its panel, a world object its popup, empty ground deselects (§11.2).
  const onPick = (pick: FarmPick) => {
    if (pick.kind === 'pig') {
      opts.onPigTap?.(pick.pigId);
      ui.selectedPigId = pick.pigId;
      go('pig');
    } else if (pick.kind === 'gift') {
      handlers.act((s, c) => openGift(s, { giftId: pick.giftId }, c));
    } else if (pick.kind === 'ground') {
      if (ui.selectedPigId === null) return;
      ui.selectedPigId = null;
      rerender();
    } else if (pick.action === 'trough') openTrough();
    else go(pick.action === 'cleanAll' ? 'well' : pick.action);
  };
  const farm = opts.farm?.(stage, onPick) ?? null;
  // Reads the latest save at click time: the top bar is only re-rendered when its text changes.
  const openTrough = (units?: number) => {
    const save = store.getSnapshot().save;
    if (save) openTroughDialog(dialogs, save, now(), act, units);
  };
  const shop: ShopHandlers = {
    act: handlers.act,
    tab: (tab) => {
      ui.shopTab = tab;
      rerender();
    },
    buyItem: (productId) => {
      const save = store.getSnapshot().save;
      if (save) openBuyItemDialog(dialogs, save, productId, now(), act);
    },
  };
  const inventory = {
    fillTrough: () => {
      const save = store.getSnapshot().save;
      if (save) openTrough(Math.min(save.inventory.FOOD_BASIC, troughSpace(save)));
    },
  };
  const settings = settingsHandlers({
    store,
    now,
    act: handlers.act,
    dialogHost: dialogs,
    ...(opts.dialogs ? { files: opts.dialogs } : {}),
    ...(opts.saveFolder ? { saveFolder: true } : {}),
    onRestored: () => session.loadBackups(),
  });
  const session = createSession({
    store,
    now,
    act: handlers.act,
    dialogHost: dialogs,
    rerender,
    settings,
    manifest: assets?.manifest ?? null,
    version: opts.version ?? null,
    hasBackups: !!opts.hasBackups,
  });
  const go = (id: PanelId | null) => {
    ui.panel = id;
    if (id !== 'pig') ui.selectedPigId = null;
    if (id === 'settings') session.loadBackups();
    rerender();
  };
  // Esc closes the popup unless a dialog sits on top of it (the dialog handles its own Esc).
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && ui.panel && dialogs.childElementCount === 0) go(null);
  };
  document.addEventListener('keydown', onKey);

  /** Body of the open popup, or null when it cannot show (e.g. the selected pig was sold). */
  function renderPanel(save: SaveGame, panel: PanelId): HTMLElement | null {
    switch (panel) {
      case 'pig': {
        const pig = save.pigs.find((p) => p.id === ui.selectedPigId);
        return pig ? renderPigPopup(save, pig, now(), handlers) : null;
      }
      case 'well':
        return renderWellPopup(save, now(), handlers.act);
      case 'shop':
        return renderShopScreen(save, now(), ui.shopTab, shop, assets);
      case 'inventory':
        return renderInventoryScreen(save, inventory);
      case 'history':
        return renderHistoryScreen(save);
      case 'orders':
        return renderOrdersScreen(save, now(), {
          deliver: (card) => openOrderDialog(dialogs, card, act),
        });
      case 'settings':
        return renderSettingsScreen(save, session.settingsVm(save), settings);
      case 'collection':
        return renderCollectionScreen(save, assets);
      case 'achievements':
        return renderAchievementsScreen(save, now(), handlers.act);
    }
  }

  function renderPopup(save: SaveGame | null) {
    const body = save && ui.panel ? renderPanel(save, ui.panel) : null;
    if (!body || !ui.panel) {
      if (ui.panel) ui.panel = null; // nothing left to show
      if (popup) closePopupShell(popup, appEl.classList.contains('is-reduced-motion'));
      popup = null;
      return;
    }
    if (popup?.panel !== ui.panel) {
      const label =
        ui.panel === 'pig' ? vi.app.title : ui.panel === 'well' ? vi.farm.cleanAll : vi.nav[ui.panel];
      popup = createPopupShell(ui.panel, label, () => go(null));
      popupHost.replaceChildren(popup.root);
    }
    patch(popup.body, body);
  }

  function render(snap: StoreSnapshot) {
    const ready = snap.status === 'ready' && !!snap.save;
    appEl.classList.toggle('is-ready', ready);
    appEl.classList.toggle('is-reduced-motion', !!snap.save?.settings.reduceMotion);
    farm?.setSelected(ui.selectedPigId);
    patch(banner, snap.readOnly ? renderMultiTabBanner() : null);
    patch(saveBanner, session.banners(snap));
    if (snap.status !== 'ready' || !snap.save) {
      patch(topbar, null);
      patch(hint, null);
      patch(coach, null);
      renderPopup(null);
      patch(
        main,
        snap.status === 'recovery'
          ? session.recovery()
          : renderStatusScreen(snap.status === 'ready' ? 'loading' : snap.status),
      );
      farm?.setVisible(false);
      return;
    }
    const save = snap.save;
    patch(
      topbar,
      renderTopBar(save, now(), {
        settings: () => go('settings'),
        trough: () => openTrough(),
        history: () => go('history'),
        nav: (panel) => go(panel),
      }),
    );
    patch(coach, session.coach(snap));
    patch(main, null);
    farm?.setVisible(true); // after main is emptied, so the canvas measures its final host
    patch(
      hint,
      renderFarmHint(save, () => go('shop'), handlers.act),
    );
    renderPopup(save);
  }

  const offState = store.subscribe(render);

  rerender();
  return {
    toast,
    showAway: session.showAway,
    dispose: () => {
      offState();
      document.removeEventListener('keydown', onKey);
      farm?.destroy();
    },
  };
}
