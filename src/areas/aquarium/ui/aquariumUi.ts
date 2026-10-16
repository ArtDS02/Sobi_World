// The Aquarium's DOM layer (spec V2 §10; the owner's mock-up, decision 030): violet pills and square buttons over
// the scene, and a white bar with the tank's line and a card per action. It reads the world through the
// store and acts through the Aquarium's actions; the canvas (AquariumScene) only reports clicks to `pick`. Mounted by
// the app into the shell's overlay; the dialogs are aquariumDialogs.ts.
import type { PanelId } from '../../../ui/components/popup';
import { AREA_HUD_ART } from '../../../core/config/assetIds';
import { areaDock, hudLevel, hudNav, hudPill, hudPills } from '../../../ui/components/areaHud';
import { art } from '../../../ui/components/icon';
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
import { BAR_ART, HUD_ART } from '../logic/art';
import { createAquariumDialogs } from './aquariumDialogs';
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
  const hud = el('div', { class: 'aquarium-ui__hud a-hud' });
  const bottom = el('div', { class: 'aquarium-ui__bottom a-hud__bottom' });
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

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w);
    return el(
      'div',
      { class: 'aquarium-ui__inner' },
      hudPills(hudPill(AREA_HUD_ART.coin, v.coins, vi.aquarium.coins), hudPill(HUD_ART.water, v.waterText, vi.aquarium.hud.waterLabel), hudLevel(v)),
      hudNav(vi.aquarium.title, [
        { icon: HUD_ART.plaza, label: vi.aquarium.plaza, onClick: d.leave },
        { icon: HUD_ART.items, label: vi.aquarium.items, onClick: () => d.openPanel('inventory') },
        { icon: HUD_ART.menu, label: vi.aquarium.menu, onClick: () => d.openPanel('menu') },
      ]),
    );
  }

  /** The tank's line, then the care cards and the tank's own (decision 030, grouped by decision 031). */
  function renderBottom(w: WorldSave): HTMLElement {
    const bar = barVm(w, d.now(), localOffsetMs(d.now()));
    const v = hudVm(w);
    const status = el(
      'div',
      { class: 'aquarium-ui__status', attrs: { title: vi.aquarium.hud.waterLabel } },
      el('span', { class: 'aquarium-ui__status-icon' }, art(HUD_ART.water, 'c-icon')),
      el(
        'span',
        { class: 'aquarium-ui__status-body' },
        el('span', { class: 'aquarium-ui__status-row' }, el('b', { text: v.fishCount }), v.eggs ? el('small', { text: v.eggs }) : null, el('small', { text: v.waterText })),
        el('span', { class: 'c-bar aquarium-ui__water', attrs: { role: 'progressbar', 'aria-valuenow': String(v.water), 'aria-label': vi.aquarium.hud.waterLabel } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${v.water}%` } })),
      ),
    );
    return areaDock({
      prefix: 'aquarium-ui',
      lead: status,
      groups: [
        {
          label: vi.areaHud.groupCare,
          actions: [
            { ...bar.fish, art: BAR_ART.fish, tone: 'main', onClick: () => dialogs.openFishing() },
            { ...bar.feedAll, art: BAR_ART.feedAll, onClick: () => void dispatch(feedAllRun(w)) },
            { ...bar.water, art: BAR_ART.water, onClick: () => void dispatch((s, c) => cleanTank(s, {}, c)) },
            { ...bar.scales, art: BAR_ART.scales, onClick: () => void dispatch((s, c) => collectScales(s, {}, c)) },
          ],
        },
        {
          label: vi.areaHud.groupTank,
          actions: [
            { ...bar.bag, art: BAR_ART.bag, onClick: () => dialogs.openBag() },
            { ...bar.tank, art: BAR_ART.tank, tone: 'grow', onClick: () => dialogs.openTank() },
            { ...bar.breed, art: BAR_ART.breed, onClick: () => dialogs.openBreed() },
          ],
        },
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
