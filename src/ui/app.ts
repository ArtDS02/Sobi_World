// App shell (DECISIONS R05C-1): top bar, the farm canvas filling the window, one popup at a time
// opened by clicking world objects, toasts, dialogs. Re-renders on store notify.
import type { AssetRegistry } from '../core/assets/registry';
import { exportSave } from '../core/save/exportImport';
import type { FileDialogs } from '../core/save/port';
import type { Pig, SaveGame } from '../core/types';
import { vi } from '../i18n/vi';
import type { BoundAction, GameStore, StoreSnapshot } from '../store/gameStore';
import { troughSpace, type ActionVm } from './actionsVm';
import { createPopupShell, type PanelId, type PopupShell } from './components/popup';
import { createToaster } from './components/toast';
import { renderTopBar } from './components/topBar';
import {
  openBreedDialog,
  openBuyItemDialog,
  openImportDialog,
  openRenameDialog,
  openSellDialog,
  openTroughDialog,
} from './dialogs';
import { el } from './dom';
import { renderFarmHint, renderPigPopup, renderWellPopup } from './screens/farmScreen';
import { renderHistoryScreen } from './screens/historyScreen';
import { renderInventoryScreen } from './screens/inventoryScreen';
import { renderPlaceholderScreen } from './screens/placeholderScreen';
import { renderSettingsScreen, type SettingsHandlers } from './screens/settingsScreen';
import { renderShopScreen, type ShopHandlers, type ShopTab } from './screens/shopScreen';
import {
  renderMultiTabBanner,
  renderSaveErrorBanner,
  renderStatusScreen,
} from './screens/statusScreen';

interface UiState {
  panel: PanelId | null;
  selectedPigId: string | null;
  shopTab: ShopTab;
}

export interface AppOptions {
  /** Dev-only toolbar (time travel), injected by main.ts behind import.meta.env.DEV. */
  devTools?: HTMLElement;
  /** Platform export/import dialogs (§9.3). */
  dialogs?: FileDialogs;
  /** The platform has a save folder to open (desktop). */
  saveFolder?: boolean;
  /** Validated asset manifest (§11.4); the farm canvas and thumbnails resolve ids here. */
  assets?: AssetRegistry;
  /** Mounts the Phaser farm into the stage (main.ts injects src/game; absent in DOM tests). */
  farm?: (host: HTMLElement, onPick: (pick: FarmPick) => void) => FarmCanvas;
}

/** World object actions (manifest layout.placements[].action). */
export type FarmPickAction = 'shop' | 'inventory' | 'orders' | 'collection' | 'trough' | 'cleanAll';
/** A click on the canvas: a pig, a world object, or empty ground. */
export type FarmPick =
  { kind: 'pig'; pigId: string } | { kind: 'action'; action: FarmPickAction } | { kind: 'ground' };

export interface MountedApp {
  /** The DOM toast host; only the FeedbackDirector calls it (§11.3). */
  toast: (message: string) => void;
  dispose: () => void;
}

/** What the shell needs from the farm canvas (implemented by src/game/farmView.ts). */
export interface FarmCanvas {
  setSelected(pigId: string | null): void;
  setVisible(visible: boolean): void;
  destroy(): void;
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
): MountedApp {
  document.title = vi.app.title;
  const ui: UiState = { panel: null, selectedPigId: null, shopTab: 'pigs' };
  const topbar = el('header', { class: 'topbar' });
  const banner = el('div', { class: 'app__banner' });
  const saveBanner = el('div', { class: 'app__banner' });
  // Fixed host for the Phaser canvas: never passed to patch(), so it is never replaced.
  const stage = el('div', { class: 'app__stage' });
  const hint = el('div', { class: 'app__hint-host' });
  const appEl = el('div', { class: 'app' });
  // Status screens (loading / recovery) only; the game itself is the canvas plus popups.
  const main = el('main', { class: 'app__main' });
  const popupHost = el('div', { class: 'app__popup' });
  let popup: PopupShell | null = null;
  const toasts = el('div', { class: 'c-toast-host', attrs: { 'aria-live': 'polite' } });
  const dialogs = el('div', { class: 'app__dialogs' });
  appEl.append(
    topbar,
    banner,
    saveBanner,
    opts.devTools ?? '',
    el('div', { class: 'app__world' }, stage, hint),
    main,
    popupHost,
    toasts,
    dialogs,
  );
  root.replaceChildren(appEl);
  const toast = createToaster(toasts);

  const rerender = () => render(store.getSnapshot());
  /** Dispatch; a rejection reaches the FeedbackDirector through store.onReject (§11.3). */
  const act = async (run: BoundAction): Promise<boolean> => (await store.dispatch(run)).ok;
  const handlers = {
    act: (run: BoundAction) => void act(run),
    sell: (pig: Pig, vm: ActionVm) => openSellDialog(dialogs, pig, vm, act),
    rename: (pig: Pig) => openRenameDialog(dialogs, pig, act),
    breed: (pig: Pig) => {
      const save = store.getSnapshot().save;
      if (save) openBreedDialog(dialogs, save, pig, now(), act);
    },
  };
  // Canvas click: a pig opens its panel, a world object its popup, empty ground deselects (§11.2).
  const onPick = (pick: FarmPick) => {
    if (pick.kind === 'pig') {
      ui.selectedPigId = pick.pigId;
      go('pig');
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
    buyItem: (itemId) => {
      const save = store.getSnapshot().save;
      if (save) openBuyItemDialog(dialogs, save, itemId, now(), act);
    },
  };
  const inventory = {
    fillTrough: () => {
      const save = store.getSnapshot().save;
      if (save) openTrough(Math.min(save.inventory.FOOD_BASIC, troughSpace(save)));
    },
  };
  const settings: SettingsHandlers = {
    exportSave: () => {
      const save = store.getSnapshot().save;
      if (!save || !opts.dialogs) return;
      const at = now();
      const out = exportSave(save, new Date(at));
      void opts.dialogs.exportSave(out.json, out.fileName).then((ok) => {
        if (ok) void store.markExported(at);
      });
    },
    importSave: () => {
      const dialogsPort = opts.dialogs;
      if (!dialogsPort) return;
      openImportDialog(dialogs, async () => {
        const json = await dialogsPort.importSave();
        if (json === null) return;
        await store.importSave(json); // a rejection is toasted by the FeedbackDirector
      });
    },
    openSaveFolder:
      opts.saveFolder && opts.dialogs ? () => void opts.dialogs?.openSaveFolder() : null,
  };
  const go = (id: PanelId | null) => {
    ui.panel = id;
    if (id !== 'pig') ui.selectedPigId = null;
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
        return renderShopScreen(save, now(), ui.shopTab, shop);
      case 'inventory':
        return renderInventoryScreen(save, inventory);
      case 'history':
        return renderHistoryScreen(save);
      case 'settings':
        return renderSettingsScreen(settings);
      default:
        return renderPlaceholderScreen(panel);
    }
  }

  function renderPopup(save: SaveGame | null) {
    const body = save && ui.panel ? renderPanel(save, ui.panel) : null;
    if (!body || !ui.panel) {
      if (ui.panel) ui.panel = null; // nothing left to show
      popup = null;
      patch(popupHost, null);
      return;
    }
    if (popup?.panel !== ui.panel) {
      const label = ui.panel === 'pig' || ui.panel === 'well' ? vi.app.title : vi.nav[ui.panel];
      popup = createPopupShell(ui.panel, label, () => go(null));
      popupHost.replaceChildren(popup.root);
    }
    patch(popup.body, body);
  }

  function render(snap: StoreSnapshot) {
    const ready = snap.status === 'ready' && !!snap.save;
    appEl.classList.toggle('is-ready', ready);
    farm?.setSelected(ui.selectedPigId);
    patch(banner, snap.readOnly ? renderMultiTabBanner() : null);
    patch(saveBanner, snap.saveError ? renderSaveErrorBanner() : null);
    if (snap.status !== 'ready' || !snap.save) {
      patch(topbar, null);
      patch(hint, null);
      renderPopup(null);
      patch(main, renderStatusScreen(snap.status === 'ready' ? 'loading' : snap.status));
      farm?.setVisible(false);
      return;
    }
    const save = snap.save;
    patch(
      topbar,
      renderTopBar(save, {
        settings: () => go('settings'),
        trough: () => openTrough(),
        history: () => go('history'),
      }),
    );
    patch(main, null);
    farm?.setVisible(true); // after main is emptied, so the canvas measures its final host
    patch(
      hint,
      renderFarmHint(save, () => go('shop')),
    );
    renderPopup(save);
  }

  const offState = store.subscribe(render);

  rerender();
  return {
    toast,
    dispose: () => {
      offState();
      document.removeEventListener('keydown', onKey);
      farm?.destroy();
    },
  };
}
