// The Adventure's dialogs (the equipment of a fighter): the body is rebuilt from the world while the dialog is open, so the
// bag's pieces stay true after each change. A button always says why it is off.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { ItemId } from '../../../core/config/ids';
import { itemArtId } from '../../../core/config/assetIds';
import { ITEM_IDS } from '../../../core/config/items';
import type { WorldSave } from '../../../core/save/world';
import { vi } from '../../../i18n/vi';
import { t } from '../../../i18n/format';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../systems/equipment';
import { openDialog } from '../../../ui/components/dialog';
import { art } from '../../../ui/components/icon';
import { el, patch } from '../../../ui/dom';
import { equipItem, unequipSlotOf } from '../logic/actions/camp';
import { EQUIPMENT_DEFS } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { probe, slotVms, type AdventureRun, type ButtonVm } from './adventureVm';

/** A button that always says why it is off. */
export function actionButton(vm: ButtonVm, onClick: () => void, variant = ''): HTMLElement {
  const off = vm.reason !== null;
  return el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: `c-button ${variant}`.trim(),
      text: vm.label,
      attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}) },
      on: { click: () => !off && onClick() },
    }),
    off ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}

export interface AdventureDialogsDeps {
  /** Where dialogs open (one at a time). */
  host: HTMLElement;
  world: () => WorldSave | null;
  now: () => number;
  dispatch: (run: AdventureRun) => void;
  roster: (world: WorldSave) => RosterEntry[];
}

export function createAdventureDialogs(d: AdventureDialogsDeps) {
  /** The open dialog's body renderer; re-run on every world change. */
  let live: { body: HTMLElement; render: (w: WorldSave) => HTMLElement | null } | null = null;

  function openLive(title: string, render: (w: WorldSave) => HTMLElement | null) {
    const w = d.world();
    if (!w) return;
    const handle = openDialog(d.host, title, vi.adventure.close);
    live = { body: handle.body, render };
    patch(handle.body, render(w));
  }

  /** The pieces of the bag that fit `slot`, best first. */
  const bagPieces = (w: WorldSave, slot: EquipmentSlot) =>
    ITEM_IDS.filter((id) => EQUIPMENT_DEFS[id]?.slot === slot && (w.inventory.items[id] ?? 0) > 0);

  function openGear(key: string) {
    const entry0 = d.roster(d.world()!).find((r) => r.key === key);
    openLive(t(vi.adventure.gearTitle, { name: entry0?.name ?? '' }), (w) => {
      const a = adventureOf(w);
      const slots = slotVms(a.fighters[key]?.loadout ?? {});
      return el(
        'div',
        { class: 'adventure-dialog' },
        ...EQUIPMENT_SLOTS.map((slot) => {
          const vm = slots.find((s) => s.slot === slot)!;
          const pieces = bagPieces(w, slot);
          const off: AdventureRun = (ww, c) => unequipSlotOf(ww, { key, slot }, c);
          const offError = vm.itemId ? probe(w, off, d.now()) : null;
          return el(
            'section',
            { class: 'adventure-dialog__slot' },
            el('b', { text: vm.label }),
            el(
              'div',
              { class: 'adventure-dialog__worn' },
              vm.itemId ? art(itemArtId(vm.itemId as ItemId), 'adventure-dialog__icon', vm.name ?? '') : null,
              el('span', { text: vm.itemId ? `${vm.name} (${vm.bonus})` : vi.adventure.emptySlot }),
              vm.itemId ? actionButton({ label: vi.adventure.takeOff, reason: offError ? vi.error[offError] : null }, () => d.dispatch(off), 'c-button--ghost') : null,
            ),
            pieces.length === 0
              ? el('small', { class: 'c-dialog__hint', text: t(vi.adventure.noPieces, { slot: vm.label.toLowerCase() }) })
              : el(
                  'ul',
                  { class: 'adventure-dialog__pieces' },
                  ...pieces.map((id) => {
                    const run: AdventureRun = (ww, c) => equipItem(ww, { key, itemId: id }, c);
                    const error = probe(w, run, d.now());
                    const def = EQUIPMENT_DEFS[id]!;
                    const bonus = (['hp', 'atk', 'def', 'spd', 'crit'] as const)
                      .filter((k) => (def.stats[k] ?? 0) > 0)
                      .map((k) => `+${def.stats[k]} ${vi.adventure.stat[k]}`)
                      .join(', ');
                    return el(
                      'li',
                      {},
                      art(itemArtId(id), 'adventure-dialog__icon', vi.shop[id]),
                      el('span', { text: `${vi.shop[id]} x${w.inventory.items[id] ?? 0} (${bonus})` }),
                      actionButton({ label: vi.adventure.putOn, reason: error ? vi.error[error] : null }, () => d.dispatch(run)),
                    );
                  }),
                ),
          );
        }),
      );
    });
  }

  return {
    openGear,
    /** The world changed: the open dialog follows it (and is forgotten once the player closed it). */
    follow(w: WorldSave) {
      if (!live) return;
      if (d.host.childElementCount === 0) live = null;
      else patch(live.body, live.render(w));
    },
    close() {
      live = null;
      d.host.replaceChildren();
    },
    isOpen: () => d.host.childElementCount > 0,
  };
}

export type AdventureDialogs = ReturnType<typeof createAdventureDialogs>;
