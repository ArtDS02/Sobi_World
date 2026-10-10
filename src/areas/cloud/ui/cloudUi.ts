// The Cloud's DOM layer (spec §10): the HUD over the beds, the seed palette and the bulk buttons. It reads the world
// through the store and acts through the Cloud's actions; the canvas (CloudScene) only reports clicks to `pick`.
// Mounted by the app into the shell's overlay; the dialogs are cloudDialogs.ts.
import { art } from '../../../ui/components/icon';
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import { collectWater } from '../logic/actions/buildings';
import { harvestFlowers, plantFlowers, waterPlots } from '../logic/actions/plants';
import { sceneState, type SceneState } from '../logic/derived';
import { cloudOf, hasCloud } from '../logic/save/lens';
import type { CloudPick } from '../scene/CloudScene';
import { actionButton, createCloudDialogs } from './cloudDialogs';
import { bulkVm, hudVm, paletteVm, type CloudRun } from './cloudVm';

export interface CloudUiDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  /** Local time minus UTC (ms): the night flowers give more at night. */
  dayOffsetMs?: () => number;
  /** The shell's overlay over the world (appended to `.app__world`). */
  host: HTMLElement;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
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
  const hud = el('div', { class: 'cloud-ui__hud' });
  const bottom = el('div', { class: 'cloud-ui__bottom' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('cloud-ui');
  d.host.append(hud, bottom, dialogHost);
  const offset = () => d.dayOffsetMs?.() ?? -new Date(d.now()).getTimezoneOffset() * 60_000;
  let active = false;
  let selected = 'flower_cloud_daisy';
  let sceneCache: { world: WorldSave; now: number; state: SceneState } | null = null;

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasCloud(s.save) ? s.save : null;
  };
  const dispatch = (run: CloudRun) => void d.world.dispatch(run);
  const dialogs = createCloudDialogs({ host: dialogHost, world, now: d.now, dayOffsetMs: offset, dispatch, refresh: () => refresh() });

  const runs = {
    water: (w: WorldSave, c: Parameters<CloudRun>[1]) => waterPlots(w, {}, c),
    harvest: (w: WorldSave, c: Parameters<CloudRun>[1]) => harvestFlowers(w, {}, c),
    collect: (w: WorldSave, c: Parameters<CloudRun>[1]) => collectWater(w, c),
    plantAll: (w: WorldSave, c: Parameters<CloudRun>[1]) =>
      plantFlowers(w, { flowerId: selected, plots: cloudOf(w).plots.flatMap((p, i) => (p.cropId === null ? [i] : [])) }, c),
  };

  const navButton = (label: string, onClick: () => void) =>
    el('button', { class: 'cloud-ui__btn', text: label, attrs: { type: 'button' }, on: { click: onClick } });

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w, d.now());
    return el(
      'div',
      { class: 'cloud-ui__inner' },
      el(
        'div',
        { class: 'cloud-ui__pills' },
        el('span', { class: 'cloud-ui__pill', attrs: { title: vi.cloud.coins } }, el('b', { text: v.coins }), el('small', { text: vi.cloud.coins })),
        el('span', { class: 'cloud-ui__pill', attrs: { title: vi.shop.item_pure_water } }, el('b', { text: v.water }), el('small', { text: vi.shop.item_pure_water })),
        el(
          'span',
          { class: 'cloud-ui__pill cloud-ui__pill--level', attrs: { title: v.xp } },
          el('b', { text: v.level }),
          el('span', { class: 'c-bar cloud-ui__bar', attrs: { role: 'progressbar', 'aria-valuenow': String(v.xpProgress) } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${v.xpProgress}%` } })),
          el('small', { text: v.xp }),
        ),
      ),
      el(
        'nav',
        { class: 'cloud-ui__nav', attrs: { 'aria-label': vi.cloud.title } },
        navButton(vi.cloud.plaza, d.leave),
        navButton(vi.cloud.items, () => d.openPanel('inventory')),
        navButton(vi.cloud.menu, () => d.openPanel('menu')),
      ),
    );
  }

  function renderBottom(w: WorldSave): HTMLElement {
    const bulk = bulkVm(w, d.now(), selected, runs);
    return el(
      'div',
      { class: 'cloud-ui__dock' },
      el(
        'div',
        { class: 'cloud-ui__palette', attrs: { role: 'radiogroup', 'aria-label': vi.cloud.palette } },
        ...paletteVm(w, selected).map((s) =>
          el(
            'button',
            {
              class: `cloud-ui__seed${s.selected ? ' is-selected' : ''}`,
              attrs: { type: 'button', role: 'radio', 'aria-checked': String(s.selected), title: `${s.kind} · ${s.growsIn}` },
              on: {
                click: () => {
                  selected = s.flowerId;
                  refresh();
                },
              },
            },
            art(s.art, 'cloud-ui__seed-icon'),
            el('b', { text: s.name }),
            el('small', { text: s.line }),
          ),
        ),
      ),
      el(
        'div',
        { class: 'cloud-ui__bulk' },
        actionButton(bulk.collect, () => dispatch(runs.collect)),
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

  function pick(p: CloudPick) {
    const w = world();
    if (!w || !active) return;
    if (p.kind === 'locked') return dialogs.openExpand();
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
      refresh();
    },
    sceneState() {
      const w = world();
      if (!w) return null;
      const now = d.now();
      if (!sceneCache || sceneCache.world !== w || now - sceneCache.now > 1000) sceneCache = { world: w, now, state: sceneState(cloudOf(w), now, offset()) };
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
