// The Garden's DOM layer (spec §10): the HUD over the field, the seed palette and the bulk buttons. It reads the world
// through the store and acts through the Garden's actions; the canvas (GardenScene) only reports clicks to `pick`.
// Mounted by the app into the shell's overlay; the dialogs are gardenDialogs.ts.
import { art } from '../../../ui/components/icon';
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import { harvestPlots, plantCrops, waterPlots } from '../logic/actions/plants';
import { sceneState, type SceneState } from '../logic/derived';
import { hasGarden, gardenOf } from '../logic/save/lens';
import type { GardenPick } from '../scene/GardenScene';
import { actionButton, createGardenDialogs } from './gardenDialogs';
import { bulkVm, hudVm, paletteVm, type GardenRun } from './gardenVm';

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
  const hud = el('div', { class: 'garden-ui__hud' });
  const bottom = el('div', { class: 'garden-ui__bottom' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('garden-ui');
  d.host.append(hud, bottom, dialogHost);
  let active = false;
  let selected = 'crop_wheat';
  let sceneCache: { world: WorldSave; now: number; state: SceneState } | null = null;

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasGarden(s.save) ? s.save : null;
  };
  const dispatch = (run: GardenRun) => void d.world.dispatch(run);
  const dialogs = createGardenDialogs({ host: dialogHost, world, now: d.now, dispatch, refresh: () => refresh() });

  const runs = {
    water: (w: WorldSave, c: Parameters<GardenRun>[1]) => waterPlots(w, {}, c),
    harvest: (w: WorldSave, c: Parameters<GardenRun>[1]) => harvestPlots(w, {}, c),
    plantAll: (w: WorldSave, c: Parameters<GardenRun>[1]) =>
      plantCrops(w, { cropId: selected, plots: gardenOf(w).plots.flatMap((p, i) => (p.cropId === null ? [i] : [])) }, c),
  };

  const navButton = (label: string, onClick: () => void) =>
    el('button', { class: 'garden-ui__btn', text: label, attrs: { type: 'button' }, on: { click: onClick } });

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w);
    return el(
      'div',
      { class: 'garden-ui__inner' },
      el(
        'div',
        { class: 'garden-ui__pills' },
        el('span', { class: 'garden-ui__pill', attrs: { title: vi.garden.coins } }, el('b', { text: v.coins }), el('small', { text: vi.garden.coins })),
        el(
          'span',
          { class: 'garden-ui__pill garden-ui__pill--level', attrs: { title: v.xp } },
          el('b', { text: v.level }),
          el('span', { class: 'c-bar garden-ui__bar', attrs: { role: 'progressbar', 'aria-valuenow': String(v.xpProgress) } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${v.xpProgress}%` } })),
          el('small', { text: v.xp }),
        ),
      ),
      el(
        'nav',
        { class: 'garden-ui__nav', attrs: { 'aria-label': vi.garden.title } },
        navButton(vi.garden.plaza, d.leave),
        navButton(vi.garden.items, () => d.openPanel('inventory')),
        navButton(vi.garden.menu, () => d.openPanel('menu')),
      ),
    );
  }

  function renderBottom(w: WorldSave): HTMLElement {
    const bulk = bulkVm(w, d.now(), selected, runs);
    return el(
      'div',
      { class: 'garden-ui__dock' },
      el(
        'div',
        { class: 'garden-ui__palette', attrs: { role: 'radiogroup', 'aria-label': vi.garden.palette } },
        ...paletteVm(w, selected).map((s) =>
          el(
            'button',
            {
              class: `garden-ui__seed${s.selected ? ' is-selected' : ''}`,
              attrs: { type: 'button', role: 'radio', 'aria-checked': String(s.selected), title: s.growsIn },
              on: {
                click: () => {
                  selected = s.cropId;
                  refresh();
                },
              },
            },
            art(s.art, 'garden-ui__seed-icon'),
            el('b', { text: s.name }),
            el('small', { text: s.line }),
          ),
        ),
      ),
      el(
        'div',
        { class: 'garden-ui__bulk' },
        actionButton(bulk.water, () => dispatch(runs.water)),
        actionButton(bulk.harvest, () => dispatch(runs.harvest)),
        actionButton(bulk.plantAll, () => dispatch(runs.plantAll)),
        actionButton(bulk.expand, () => dialogs.openExpand()),
      ),
    );
  }

  function refresh() {
    const w = world();
    sceneCache = null;
    if (!w) {
      patch(hud, null);
      patch(bottom, null);
      return;
    }
    patch(hud, renderHud(w));
    patch(bottom, renderBottom(w));
    dialogs.follow(w);
  }
  const off = d.world.subscribe(refresh);
  refresh();

  function pick(p: GardenPick) {
    const w = world();
    if (!w || !active) return;
    if (p.kind === 'locked') return dialogs.openExpand();
    if (p.kind === 'building') return p.building === 'sprinkler' ? dialogs.openSprinkler() : dialogs.openWorkshop(p.building);
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
      dialogs.close();
    },
  };
}
