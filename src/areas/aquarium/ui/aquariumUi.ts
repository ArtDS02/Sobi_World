// The Aquarium's DOM layer (spec V2 §10): the HUD over the tank and the bar of buttons. It reads the world through the
// store and acts through the Aquarium's actions; the canvas (AquariumScene) only reports clicks to `pick`. Mounted by
// the app into the shell's overlay; the dialogs are aquariumDialogs.ts.
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import { localOffsetMs } from '../../../ui/localDay';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import { cleanTank } from '../logic/actions/care';
import { collectScales } from '../logic/actions/trade';
import { sceneState, type SceneState } from '../logic/derived';
import { aquariumOf, hasAquarium } from '../logic/save/lens';
import type { AquariumPick } from '../scene/AquariumScene';
import { actionButton, createAquariumDialogs } from './aquariumDialogs';
import { barVm, feedAllRun, hudVm, type AquariumRun } from './aquariumVm';

export interface AquariumUiDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  /** The shell's overlay over the world (appended to `.app__world`). */
  host: HTMLElement;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
  /** Frame callback for the rod's marker (absent in DOM tests). */
  frame?: (fn: () => void) => () => void;
}

export interface AquariumUi {
  /** Shown while the player is in the Aquarium. */
  setActive(active: boolean): void;
  /** What the canvas needs to draw, null while the Aquarium is closed. */
  sceneState(): SceneState | null;
  /** A click on the canvas. */
  pick(pick: AquariumPick): void;
  isModalOpen(): boolean;
  dispose(): void;
}

export function createAquariumUi(d: AquariumUiDeps): AquariumUi {
  const hud = el('div', { class: 'aquarium-ui__hud' });
  const bottom = el('div', { class: 'aquarium-ui__bottom' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('aquarium-ui');
  d.host.append(hud, bottom, dialogHost);
  let active = false;
  let sceneCache: { world: WorldSave; now: number; state: SceneState } | null = null;

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasAquarium(s.save) ? s.save : null;
  };
  const dispatch = (run: AquariumRun) => d.world.dispatch(run);
  const dialogs = createAquariumDialogs({ host: dialogHost, world, now: d.now, dispatch, ...(d.frame ? { frame: d.frame } : {}) });

  const navButton = (label: string, onClick: () => void) =>
    el('button', { class: 'aquarium-ui__btn', text: label, attrs: { type: 'button' }, on: { click: onClick } });

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w);
    return el(
      'div',
      { class: 'aquarium-ui__inner' },
      el(
        'div',
        { class: 'aquarium-ui__pills' },
        el('span', { class: 'aquarium-ui__pill', attrs: { title: vi.aquarium.coins } }, el('b', { text: v.coins }), el('small', { text: vi.aquarium.coins })),
        el(
          'span',
          { class: 'aquarium-ui__pill aquarium-ui__pill--level', attrs: { title: v.xp } },
          el('b', { text: v.level }),
          el('span', { class: 'c-bar aquarium-ui__bar', attrs: { role: 'progressbar', 'aria-valuenow': String(v.xpProgress) } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${v.xpProgress}%` } })),
          el('small', { text: v.xp }),
        ),
      ),
      el(
        'nav',
        { class: 'aquarium-ui__nav', attrs: { 'aria-label': vi.aquarium.title } },
        navButton(vi.aquarium.plaza, d.leave),
        navButton(vi.aquarium.items, () => d.openPanel('inventory')),
        navButton(vi.aquarium.menu, () => d.openPanel('menu')),
      ),
    );
  }

  function renderBottom(w: WorldSave): HTMLElement {
    const bar = barVm(w, d.now(), localOffsetMs(d.now()));
    return el(
      'div',
      { class: 'aquarium-ui__dock' },
      el(
        'div',
        { class: 'aquarium-ui__bulk' },
        actionButton(bar.fish, () => dialogs.openFishing()),
        actionButton(bar.feedAll, () => void dispatch(feedAllRun(w))),
        actionButton(bar.water, () => void dispatch((s, c) => cleanTank(s, {}, c))),
        actionButton(bar.scales, () => void dispatch((s, c) => collectScales(s, {}, c))),
        actionButton(bar.bag, () => dialogs.openBag()),
        actionButton(bar.tank, () => dialogs.openTank()),
        actionButton(bar.breed, () => dialogs.openBreed()),
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

  function pick(p: AquariumPick) {
    const w = world();
    if (!w || !active) return;
    if (p.kind === 'fish') return dialogs.openFish(p.id);
    if (p.kind === 'tank') return dialogs.openTank();
    if (p.kind === 'dock') return dialogs.openFishing();
    if (p.kind === 'scales') return void dispatch((s, c) => collectScales(s, {}, c));
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
      if (!sceneCache || sceneCache.world !== w || now - sceneCache.now > 1000) {
        sceneCache = { world: w, now, state: sceneState(aquariumOf(w), now, localOffsetMs(now)) };
      }
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
