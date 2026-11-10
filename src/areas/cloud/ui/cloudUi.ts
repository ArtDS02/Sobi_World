// The Cloud's DOM layer (spec §10): the shared Area HUD over the beds (decision 031) — pills, square buttons and the
// bottom tray with the flower palette and the bulk actions. It reads the world
// through the store and acts through the Cloud's actions; the canvas (CloudScene) only reports clicks to `pick`.
// Mounted by the app into the shell's overlay; the dialogs are cloudDialogs.ts.
import { AREA_HUD_ART } from '../../../core/config/assetIds';
import { areaDock, hudLevel, hudNav, hudPill, hudPills } from '../../../ui/components/areaHud';
import type { PanelId } from '../../../ui/components/popup';
import { createSideMenu } from '../../../ui/components/sideMenu';
import { sideMenuItems, upgradeReason } from '../../../ui/world/sideMenuVm';
import { CLOUD_LAYOUT } from '../../../core/config/areaLayout';
import { el, patch } from '../../../ui/dom';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { CLOUD_DOCK_ART } from '../logic/art';
import { collectWater } from '../logic/actions/buildings';
import { fertilizePlots, harvestFlowers, plantFlowers, waterPlots } from '../logic/actions/plants';
import { sceneState, type SceneState } from '../logic/derived';
import { CLOUD_TIERS, PLOTS_PER_TIER } from '../logic/config/content';
import { cloudTierLevel, nextExpansion } from '../logic/derived';
import { cloudOf, hasCloud } from '../logic/save/lens';
import type { CloudPick } from '../scene/CloudScene';
import { createCloudDialogs } from './cloudDialogs';
import { onViewedTier, viewedTier } from '../viewedTier';
import { actingTier, emptyIn, unfertilizedIn } from './cloudTierVm';
import { bulkVm, hudVm, paletteVm, type CloudRun } from './cloudVm';
import { CLOUD_HYBRIDS } from '../logic/config/content';

/** The parents of the first recipe that gives `flowerId`. */
const firstRecipe = (flowerId: string): [string | null, string | null] => {
  const r = CLOUD_HYBRIDS.recipes.find((x) => x.result === flowerId);
  return r ? [r.parents[0], r.parents[1]] : [null, null];
};

export interface CloudUiDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  /** Local time minus UTC (ms): the night flowers give more at night. */
  dayOffsetMs?: () => number;
  /** The shell's overlay over the world (appended to `.app__world`). */
  host: HTMLElement;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
  /** The world action that forges a plot skin (decision 056). */
  forgeSkin: (skinId: string, pay: 'coins' | 'gems') => CloudRun;
}

export interface CloudUi {
  /** Shown while the player is in the Cloud. */
  setActive(active: boolean): void;
  /** What the canvas needs to draw, null while the Cloud is closed. */
  sceneState(): SceneState | null;
  /** A click on the canvas. */
  pick(pick: CloudPick): void;
  isModalOpen(): boolean;
  dispose(): void;
}

export function createCloudUi(d: CloudUiDeps): CloudUi {
  const hud = el('div', { class: 'cloud-ui__hud a-hud' });
  const bottom = el('div', { class: 'cloud-ui__bottom a-hud__bottom' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('cloud-ui');
  // The right-hand menu (decision 057, B1) has its own host: the HUD redraws every second, the menu only when it changes.
  const side = el('div', { class: 'cloud-ui__side' });
  d.host.append(hud, bottom, side, dialogHost);
  const menu = createSideMenu(side);
  const offset = () => d.dayOffsetMs?.() ?? -new Date(d.now()).getTimezoneOffset() * 60_000;
  let active = false;
  let selected = 'flower_cloud_daisy';
  let sceneCache: { world: WorldSave; now: number; state: SceneState } | null = null;

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasCloud(s.save) ? s.save : null;
  };
  const dispatch = (run: CloudRun) => void d.world.dispatch(run);
  const dialogs = createCloudDialogs({ host: dialogHost, world, now: d.now, dayOffsetMs: offset, dispatch, dispatchResult: (run) => d.world.dispatch(run), refresh: () => refresh(), forgeSkin: d.forgeSkin });

  const runs = {
    water: (w: WorldSave, c: Parameters<CloudRun>[1]) => waterPlots(w, {}, c),
    harvest: (w: WorldSave, c: Parameters<CloudRun>[1]) => harvestFlowers(w, {}, c),
    collect: (w: WorldSave, c: Parameters<CloudRun>[1]) => collectWater(w, c),
    plantAll: (w: WorldSave, c: Parameters<CloudRun>[1]) => plantFlowers(w, { flowerId: selected, plots: emptyIn(w, actingTier(w, viewedTier())) }, c),
    fertilizeAll: (w: WorldSave, c: Parameters<CloudRun>[1]) => fertilizePlots(w, { plots: unfertilizedIn(w, actingTier(w, viewedTier())) }, c),
  };

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w, d.now());
    return el(
      'div',
      { class: 'cloud-ui__inner' },
      hudPills(hudPill(AREA_HUD_ART.coin, v.coins, vi.cloud.coins), hudPill(CLOUD_DOCK_ART.collect, v.water, vi.shop.item_pure_water), hudLevel(v)),
      hudNav(vi.cloud.title, [
        { icon: AREA_HUD_ART.plaza, label: vi.cloud.plaza, onClick: d.leave },
        { icon: AREA_HUD_ART.menu, label: vi.cloud.menu, onClick: () => d.openPanel('menu') },
      ]),
    );
  }

  /** One row (decision 031): the flowers, then care, harvest & sow, and opening the next tier last and quieter. */
  function renderBottom(w: WorldSave): HTMLElement {
    const bulk = bulkVm(w, d.now(), selected, actingTier(w, viewedTier()), runs);
    const seeds = paletteVm(w, selected);
    const chosen = seeds.find((s) => s.selected);
    return areaDock({
      prefix: 'cloud-ui',
      seeds: seeds.map((s) => ({ id: s.flowerId, name: s.name, art: s.art, price: s.price, owned: s.owned, title: s.locked ? `${s.name} · ${vi.lab.lockedSeed}` : `${s.name} · ${s.kind} · ${s.growsIn}`, selected: s.selected, ...(s.locked ? { locked: vi.lab.lockedSeed } : {}) })),
      onPick: (id) => {
        // A locked hybrid opens the lab on its first recipe instead (decision 035).
        if (seeds.find((s) => s.flowerId === id)?.locked) return dialogs.openLab(firstRecipe(id));
        selected = id;
        refresh();
      },
      strings: { palette: vi.cloud.palette, owned: (count) => t(vi.areaHud.owned, { count }), coins: vi.cloud.coins },
      groups: [
        {
          label: vi.areaHud.groupCare,
          actions: [
            { ...bulk.collect, art: CLOUD_DOCK_ART.collect, onClick: () => dispatch(runs.collect) },
            { ...bulk.water, art: CLOUD_DOCK_ART.water, onClick: () => dispatch(runs.water) },
            { ...bulk.fertilizeAll, art: CLOUD_DOCK_ART.fertilize, onClick: () => dispatch(runs.fertilizeAll) },
          ],
        },
        {
          label: vi.areaHud.groupHarvest,
          actions: [
            { ...bulk.harvest, art: CLOUD_DOCK_ART.harvest, tone: 'main', onClick: () => dispatch(runs.harvest) },
            { ...bulk.plantAll, label: vi.cloud.plantAll, art: chosen?.art ?? CLOUD_DOCK_ART.harvest, tone: 'main', onClick: () => dispatch(runs.plantAll) },
          ],
        },
        { label: vi.lab.group, actions: [{ label: vi.lab.open, reason: null, art: CLOUD_DOCK_ART.lab, tone: 'main', onClick: () => dialogs.openLab() }] },
      ],
    });
  }

  /** Expand, upgrade, forge, shop, bag: moved here from the dock, the top buttons and the stall on the island. */
  function renderMenu(w: WorldSave) {
    const g = cloudOf(w);
    const tier = actingTier(w, viewedTier());
    menu.render(
      sideMenuItems('cloud', {
        expand: { reason: nextExpansion(g) ? null : vi.cloud.expandMax, onClick: () => dialogs.openExpand(), icon: CLOUD_DOCK_ART.expand },
        upgrade: { reason: upgradeReason({ plotsOwned: g.plots.length, plotsPerGroup: PLOTS_PER_TIER, group: tier, atTop: cloudTierLevel(g, tier) >= CLOUD_TIERS.ids.length }), onClick: () => dialogs.openRank(tier) },
        forge: { reason: null, onClick: () => dialogs.openForge(tier) },
        shop: { reason: null, onClick: () => dialogs.openShop() },
        bag: { reason: null, onClick: () => d.openPanel('inventory') },
      }),
      CLOUD_LAYOUT.sideMenu,
    );
  }

  function refresh() {
    const w = world();
    sceneCache = null;
    if (!w) {
      patch(hud, null);
      patch(bottom, null);
      menu.render(null);
      return;
    }
    renderMenu(w);
    patch(hud, renderHud(w));
    patch(bottom, renderBottom(w));
    dialogs.follow(w);
  }
  const off = d.world.subscribe(refresh);
  const offTier = onViewedTier(() => refresh());
  refresh();

  function pick(p: CloudPick) {
    const w = world();
    if (!w || !active) return;
    if (p.kind === 'locked') return dialogs.openExpand();
    if (p.kind === 'rank') return dialogs.openRank(actingTier(w, viewedTier()));
    if (p.kind === 'building') return p.building === 'spring' ? dialogs.openSpring() : dialogs.openCauldron();
    if (p.kind !== 'plot') return;
    const plot = cloudOf(w).plots[p.index];
    if (!plot) return;
    if (plot.cropId === null) dispatch((s, c) => plantFlowers(s, { flowerId: selected, plots: [p.index] }, c));
    else if (plot.ripeAt !== null) dispatch((s, c) => harvestFlowers(s, { plots: [p.index] }, c));
    else dialogs.openPlot(p.index);
  }

  return {
    setActive(next) {
      active = next;
      d.host.classList.toggle('is-active', next);
      if (!next) dialogs.close();
      if (!next) menu.close();
      refresh();
    },
    sceneState() {
      const w = world();
      if (!w) return null;
      const now = d.now();
      if (!sceneCache || sceneCache.world !== w || now - sceneCache.now > 1000) sceneCache = { world: w, now, state: sceneState(cloudOf(w), now, offset(), w.cosmetics.plotSkins) };
      return sceneCache.state;
    },
    pick,
    isModalOpen: () => dialogs.isOpen(),
    dispose: () => {
      off();
      offTier();
      menu.dispose();
      dialogs.close();
    },
  };
}
