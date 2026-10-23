// The Adventure's dialogs: a companion's profile (tabs: stats, skills, skill tree and loadout, gear, the temple) and the portal's
// destinations. The body is rebuilt from the world while the dialog is open, so it stays true after each change. A button always says
// why it is off.
import type { RosterEntry } from '../../../core/area-registry/registry';
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import { ITEM_IDS } from '../../../core/config/items';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../systems/equipment';
import { openDialog } from '../../../ui/components/dialog';
import { art } from '../../../ui/components/icon';
import { el, patch } from '../../../ui/dom';
import { equipItem, unequipSlotOf } from '../logic/actions/camp';
import { changeClass, resetTree, setLoadout, stepNode, useScroll } from '../logic/actions/growth';
import { travel } from '../logic/actions/explore';
import { EQUIPMENT_DEFS, NODES } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { exploreVm } from './exploreVm';
import { equipmentText, sheetVm, type NodeVm, type SheetVm, type SkillVm } from './fighterVm';
import { actionButton, classIcon, skillIcon } from './viewKit';
import { className, errorText, nameOfItem, probe, type AdventureRun } from './vmKit';

export interface AdventureDialogsDeps {
  /** Where dialogs open (one at a time). */
  host: HTMLElement;
  world: () => WorldSave | null;
  now: () => number;
  dispatch: (run: AdventureRun) => void;
  roster: (world: WorldSave) => RosterEntry[];
  /** Where the walker stands now (the scene's own position, fresher than the save). */
  position: () => { x: number; y: number; facing?: 'up' | 'down' | 'left' | 'right' } | null;
}

type Tab = 'stats' | 'skills' | 'tree' | 'gear' | 'temple';
const TABS: readonly Tab[] = ['stats', 'skills', 'tree', 'gear', 'temple'];
const TAB_LABEL: Record<Tab, () => string> = {
  stats: () => vi.adventure.sheet.tabStats,
  skills: () => vi.adventure.sheet.tabSkills,
  tree: () => vi.adventure.sheet.tabTree,
  gear: () => vi.adventure.sheet.tabGear,
  temple: () => vi.adventure.sheet.tabTemple,
};

function skillRow(s: SkillVm, extra: HTMLElement | null = null, cls = ''): HTMLElement {
  return el(
    'li',
    { class: `adventure-sheet__skill${s.opensAt !== null ? ' is-locked' : ''} ${cls}`.trim(), attrs: { title: s.desc } },
    el('b', { class: 'adventure-sheet__skill-name' }, skillIcon(s.id, s.element, s.name), el('span', { text: `${s.name}${s.maxLevel > 1 ? ` · ${t(vi.adventure.sheet.nodeLevel, { level: s.level, max: s.maxLevel })}` : ''}` })),
    el('small', { text: [s.cost, s.opensAt !== null ? t(vi.adventure.sheet.opensAt, { level: s.opensAt }) : ''].filter(Boolean).join(' · ') }),
    el('p', { text: s.desc }),
    extra,
  );
}

export function createAdventureDialogs(d: AdventureDialogsDeps) {
  /** The open dialog's body renderer; re-run on every world change. */
  let live: { body: HTMLElement; render: (w: WorldSave) => HTMLElement | null } | null = null;
  let tab: Tab = 'stats';

  function openLive(title: string, render: (w: WorldSave) => HTMLElement | null) {
    const w = d.world();
    if (!w) return;
    const handle = openDialog(d.host, title, vi.adventure.close);
    live = { body: handle.body, render };
    patch(handle.body, render(w));
  }

  const rerender = () => {
    const w = d.world();
    if (w && live) patch(live.body, live.render(w));
  };

  const bagPieces = (w: WorldSave, slot: EquipmentSlot) => ITEM_IDS.filter((id) => EQUIPMENT_DEFS[id]?.slot === slot && (w.inventory.items[id] ?? 0) > 0);

  function treeNode(n: NodeVm, key: string, roster: readonly RosterEntry[]): HTMLElement {
    return el(
      'div',
      { class: `adventure-tree__node is-${n.level > 0 ? 'open' : n.step?.reason ? 'locked' : 'ready'}${n.carried ? ' is-carried' : ''}` },
      el('b', { class: 'adventure-sheet__skill-name' }, skillIcon(n.skill.id, n.skill.element, n.skill.name), el('span', { text: n.skill.name })),
      el('small', { text: n.level > 0 ? t(vi.adventure.sheet.nodeLevel, { level: n.level, max: n.skill.maxLevel }) : (n.needs ? t(vi.adventure.sheet.needs, { nodes: n.needs }) : '') }),
      el('small', { class: 'adventure-tree__desc', text: `${n.skill.cost} · ${n.skill.desc}` }),
      el(
        'div',
        { class: 'adventure-tree__buttons' },
        n.step ? actionButton(n.step, () => d.dispatch((w, c) => stepNode(w, { key, nodeId: n.id, roster }, c))) : el('small', { text: vi.adventure.sheet.maxed }),
        n.carry
          ? actionButton(n.carry, () => {
              const w = d.world();
              if (!w) return;
              const sheet = sheetVm(w, roster.find((r) => r.key === key)!, d.now(), roster)!;
              const carried = sheet.nodes.filter((x) => x.carried).map((x) => NODES[x.id]!.skill);
              const skill = NODES[n.id]!.skill;
              const next = n.carried ? carried.filter((s) => s !== skill) : [...carried, skill];
              d.dispatch((ww, c) => setLoadout(ww, { key, skills: next, roster }, c));
            }, 'c-button--ghost')
          : null,
      ),
    );
  }

  function sheetBody(v: SheetVm, w: WorldSave, roster: readonly RosterEntry[]): HTMLElement {
    const key = v.key;
    const tabs = el(
      'div',
      { class: 'adventure-sheet__tabs', attrs: { role: 'tablist' } },
      ...TABS.map((x) => el('button', { class: `c-button c-button--ghost${x === tab ? ' is-on' : ''}`, text: TAB_LABEL[x](), attrs: { type: 'button', role: 'tab', 'aria-selected': String(x === tab) }, on: { click: () => ((tab = x), rerender()) } })),
    );
    let body: HTMLElement;
    if (tab === 'stats') {
      body = el(
        'div',
        { class: 'adventure-sheet__stats' },
        el('div', { class: 'adventure-sheet__arts' }, art(v.art, 'adventure-sheet__art', v.title), art(v.guardianArt, 'adventure-sheet__guardian', v.guardian)),
        el('p', { text: `${v.guardian} · ${v.elements}` }),
        el('dl', {}, ...v.stats.flatMap((s) => [el('dt', { text: s.name }), el('dd', { text: formatInt(s.value) })])),
      );
    } else if (tab === 'skills') {
      body = el(
        'div',
        {},
        el('h4', { text: vi.adventure.sheet.unique }),
        el('ul', { class: 'adventure-sheet__skills' }, ...v.unique.map((s) => skillRow(s))),
        el('h4', { text: vi.adventure.sheet.ultimate }),
        el('ul', { class: 'adventure-sheet__skills' }, skillRow(v.ultimate, null, 'is-ultimate')),
        el('h4', { text: v.loadoutTitle }),
        el('ul', { class: 'adventure-sheet__skills' }, ...v.nodes.filter((n) => n.carried).map((n) => skillRow(n.skill))),
      );
    } else if (tab === 'tree') {
      const tiers = [...new Set(v.nodes.map((n) => n.tier))].sort();
      body = el(
        'div',
        { class: 'adventure-tree' },
        el('p', { class: 'adventure-tree__sp', text: `${v.spText} · ${v.loadoutTitle}` }),
        v.scroll ? actionButton(v.scroll, () => d.dispatch((ww, c) => useScroll(ww, { key, roster }, c)), 'c-button--ghost') : null,
        ...tiers.map((tier) =>
          el(
            'section',
            { class: 'adventure-tree__tier' },
            el('h4', { text: t(vi.adventure.sheet.tier, { tier }) }),
            el('div', { class: 'adventure-tree__row' }, ...v.nodes.filter((n) => n.tier === tier).map((n) => treeNode(n, key, roster))),
          ),
        ),
      );
    } else if (tab === 'gear') {
      body = el(
        'div',
        { class: 'adventure-dialog' },
        ...EQUIPMENT_SLOTS.map((slot) => {
          const vm = v.slots.find((s) => s.slot === slot)!;
          const pieces = bagPieces(w, slot);
          const off: AdventureRun = (ww, c) => unequipSlotOf(ww, { key, slot }, c);
          return el(
            'section',
            { class: 'adventure-dialog__slot' },
            el('b', { text: vm.label }),
            el(
              'div',
              { class: 'adventure-dialog__worn' },
              vm.itemId ? art(itemArtId(vm.itemId as ItemId), 'adventure-dialog__icon', vm.name ?? '') : null,
              el('span', { text: vm.itemId ? `${vm.name} (${vm.bonus})` : vi.adventure.emptySlot }),
              vm.itemId ? actionButton({ label: vi.adventure.takeOff, reason: errorText(probe(w, off, d.now())) }, () => d.dispatch(off), 'c-button--ghost') : null,
            ),
            pieces.length === 0
              ? el('small', { class: 'c-dialog__hint', text: t(vi.adventure.noPieces, { slot: vm.label.toLowerCase() }) })
              : el(
                  'ul',
                  { class: 'adventure-dialog__pieces' },
                  ...pieces.map((id) => {
                    const run: AdventureRun = (ww, c) => equipItem(ww, { key, itemId: id }, c);
                    const def = EQUIPMENT_DEFS[id]!;
                    return el(
                      'li',
                      {},
                      art(itemArtId(id), 'adventure-dialog__icon', nameOfItem(id)),
                      el('span', { text: `${nameOfItem(id)} x${w.inventory.items[id] ?? 0} — ${equipmentText(id)}${def.levelReq > 1 ? ` (${t(vi.adventure.sheet.gearLevel, { level: def.levelReq })})` : ''}` }),
                      actionButton({ label: vi.adventure.putOn, reason: errorText(probe(w, run, d.now())) }, () => d.dispatch(run)),
                    );
                  }),
                ),
          );
        }),
      );
    } else {
      body = el(
        'div',
        { class: 'adventure-sheet__temple' },
        el('p', { class: 'adventure-sheet__class' }, classIcon(v.classId), el('span', { text: t(vi.adventure.sheet.classNow, { class: className(v.classId) }) })),
        v.temple.blocked ? el('p', { class: 'c-dialog__hint', text: v.temple.blocked }) : null,
        el('p', { class: 'c-dialog__hint', text: vi.adventure.sheet.changeHint }),
        ...v.temple.classes.map((c) => actionButton(c, () => d.dispatch((ww, ctx) => changeClass(ww, { key, classId: c.classId, roster }, ctx)), 'c-button--ghost')),
        actionButton(v.temple.reset, () => d.dispatch((ww, ctx) => resetTree(ww, { key, roster }, ctx)), 'c-button--ghost'),
      );
    }
    return el('div', { class: 'adventure-sheet' }, tabs, body);
  }

  function openSheet(key: string) {
    const w0 = d.world();
    if (!w0) return;
    const entry0 = d.roster(w0).find((r) => r.key === key);
    if (!entry0) return;
    tab = 'stats';
    openLive(entry0.name, (w) => {
      const roster = d.roster(w);
      const entry = roster.find((r) => r.key === key);
      const v = entry ? sheetVm(w, entry, d.now(), roster) : null;
      return v ? sheetBody(v, w, roster) : null;
    });
  }

  function openPortal() {
    openLive(vi.adventure.explore.portalTitle, (w) => {
      const run = adventureOf(w).run;
      if (!run || run.phase !== 'explore') return null;
      const v = exploreVm(w, run, null);
      if (!v) return null;
      return el(
        'div',
        { class: 'adventure-dialog adventure-portal' },
        ...v.portal.destinations.map((dest) =>
          el('button', {
            class: `c-button${dest.mapId === 'camp' ? ' c-button--ghost' : ''}`,
            text: dest.label,
            attrs: { type: 'button' },
            on: {
              click: () => {
                const pos = d.position() ?? { x: run.x, y: run.y };
                d.dispatch((ww, c) => travel(ww, { ...pos, to: dest.mapId }, c));
                close();
              },
            },
          }),
        ),
      );
    });
  }

  function close() {
    live = null;
    d.host.replaceChildren();
  }

  return {
    openSheet,
    openPortal,
    /** The world changed: the open dialog follows it (and is forgotten once the player closed it). */
    follow(w: WorldSave) {
      if (!live) return;
      if (d.host.childElementCount === 0) live = null;
      else patch(live.body, live.render(w));
    },
    close,
    isOpen: () => d.host.childElementCount > 0,
  };
}

export type AdventureDialogs = ReturnType<typeof createAdventureDialogs>;
