// The Adventure's DOM layer (spec V2 §8.5, §10): the hub (zone, fighters, team), the map of a run, the battle (with Auto and
// x2) and the summary. It reads the world through the store and acts through the Adventure's actions; the roster of
// creatures and the way to hand a creature over come from the app (the Areas never reach each other). Mounted by the app
// into the shell's overlay; the dialogs are adventureDialogs.ts.
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import type { GameStore } from '../../../core/world/gameStore';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import { vi } from '../../../i18n/vi';
import { t } from '../../../i18n/format';
import { art } from '../../../ui/components/icon';
import type { PanelId } from '../../../ui/components/popup';
import { el, patch } from '../../../ui/dom';
import { claimStarter, collectLoot } from '../logic/actions/camp';
import { battleAct, closeRun, enterNode, retreat, startRun } from '../logic/actions/run';
import { AB, ZONE_LIST, ZONES } from '../logic/config/content';
import { adventureOf, hasAdventure } from '../logic/save/lens';
import { actionButton, createAdventureDialogs } from './adventureDialogs';
import {
  ELEMENT_ICON,
  battleVm,
  hubVm,
  hudVm,
  mapVm,
  resultVm,
  startReason,
  type AdventureRun,
  type BattleActionVm,
  type BattleVm,
  type FighterCardVm,
  type UnitVm,
} from './adventureVm';

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
  let zoneId = ZONE_LIST[0]!.id;
  let selected: string[] = [];
  let auto = false;
  let fast = false;
  let menu: 'skills' | 'items' | null = null;
  /** An action waiting for the player to choose who it is aimed at. */
  let aim: { action: BattleActionVm; side: 'enemy' | 'ally' } | null = null;
  let busy = false;

  const world = (): WorldSave | null => {
    const s = d.world.getSnapshot();
    return s.status === 'ready' && s.save && hasAdventure(s.save) ? s.save : null;
  };
  const roster = (w: WorldSave) => d.roster(w);
  const dispatch = (run: AdventureRun): Promise<unknown> => {
    busy = true;
    return Promise.resolve(d.world.dispatch(run)).finally(() => {
      busy = false;
    });
  };
  const dialogs = createAdventureDialogs({ host: dialogHost, world, now: d.now, dispatch: (run) => void dispatch(run), roster });

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

  // ---- The hub -------------------------------------------------------------------------------------------------

  const bar = (percent: number, kind: string) =>
    el('span', { class: `c-bar adventure-ui__meter adventure-ui__meter--${kind}`, attrs: { role: 'progressbar', 'aria-valuenow': String(percent) } }, el('span', { class: 'c-bar__fill', attrs: { style: `width: ${percent}%` } }));

  function fighterCard(c: FighterCardVm, chosen: boolean): HTMLElement {
    const off = c.notReady !== null;
    return el(
      'div',
      { class: `adventure-ui__fighter${chosen ? ' is-selected' : ''}${off ? ' is-off' : ''}` },
      el(
        'button',
        {
          class: 'adventure-ui__fighter-pick',
          attrs: { type: 'button', 'aria-pressed': String(chosen), ...(off ? { disabled: '', title: c.notReady ?? '' } : {}) },
          on: {
            click: () => {
              selected = chosen ? selected.filter((k) => k !== c.key) : selected.length < AB.team.max ? [...selected, c.key] : selected;
              render();
            },
          },
        },
        art(c.art, 'adventure-ui__fighter-art', c.name) ?? el('span', { class: 'adventure-ui__fighter-art', text: '🐷' }),
        el('b', { text: c.name }),
        el('small', { text: `${ELEMENT_ICON[c.element]} ${c.style} · ${c.level}` }),
      ),
      el('div', { class: 'adventure-ui__meters' }, bar(c.expPercent, 'exp'), el('small', { text: c.expText }), bar(c.energyPercent, 'energy'), el('small', { text: c.energyText })),
      el('small', { class: 'adventure-ui__hearts', text: c.hearts }),
      c.statusChip ? el('span', { class: 'adventure-ui__chip', text: c.statusChip }) : null,
      el(
        'small',
        { class: 'adventure-ui__stats', text: (['hp', 'atk', 'def', 'spd', 'crit'] as const).map((k) => `${vi.adventure.stat[k]} ${c.stats[k]}`).join(' · ') },
      ),
      el(
        'ul',
        { class: 'adventure-ui__skills' },
        ...c.skills.map((s) => el('li', { class: s.opensAt === null ? '' : 'is-locked', attrs: { title: s.desc }, text: `${ELEMENT_ICON[s.element]} ${s.name}${s.opensAt === null ? '' : ` — ${t(vi.adventure.opensAt, { level: s.opensAt })}`}` })),
      ),
      el('button', { class: 'c-button c-button--ghost', text: vi.adventure.gear, attrs: { type: 'button' }, on: { click: () => dialogs.openGear(c.key) } }),
    );
  }

  function renderHub(w: WorldSave): HTMLElement {
    const now = d.now();
    const entries = roster(w);
    const give = d.give;
    const hub = hubVm(w, entries, now, { starter: (ww, c) => claimStarter(ww, { give }, c), loot: (ww, c) => collectLoot(ww, c) });
    const cards = hub.fighters;
    selected = selected.filter((k) => cards.some((c) => c.key === k && c.notReady === null));
    const zone = ZONES[zoneId]!;
    const reason = startReason(w, entries, zoneId, selected, now);
    return el(
      'div',
      { class: 'adventure-ui__hub' },
      el(
        'section',
        { class: 'adventure-ui__zones', attrs: { 'aria-label': vi.adventure.zones } },
        ...hub.zones.map((z) =>
          el(
            'button',
            {
              class: `adventure-ui__zone${z.id === zoneId ? ' is-selected' : ''}${z.locked ? ' is-off' : ''}`,
              attrs: { type: 'button', 'aria-pressed': String(z.id === zoneId), ...(z.locked ? { title: z.locked } : {}) },
              on: {
                click: () => {
                  zoneId = z.id;
                  render();
                },
              },
            },
            el('b', { text: z.name }),
            el('small', { text: z.desc }),
            el('span', { class: 'adventure-ui__nodes', text: z.nodes }),
            z.locked ? el('span', { class: 'adventure-ui__chip', text: z.locked }) : null,
          ),
        ),
      ),
      el(
        'div',
        { class: 'adventure-ui__quest' },
        hub.starter ? el('p', { class: 'c-dialog__hint', text: `${vi.adventure.knight}: ${vi.adventure.starterHint}` }) : null,
        hub.starter ? actionButton(hub.starter, () => void dispatch((ww, c) => claimStarter(ww, { give }, c))) : null,
        hub.loot ? actionButton(hub.loot, () => void dispatch((ww, c) => collectLoot(ww, c))) : null,
      ),
      el('h3', { text: vi.adventure.fighters }),
      el('p', { class: 'c-dialog__hint', text: t(vi.adventure.fightersHint, { cost: AB.run.energyCost }) }),
      cards.length === 0 ? el('p', { text: vi.adventure.noFighters }) : el('div', { class: 'adventure-ui__fighters' }, ...cards.map((c) => fighterCard(c, selected.includes(c.key)))),
      hub.waiting > 0 ? el('p', { class: 'c-dialog__hint', text: t(vi.adventure.waiting, { count: hub.waiting }) }) : null,
      el(
        'div',
        { class: 'adventure-ui__start' },
        el('span', { text: t(vi.adventure.selected, { count: selected.length, max: AB.team.max }) }),
        actionButton({ label: `${vi.adventure.start} — ${zone.nameVi}`, reason }, () => {
          const keys = selected;
          selected = [];
          void dispatch((ww, c) => startRun(ww, { zoneId, keys, roster: roster(ww) }, c));
        }),
      ),
    );
  }

  // ---- The map of a run -----------------------------------------------------------------------------------------

  function renderMap(w: WorldSave): HTMLElement {
    const run = adventureOf(w).run!;
    const v = mapVm(run);
    return el(
      'div',
      { class: 'adventure-ui__map' },
      el('h3', { text: v.zone }),
      el(
        'ol',
        { class: 'adventure-ui__path' },
        ...v.nodes.map((n) => el('li', { class: `adventure-ui__node is-${n.state}`, attrs: { title: n.label } }, el('span', { text: n.icon }), el('small', { text: n.label }))),
      ),
      v.event ? el('div', { class: 'adventure-ui__event' }, el('b', { text: v.event.name }), el('p', { text: v.event.text })) : null,
      el('h4', { text: vi.adventure.teamHp }),
      el(
        'div',
        { class: 'adventure-ui__team' },
        ...v.team.map((m) =>
          el(
            'div',
            { class: `adventure-ui__member${m.down ? ' is-down' : ''}` },
            art(m.art, 'adventure-ui__member-art', m.name) ?? el('span', { text: '🐷' }),
            el('b', { text: m.name }),
            bar(m.hpPercent, 'hp'),
            el('small', { text: m.down ? vi.adventure.down : m.hpText }),
          ),
        ),
      ),
      el(
        'div',
        { class: 'adventure-ui__map-actions' },
        actionButton({ label: vi.adventure.enter, reason: null }, () => void dispatch((ww, c) => enterNode(ww, c))),
        actionButton({ label: vi.adventure.retreat, reason: null }, () => void dispatch((ww, c) => retreat(ww, c)), 'c-button--ghost'),
        el('small', { class: 'c-dialog__hint', text: vi.adventure.retreatHint }),
      ),
    );
  }

  // ---- The battle ------------------------------------------------------------------------------------------------

  function act(action: BattleActionVm, target?: string) {
    aim = null;
    menu = null;
    const base = action.kind === 'attack' ? ({ kind: 'attack', target: target ?? '' } as const) : action.kind === 'skill' ? ({ kind: 'skill', skillId: action.id, ...(target ? { target } : {}) } as const) : ({ kind: 'item', itemId: action.id, ...(target ? { target } : {}) } as const);
    void dispatch((ww, c) => battleAct(ww, { action: base }, c));
  }

  function choose(action: BattleActionVm, vm: BattleVm) {
    if (action.reason) return;
    if (action.aim === null) return act(action);
    const side = action.aim;
    const options = vm.units.filter((u) => u.side === side && !u.down);
    if (options.length === 1) return act(action, options[0]!.id);
    aim = { action, side };
    render();
  }

  function unitCard(u: UnitVm): HTMLElement {
    const aimable = !!aim && aim.side === u.side && !u.down;
    return el(
      'button',
      {
        class: `adventure-ui__unit adventure-ui__unit--${u.side}${u.active ? ' is-active' : ''}${u.down ? ' is-down' : ''}${aimable ? ' is-aimable' : ''}${u.boss ? ' is-boss' : ''}`,
        attrs: { type: 'button', ...(aimable ? {} : { disabled: '' }), 'aria-label': u.name },
        on: { click: () => aimable && aim && act(aim.action, u.id) },
      },
      art(u.art, 'adventure-ui__unit-art', u.name) ?? el('span', { class: 'adventure-ui__unit-art', text: u.side === 'ally' ? '🐷' : '👾' }),
      el('b', { text: `${ELEMENT_ICON[u.element]} ${u.name}` }),
      bar(u.hpPercent, 'hp'),
      el('small', { text: u.down ? vi.adventure.down : u.hpText }),
      u.side === 'ally' ? el('small', { class: 'adventure-ui__pips', text: '⚡'.repeat(Math.min(u.energy, 10)) }) : null,
      u.statuses.length > 0 ? el('small', { class: 'adventure-ui__statuses', text: u.statuses.map((s) => `${s.icon}${s.turns}`).join(' ') }) : null,
    );
  }

  function renderBattle(w: WorldSave): HTMLElement {
    const run = adventureOf(w).run!;
    const vm = battleVm(w, run)!;
    const mine = vm.actor !== null && vm.units.find((u) => u.id === vm.actor)?.side === 'ally';
    const list = menu === 'skills' ? vm.actions.filter((a) => a.kind === 'skill') : menu === 'items' ? vm.actions.filter((a) => a.kind === 'item') : [];
    const attack = vm.actions.find((a) => a.kind === 'attack');
    const hasItems = vm.actions.some((a) => a.kind === 'item');
    const toggle = (label: string, on: boolean, click: () => void) =>
      el('button', { class: `c-button c-button--ghost${on ? ' is-on' : ''}`, text: label, attrs: { type: 'button', 'aria-pressed': String(on) }, on: { click } });
    return el(
      'div',
      { class: `adventure-ui__battle${fast ? ' is-fast' : ''}` },
      el('div', { class: 'adventure-ui__round', text: t(vi.adventure.round, { round: vm.round }) }),
      el('div', { class: 'adventure-ui__row adventure-ui__row--enemy' }, ...vm.units.filter((u) => u.side === 'enemy').map((u) => unitCard(u))),
      el('div', { class: 'adventure-ui__row adventure-ui__row--ally' }, ...vm.units.filter((u) => u.side === 'ally').map((u) => unitCard(u))),
      el(
        'div',
        { class: 'adventure-ui__actions' },
        aim
          ? el('div', {}, el('b', { text: `${aim.action.label}: ${vi.adventure.pickTarget}` }), toggle(vi.adventure.back, false, () => { aim = null; render(); }))
          : mine
            ? el(
                'div',
                { class: 'adventure-ui__action-bar' },
                el('b', { text: t(vi.adventure.yourTurn, { name: vm.units.find((u) => u.id === vm.actor)?.name ?? '' }) }),
                attack ? actionButton({ label: attack.label, reason: attack.reason }, () => choose(attack, vm)) : null,
                toggle(vi.adventure.skillsMenu, menu === 'skills', () => { menu = menu === 'skills' ? null : 'skills'; render(); }),
                hasItems ? toggle(vi.adventure.itemsMenu, menu === 'items', () => { menu = menu === 'items' ? null : 'items'; render(); }) : null,
              )
            : el('b', { text: vi.adventure.waitingFoes }),
        list.length > 0 && !aim
          ? el('div', { class: 'adventure-ui__menu' }, ...list.map((a) => el('div', { class: 'adventure-ui__menu-row' }, actionButton({ label: a.label, reason: a.reason }, () => choose(a, vm)), el('small', { text: a.detail }))))
          : null,
        el(
          'div',
          { class: 'adventure-ui__modes' },
          toggle(auto ? vi.adventure.autoOn : vi.adventure.auto, auto, () => { auto = !auto; render(); }),
          toggle(fast ? vi.adventure.speedOn : vi.adventure.speed, fast, () => { fast = !fast; render(); }),
        ),
      ),
      el('ol', { class: 'adventure-ui__log', attrs: { 'aria-live': 'polite' } }, ...vm.log.map((line) => el('li', { text: line }))),
    );
  }

  // ---- The summary -----------------------------------------------------------------------------------------------

  function renderDone(w: WorldSave): HTMLElement {
    const a = adventureOf(w);
    const run = a.run!;
    const names = new Map(run.team.map((m) => [m.key, m.name]));
    const r = resultVm(run, names)!;
    return el(
      'div',
      { class: `adventure-ui__done is-${r.result}` },
      el('h3', { text: r.title }),
      el('p', { text: r.body }),
      el('ul', {}, ...r.lines.map((l) => el('li', { text: l }))),
      r.loot.length > 0
        ? el(
            'div',
            { class: 'adventure-ui__loot' },
            el('b', { text: vi.adventure.lootTitle }),
            el('ul', {}, ...r.loot.map((l) => el('li', {}, art(l.art, 'adventure-ui__loot-icon', l.name), el('span', { text: `${l.name} x${l.count}` })))),
          )
        : null,
      actionButton({ label: vi.adventure.claim, reason: null }, () => {
        void dispatch((ww, c) => collectLoot(ww, c)).then(() => dispatch((ww, c) => closeRun(ww, c)));
      }),
    );
  }

  function render() {
    const w = world();
    if (!w) {
      patch(hud, null);
      patch(main, null);
      return;
    }
    const top = main.scrollTop;
    patch(hud, renderHud(w));
    const run = adventureOf(w).run;
    patch(main, run === null ? renderHub(w) : run.phase === 'map' ? renderMap(w) : run.phase === 'battle' ? renderBattle(w) : renderDone(w));
    main.scrollTop = top;
    if (!run || run.phase !== 'battle') {
      aim = null;
      menu = null;
    }
    dialogs.follow(w);
  }

  const off = d.world.subscribe(render);
  render();

  /** Auto: when it is an ally's turn the AI chooses for it; the enemies already answered inside the action. */
  function autoStep() {
    if (!auto || !active || busy || dialogs.isOpen()) return;
    const w = world();
    const run = w ? adventureOf(w).run : null;
    if (!w || !run || run.phase !== 'battle' || !run.battle) return;
    void dispatch((ww, c) => battleAct(ww, { action: 'auto' }, c));
  }
  let tick = 0;
  const stop = d.frame?.(() => {
    tick += 100;
    if (tick >= (fast ? AUTO_MS / 2 : AUTO_MS)) {
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
        auto = false;
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
