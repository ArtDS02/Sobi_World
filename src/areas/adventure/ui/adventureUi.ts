// The Adventure's DOM layer (spec §17): the controller of the camp, the exploration HUD over the map, the battle (Auto, x2) and the
// summary. It reads the world through the store and acts through the Adventure's actions; the map is the scene underneath, which reads
// `sceneState()` and reports what the walker does (`scene`). The roster and the way to hand a creature over come from the app (the
// Areas never reach each other). Mounted by the app into the shell's overlay.
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import { AREA_HUD_ART } from '../../../core/config/assetIds';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import type { GameStore } from '../../../core/world/gameStore';
import { vi } from '../../../i18n/vi';
import { hudLevel, hudNav, hudPill, hudPills } from '../../../ui/components/areaHud';
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import { battleAct } from '../logic/actions/battle';
import { engage, interact, moveTo, takeExit } from '../logic/actions/explore';
import { ZONE_LIST } from '../logic/config/content';
import { adventureOf, hasAdventure } from '../logic/save/lens';
import type { AdventureSceneState, SceneReport } from '../scene/sceneState';
import { createAdventureDialogs } from './adventureDialogs';
import { stepRemaining } from './battleFxView';
import { renderBattle, choose } from './battleView';
import { battleVm } from './battleVm';
import { hudVm } from './campVm';
import { renderCamp } from './campView';
import { renderDone, renderExplore, renderRift } from './exploreView';
import { sceneVm } from './sceneVm';
import { keepScroll, type UiState, type ViewCtx } from './viewKit';
import type { AdventureRun } from './vmKit';

export interface AdventureUiDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  /** The shell's overlay over the world (appended to `.app__world`). */
  host: HTMLElement;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
  roster: (world: WorldSave) => RosterEntry[];
  give: (world: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult;
  /** Frame timer for the Auto mode (absent in DOM tests, which step by hand). */
  frame?: (fn: () => void, ms: number) => () => void;
  /** The label of the key bound to "interact" (Space by default). */
  interactKey?: () => string;
  /** Keyboard events (M for the map, digits in a battle); absent in tests. */
  keys?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  /** A panel or dialog of the shell covers the world. */
  paused?: () => boolean;
}

export interface AdventureUi {
  setActive(active: boolean): void;
  isModalOpen(): boolean;
  /** One step of the Auto mode (the timer calls it; tests too). */
  autoStep(): void;
  /** What the scene draws now. */
  sceneState(): AdventureSceneState | null;
  /** What the scene reports. */
  scene: SceneReport;
  dispose(): void;
}

const AUTO_MS = 900;

export function createAdventureUi(d: AdventureUiDeps): AdventureUi {
  const hud = el('div', { class: 'adventure-ui__hud a-hud' });
  const main = el('div', { class: 'adventure-ui__main' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('adventure-ui');
  d.host.append(hud, main, dialogHost);

  let active = false;
  let busy = false;
  let lastPos: { x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' } | null = null;
  const state: UiState = { zoneId: ZONE_LIST[0]!.id, startMap: null, selected: [], prep: [], auto: false, fast: false, menu: null, aim: null, focus: null, showMap: false, filter: null, search: '', legend: false, log: false, quick: true };

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasAdventure(s.save) ? s.save : null;
  };
  const dispatch = (run: AdventureRun): Promise<unknown> => {
    busy = true;
    return Promise.resolve(d.world.dispatch(run)).finally(() => {
      busy = false;
    });
  };
  const dialogs = createAdventureDialogs({ host: dialogHost, world, now: d.now, dispatch: (run) => void dispatch(run), roster: d.roster, position: () => lastPos });

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w);
    return el(
      'div',
      { class: 'adventure-ui__inner' },
      hudPills(hudPill(AREA_HUD_ART.coin, v.coins, vi.adventure.coins), hudLevel(v)),
      hudNav(vi.adventure.title, [
        { icon: AREA_HUD_ART.plaza, label: vi.adventure.plaza, onClick: d.leave },
        { icon: AREA_HUD_ART.items, label: vi.adventure.items, onClick: () => d.openPanel('inventory') },
        { icon: AREA_HUD_ART.menu, label: vi.adventure.menu, onClick: () => d.openPanel('menu') },
      ]),
    );
  }

  const ctxFor = (w: WorldSave): ViewCtx => ({
    world: w,
    now: d.now(),
    roster: d.roster(w),
    state,
    rerender: () => render(),
    dispatch: (run) => void dispatch(run),
    dispatchThen: (first, then) => void dispatch(first).then(() => dispatch(then)),
    give: d.give,
    openSheet: (key) => dialogs.openSheet(key),
    openPortal: () => dialogs.openPortal(),
    interactKey: () => d.interactKey?.() ?? 'Space',
    dayOffsetMs: -new Date(d.now()).getTimezoneOffset() * 60_000,
  });

  function render() {
    const w = world();
    if (!w) {
      patch(hud, null);
      patch(main, null);
      return;
    }
    const top = main.scrollTop;
    const run = adventureOf(w).run;
    if (!run || run.phase !== 'battle') {
      state.aim = null;
      state.menu = null;
    }
    const rift = run?.phase === 'explore' && !!run.rift;
    const exploring = run?.phase === 'explore' && !rift;
    d.host.classList.toggle('is-exploring', exploring);
    patch(hud, renderHud(w));
    const ctx = ctxFor(w);
    d.host.classList.toggle('is-battle', run?.phase === 'battle');
    d.host.classList.toggle('is-camp', run === null);
    d.host.classList.toggle('is-done', run?.phase === 'done' || rift);
    keepScroll(main, () => patch(main, run === null ? renderCamp(ctx) : rift ? renderRift(ctx) : exploring ? renderExplore(ctx) : run.phase === 'battle' ? renderBattle(ctx) : renderDone(ctx)));
    main.scrollTop = top;
    dialogs.follow(w);
  }

  const off = d.world.subscribe(render);
  render();

  /** Auto: when it is an ally's turn the AI chooses for it; the enemies already answered inside the action. */
  function autoStep() {
    if (!state.auto || !active || busy || dialogs.isOpen()) return;
    const w = world();
    const run = w ? adventureOf(w).run : null;
    if (!w || !run || run.phase !== 'battle' || !run.battle) return;
    void dispatch((ww, c) => battleAct(ww, { action: 'auto' }, c));
  }
  let tick = 0;
  // Auto waits for the step on screen to finish moving (bounded by STEP_MAX_MS), so every action can be read.
  const stop = d.frame?.(() => {
    tick += 100;
    if (tick >= (state.fast ? AUTO_MS / 2 : AUTO_MS) && stepRemaining() <= 0) {
      tick = 0;
      autoStep();
    }
  }, 100);

  const exploring = () => {
    const w = world();
    const run = w ? adventureOf(w).run : null;
    return w && run?.phase === 'explore' && !run.rift ? w : null;
  };

  const scene: SceneReport = {
    move(pos) {
      lastPos = pos;
      if (exploring() && !busy) void dispatch((w, c) => moveTo(w, pos, c));
    },
    touch(groupId, pos) {
      lastPos = pos;
      if (exploring() && !busy && !dialogs.isOpen()) void dispatch((w, c) => engage(w, { ...pos, groupId, quick: state.quick }, c));
    },
    focus(thingId) {
      state.focus = thingId;
      if (active) render();
    },
    use(thingId, pos) {
      lastPos = pos;
      const w = exploring();
      if (!w || busy) return;
      const map = adventureOf(w).run!.mapId;
      if (thingId === map) {
        dialogs.openPortal();
        return;
      }
      void dispatch((ww, c) => interact(ww, { ...pos, id: thingId }, c));
    },
    exit(exitId, pos) {
      lastPos = pos;
      if (exploring()) void dispatch((w, c) => takeExit(w, { ...pos, exitId }, c));
    },
  };

  /** M toggles the small map; digits pick an action in a battle. */
  const onKey = (ev: Event) => {
    const e = ev as KeyboardEvent;
    if (!active || dialogs.isOpen() || e.ctrlKey || e.altKey || e.metaKey) return;
    const w = world();
    const run = w ? adventureOf(w).run : null;
    if (!w || !run) return;
    if (run.phase === 'explore' && e.code === 'KeyM') {
      state.showMap = !state.showMap;
      render();
    } else if (run.phase === 'battle' && /^Digit[1-9]$/.test(e.code) && !state.aim) {
      const vm = battleVm(w, run);
      const action = vm?.actions[Number(e.code.slice(5)) - 1];
      if (vm && action) choose(action, vm, ctxFor(w));
    }
  };
  d.keys?.addEventListener('keydown', onKey);

  return {
    setActive(next) {
      active = next;
      d.host.classList.toggle('is-active', next);
      if (!next) {
        dialogs.close();
        state.auto = false;
      }
      render();
    },
    isModalOpen: () => dialogs.isOpen(),
    autoStep,
    sceneState: () => (active ? sceneVm(world(), d.now(), dialogs.isOpen() || (d.paused?.() ?? false), state.zoneId) : null),
    scene,
    dispose: () => {
      off();
      stop?.();
      d.keys?.removeEventListener('keydown', onKey);
      dialogs.close();
    },
  };
}
