// App shell (DECISIONS R05C-1): top bar, the farm canvas filling the window, one popup at a time
// opened by clicking world objects, toasts, dialogs. Re-renders on store notify.
import { openGift } from '../logic/actions/openGift';
import { penMood } from '../logic/decor';
import type { Pig, FarmGame } from '../logic/types';
import { vi } from '../../../i18n/vi';
import type { BoundAction, FarmStore, FarmSnapshot } from '../store';
import type { ActionVm } from './actionsVm';
import {
  closePopupShell,
  createPopupShell,
  type PanelId,
  type PopupShell,
} from '../../../ui/components/popup';
import { createToaster } from '../../../ui/components/toast';
import { renderHud } from './components/hud';
import { openBreedDialog } from './breedDialog';
import type { FarmGoto } from '../logic/summary';
import type { AppOptions, FarmPick, MountedApp, Place } from './appTypes';
import { setIconSource } from '../../../ui/components/icon';
import { el, patch } from '../../../ui/dom';
import { goalsDot } from '../../../ui/goals/goalsVm';
import { createGuideLayer } from '../../../ui/goals/guideLayer';
import type { OrdersTab } from '../../../ui/goals/panels';
import { localDay } from '../../../ui/localDay';
import { openRenameDialog, openSellDialog, openTroughDialog } from './dialogs';
import { renderFarmHint } from './screens/farmScreen';
import type { ShopTab } from './screens/shopScreen';
import { settingsHandlers } from './settingsHandlers';
import { panelHandlers } from './panelHandlers';
import { renderPanel, type PanelCtx } from './panels';
import { renderMultiTabBanner, renderStatusScreen } from './screens/statusScreen';
import { bindHotkeys } from './hotkeys';
import { createSession } from './session';

interface UiState {
  place: Place;
  panel: PanelId | null;
  selectedPigId: string | null;
  shopTab: ShopTab;
  /** The orders panel: the plaza's board or the farm's pig orders. */
  ordersTab: OrdersTab;
}

export type { AppOptions, FarmCanvas, FarmPick, FarmPickAction, MountedApp } from './appTypes';

export function mountApp(
  root: HTMLElement,
  store: FarmStore,
  now: () => number,
  opts: AppOptions = {},
): MountedApp {
  document.title = vi.app.title;
  setIconSource(opts.assets ? (id) => opts.assets?.url(id) ?? null : null);
  const ui: UiState = { place: 'area', panel: null, selectedPigId: null, shopTab: 'pigs', ordersTab: 'board' };
  const topbar = el('header', { class: 'topbar' });
  const banner = el('div', { class: 'app__banner' });
  const saveBanner = el('div', { class: 'app__banner' });
  // Fixed host for the Phaser canvas: never passed to patch(), so it is never replaced.
  const stage = el('div', { class: 'app__stage' });
  const hint = el('div', { class: 'app__hint-host' });
  const coach = el('div', { class: 'app__coach-host' });
  const appEl = el('div', { class: 'app' });
  const worldEl = el('div', { class: 'app__world' }, stage, opts.overlay ?? '', topbar, hint, coach);
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
    worldEl,
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
      openSellDialog(dialogs, pig, vm, act, save ? penMood(save) : 0, now());
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
  const { shop, inventory } = panelHandlers({
    store,
    dialogs,
    now,
    act,
    fire: handlers.act,
    openTrough,
    setShopTab: (tab) => {
      ui.shopTab = tab;
      rerender();
    },
  });
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
    goto: (to: FarmGoto) => {
      if (to.target === 'pig') {
        ui.selectedPigId = to.id;
        go('pig');
      } else if (to.target === 'trough') openTrough();
      else if (to.target === 'garden') opts.goPlace?.('sobi_garden');
      else go(to.target === 'well' ? 'well' : 'orders');
    },
    dialogHost: dialogs,
    ...(opts.areaLines ? { areaLines: opts.areaLines } : {}),
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
  const offHotkeys = bindHotkeys({
    input: opts.input,
    panel: () => ui.panel,
    dialogOpen: () => dialogs.childElementCount > 0,
    go,
  });
  const offSettings = [opts.keySettings, opts.characterChoice].map((c) => c?.subscribe(() => ui.panel === 'settings' && rerender()));

  // The guide: the "next step" chip and the Area's NPC (absent in DOM tests of the farm alone).
  const guide = opts.world && createGuideLayer({
    now,
    world: () => opts.world!.save(),
    goals: opts.world.goals,
    suggest: opts.world.suggest,
    nextLocked: opts.world.nextLocked,
    place: () => ui.place,
    dialogs,
    covered: () => ui.panel !== null || dialogs.childElementCount > 0 || !!opts.overlayModal?.(),
    go: (to) => {
      if (to.target === 'panel') go(to.id as PanelId);
      else if (to.target === 'pig' && to.id) { ui.selectedPigId = to.id; go('pig'); }
      else if (to.target === 'trough') openTrough();
      else if (to.target === 'well') go('well');
      else if (to.target === 'garden') opts.goPlace?.('sobi_garden');
    },
  });
  if (guide) worldEl.append(guide.host);

  const panelCtx: PanelCtx = { now, assets, opts, ui, pig: handlers, shop, inventory, session, settings, dialogs, act, go, rerender };

  function renderPopup(save: FarmGame | null) {
    const body = save && ui.panel ? renderPanel(panelCtx, save, ui.panel) : null;
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

  function render(snap: FarmSnapshot) {
    const ready = snap.status === 'ready' && !!snap.save;
    appEl.classList.toggle('is-ready', ready);
    appEl.classList.toggle('is-plaza', ui.place === 'plaza');
    appEl.classList.toggle('is-garden', ui.place === 'garden');
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
      guide?.sync();
      return;
    }
    const save = snap.save;
    patch(
      topbar,
      ui.place === 'garden' ? null : renderHud(save, {
        place: ui.place, now: now(), gems: opts.gems?.() ?? null, go, leave: opts.leave, openTrough: () => openTrough(),
        selectPig: (pigId) => { ui.selectedPigId = pigId; go('pig'); },
        goalsDot: opts.world && opts.world.save() ? goalsDot(opts.world.save()!, opts.world.goals, localDay(now())) : 0,
      }),
    );
    patch(coach, ui.place === 'area' ? session.coach(snap) : null);
    patch(main, null);
    farm?.setVisible(true); // after main is emptied, so the canvas measures its final host
    patch(hint, ui.place === 'area' ? renderFarmHint(save, () => go('shop'), handlers.act) : null);
    renderPopup(save);
    guide?.sync();
  }

  const offState = store.subscribe(render);
  rerender();
  return {
    toast,
    showAway: session.showAway,
    setPlace(place) {
      if (ui.place === place) return;
      Object.assign(ui, { place, selectedPigId: null, panel: ui.panel === 'pig' || ui.panel === 'well' ? null : ui.panel });
      rerender();
    },
    openPanel: (panel) => go(panel),
    isModalOpen: () => ui.panel !== null || dialogs.childElementCount > 0 || !!opts.overlayModal?.(),
    dispose: () => {
      offState();
      for (const off of offSettings) off?.();
      offHotkeys();
      farm?.destroy();
    },
  };
}
