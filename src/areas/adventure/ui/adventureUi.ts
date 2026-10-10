// The Adventure's DOM layer (spec V2 §8.5, §10): the controller of the hub, the map of a run, the battle (with Auto and x2) and
// the summary. It reads the world through the store and acts through the Adventure's actions; the roster of creatures and the
// way to hand a creature over come from the app (the Areas never reach each other). The screens are adventureViews.ts, the
// dialogs adventureDialogs.ts. Mounted by the app into the shell's overlay.
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import { vi } from '../../../i18n/vi';
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import { battleAct } from '../logic/actions/run';
import { ZONE_LIST } from '../logic/config/content';
import { adventureOf, hasAdventure } from '../logic/save/lens';
import { createAdventureDialogs } from './adventureDialogs';
import { renderDone, renderHub, renderMap } from './adventureViews';
import { renderBattle } from './battleView';
import type { UiState, ViewCtx } from './viewKit';
import { hudVm } from './adventureVm';
import type { AdventureRun } from './vmKit';

export interface AdventureUiDeps {
  world: Pick<GameStore, 'getSnapshot' | 'subscribe' | 'dispatch'>;
  now: () => number;
  /** The shell's overlay over the world (appended to `.app__world`). */
  host: HTMLElement;
  leave: () => void;
  openPanel: (panel: PanelId) => void;
  /** Every creature the Areas let the Adventure use (the registry's roster). */
  roster: (world: WorldSave) => RosterEntry[];
  /** Hands a creature to the Area that keeps it (the registry's gift). */
  give: (world: WorldSave, gift: CreatureGift, ctx: ActionContext) => GiftResult;
  /** Frame timer for the Auto mode (absent in DOM tests, which step by hand). */
  frame?: (fn: () => void, ms: number) => () => void;
}

export interface AdventureUi {
  /** Shown while the player is in the Adventure. */
  setActive(active: boolean): void;
  isModalOpen(): boolean;
  /** One step of the Auto mode (the timer calls it; tests too). */
  autoStep(): void;
  dispose(): void;
}

const AUTO_MS = 900;

export function createAdventureUi(d: AdventureUiDeps): AdventureUi {
  const hud = el('div', { class: 'adventure-ui__hud' });
  const main = el('div', { class: 'adventure-ui__main' });
  const dialogHost = el('div', { class: 'app__dialogs' });
  d.host.classList.add('adventure-ui');
  d.host.append(hud, main, dialogHost);

  let active = false;
  let busy = false;
  const state: UiState = { zoneId: ZONE_LIST[0]!.id, selected: [], auto: false, fast: false, menu: null, aim: null };

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
  const dialogs = createAdventureDialogs({ host: dialogHost, world, now: d.now, dispatch: (run) => void dispatch(run), roster: d.roster });

  const navButton = (label: string, onClick: () => void) => el('button', { class: 'adventure-ui__btn', text: label, attrs: { type: 'button' }, on: { click: onClick } });

  function renderHud(w: WorldSave): HTMLElement {
    const v = hudVm(w);
    return el(
      'div',
      { class: 'adventure-ui__inner' },
      el(
        'div',
        { class: 'adventure-ui__pills' },
        el('span', { class: 'adventure-ui__pill', attrs: { title: vi.adventure.coins } }, el('b', { text: v.coins }), el('small', { text: vi.adventure.coins })),
        el(
          'span',
          { class: 'adventure-ui__pill adventure-ui__pill--level', attrs: { title: v.xp } },
          el('b', { text: v.level }),
          el('span', { class: 'c-bar adventure-ui__bar', attrs: { role: 'progressbar', 'aria-valuenow': String(v.xpProgress) } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${v.xpProgress}%` } })),
          el('small', { text: v.xp }),
        ),
      ),
      el(
        'nav',
        { class: 'adventure-ui__nav', attrs: { 'aria-label': vi.adventure.title } },
        navButton(vi.adventure.plaza, d.leave),
        navButton(vi.adventure.items, () => d.openPanel('inventory')),
        navButton(vi.adventure.menu, () => d.openPanel('menu')),
      ),
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
    openGear: (key) => dialogs.openGear(key),
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
    patch(hud, renderHud(w));
    const ctx = ctxFor(w);
    patch(main, run === null ? renderHub(ctx) : run.phase === 'map' ? renderMap(ctx) : run.phase === 'battle' ? renderBattle(ctx) : renderDone(ctx));
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
  const stop = d.frame?.(() => {
    tick += 100;
    if (tick >= (state.fast ? AUTO_MS / 2 : AUTO_MS)) {
      tick = 0;
      autoStep();
    }
  }, 100);

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
    dispose: () => {
      off();
      stop?.();
      dialogs.close();
    },
  };
}
