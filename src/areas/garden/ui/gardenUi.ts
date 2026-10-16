// The Garden's DOM layer (spec §10): the shared Area HUD over the field (decision 031) — pills, the zone switcher,
// square buttons, and the bottom tray with the seed palette and the bulk actions. It reads the world
// through the store and acts through the Garden's actions; the canvas (GardenScene) only reports clicks to `pick`.
// Mounted by the app into the shell's overlay; the dialogs are gardenDialogs.ts.
import { AREA_HUD_ART } from '../../../core/config/assetIds';
import { areaDock, hudLevel, hudNav, hudPill, hudPills } from '../../../ui/components/areaHud';
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { GARDEN_DOCK_ART } from '../logic/art';
import { fertilizePlots, harvestPlots, plantCrops, waterPlots } from '../logic/actions/plants';
import { ownedZones, sceneState, type SceneState } from '../logic/derived';
import { hasGarden, gardenOf } from '../logic/save/lens';
import type { GardenPick } from '../scene/GardenScene';
import { createGardenDialogs } from './gardenDialogs';
import { onViewedZone, setViewedZone, viewedZone } from '../viewedZone';
import { bulkVm, hudVm, paletteVm, type GardenRun } from './gardenVm';
import { emptyIn, unfertilizedIn, zoneVm } from './gardenZoneVm';

export interface GardenUiDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  /** The shell's overlay over the world (appended to `.app__world`). */
  host: HTMLElement;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
}

export interface GardenUi {
  /** Shown while the player is in the Garden. */
  setActive(active: boolean): void;
  /** What the canvas needs to draw, null while the Garden is closed. */
  sceneState(): SceneState | null;
  /** A click on the canvas. */
  pick(pick: GardenPick): void;
  isModalOpen(): boolean;
  dispose(): void;
}

export function createGardenUi(d: GardenUiDeps): GardenUi {
  const hud = el('div', { class: 'garden-ui__hud a-hud' });
  const bottom = el('div', { class: 'garden-ui__bottom a-hud__bottom' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('garden-ui');
  d.host.append(hud, bottom, dialogHost);
  let active = false;
  let selected = 'crop_wheat';
  let sceneCache: { world: WorldSave; now: number; state: SceneState } | null = null;
  /** Owned zones at the last refresh: a newly opened zone is shown at once. */
  let zonesSeen = 0;

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasGarden(s.save) ? s.save : null;
  };
  const dispatch = (run: GardenRun) => void d.world.dispatch(run);
  const dialogs = createGardenDialogs({ host: dialogHost, world, now: d.now, dispatch, refresh: () => refresh() });

  const runs = {
    water: (w: WorldSave, c: Parameters<GardenRun>[1]) => waterPlots(w, {}, c),
    harvest: (w: WorldSave, c: Parameters<GardenRun>[1]) => harvestPlots(w, {}, c),
    plantAll: (w: WorldSave, c: Parameters<GardenRun>[1]) => plantCrops(w, { cropId: selected, plots: emptyIn(w, zone()) }, c),
    fertilizeAll: (w: WorldSave, c: Parameters<GardenRun>[1]) => fertilizePlots(w, { plots: unfertilizedIn(w, zone()) }, c),
  };
  const zone = () => Math.max(0, viewedZone());

  /** Keeps the zone on screen valid: first look and a newly opened zone go to the highest owned one. */
  function settleZone(w: WorldSave) {
    const owned = ownedZones(gardenOf(w));
    const viewable = zoneVm(w, 0).viewable;
    if (viewedZone() < 0 || viewedZone() >= viewable || (zonesSeen > 0 && owned > zonesSeen)) setViewedZone(owned - 1);
    zonesSeen = owned;
  }

  function renderZones(w: WorldSave): HTMLElement {
    const z = zone();
    const v = zoneVm(w, z);
    const arrow = (dir: -1 | 1) =>
      el('button', {
        class: `garden-ui__zone-arrow garden-ui__zone-arrow--${dir < 0 ? 'prev' : 'next'}`,
        text: dir < 0 ? '‹' : '›',
        attrs: { type: 'button', 'aria-label': dir < 0 ? vi.garden.zonePrev : vi.garden.zoneNext, ...(z + dir < 0 || z + dir >= v.viewable ? { disabled: '' } : {}) },
        on: { click: () => setViewedZone(z + dir) },
      });
    return el(
      'div',
      { class: `garden-ui__zones${v.locked ? ' is-locked' : ''}`, attrs: { title: v.locked ?? v.title } },
      arrow(-1),
      el('span', { class: 'garden-ui__zone-title', text: v.title }),
      arrow(1),
    );
  }

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w);
    return el(
      'div',
      { class: 'garden-ui__inner' },
      hudPills(hudPill(AREA_HUD_ART.coin, v.coins, vi.garden.coins), hudLevel(v)),
      renderZones(w),
      hudNav(vi.garden.title, [
        { icon: AREA_HUD_ART.plaza, label: vi.garden.plaza, onClick: d.leave },
        { icon: AREA_HUD_ART.shop, label: vi.garden.shop, onClick: () => dialogs.openShop() },
        { icon: AREA_HUD_ART.items, label: vi.garden.items, onClick: () => d.openPanel('inventory') },
        { icon: AREA_HUD_ART.menu, label: vi.garden.menu, onClick: () => d.openPanel('menu') },
      ]),
    );
  }

  /** One row (decision 031): the seeds, then care, harvest & sow, and opening more ground last and quieter. */
  function renderBottom(w: WorldSave): HTMLElement {
    const bulk = bulkVm(w, d.now(), selected, zone(), runs);
    const seeds = paletteVm(w, selected);
    const chosen = seeds.find((s) => s.selected);
    return areaDock({
      prefix: 'garden-ui',
      seeds: seeds.map((s) => ({ id: s.cropId, name: s.name, art: s.art, price: s.price, owned: s.owned, title: `${s.name} · ${s.growsIn}`, selected: s.selected })),
      onPick: (id) => {
        selected = id;
        refresh();
      },
      strings: { palette: vi.garden.palette, owned: (count) => t(vi.areaHud.owned, { count }), coins: vi.garden.coins },
      groups: [
        {
          label: vi.areaHud.groupCare,
          actions: [
            { ...bulk.water, art: GARDEN_DOCK_ART.water, onClick: () => dispatch(runs.water) },
            { ...bulk.fertilizeAll, art: GARDEN_DOCK_ART.fertilize, onClick: () => dispatch(runs.fertilizeAll) },
          ],
        },
        {
          label: vi.areaHud.groupHarvest,
          actions: [
            { ...bulk.harvest, art: GARDEN_DOCK_ART.harvest, tone: 'main', onClick: () => dispatch(runs.harvest) },
            { ...bulk.plantAll, label: vi.garden.plantAll, art: chosen?.art ?? GARDEN_DOCK_ART.harvest, tone: 'main', onClick: () => dispatch(runs.plantAll) },
          ],
        },
        { label: vi.areaHud.groupGrow, actions: [{ ...bulk.expand, art: GARDEN_DOCK_ART.expand, tone: 'grow', onClick: () => dialogs.openExpand() }] },
      ],
    });
  }

  function refresh() {
    const w = world();
    sceneCache = null;
    if (!w) {
      patch(hud, null);
      patch(bottom, null);
      return;
    }
    settleZone(w);
    patch(hud, renderHud(w));
    patch(bottom, renderBottom(w));
    dialogs.follow(w);
  }
  const off = d.world.subscribe(refresh);
  const offZone = onViewedZone(() => refresh());
  refresh();

  function pick(p: GardenPick) {
    const w = world();
    if (!w || !active) return;
    if (p.kind === 'locked') return dialogs.openExpand();
    if (p.kind === 'building') {
      if (p.building === 'shop') return dialogs.openShop();
      return p.building === 'sprinkler' ? dialogs.openSprinkler() : dialogs.openWorkshop(p.building);
    }
    if (p.kind !== 'plot') return;
    const plot = gardenOf(w).plots[p.index];
    if (!plot) return;
    if (plot.cropId === null) dispatch((s, c) => plantCrops(s, { cropId: selected, plots: [p.index] }, c));
    else if (plot.ripeAt !== null) dispatch((s, c) => harvestPlots(s, { plots: [p.index] }, c));
    else dialogs.openPlot(p.index);
  }

  return {
    setActive(next) {
      active = next;
      d.host.classList.toggle('is-active', next);
      if (!next) dialogs.close();
      refresh();
    },
    sceneState() {
      const w = world();
      if (!w) return null;
      const now = d.now();
      if (!sceneCache || sceneCache.world !== w || now - sceneCache.now > 1000) sceneCache = { world: w, now, state: sceneState(gardenOf(w), now) };
      return sceneCache.state;
    },
    pick,
    isModalOpen: () => dialogs.isOpen(),
    dispose: () => {
      off();
      offZone();
      dialogs.close();
    },
  };
}
