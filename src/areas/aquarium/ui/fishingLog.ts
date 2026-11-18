// The rod's screen, the parts of decision 061: what a cast brought besides its fish, and the catch book.
import { el } from '../../../ui/dom';
import { art } from '../../../ui/components/icon';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { WorldSave } from '../../../core/save/world';
import { AB } from '../logic/config/content';
import type { AquariumEvent } from '../logic/events';
import { catchBookVm } from './dockVm';
import { nameOfItem } from './vmKit';

type Cast = Extract<AquariumEvent, { type: 'AQUARIUM_CAST' }>;

/** The lines under a catch: its size, a new best, and the cast event (a school, a giant, a bottle, a chest). */
export function castNotes(cast: Cast): string[] {
  const F = vi.aquarium.fishing;
  const notes: string[] = [];
  if (cast.sizeCm !== undefined) notes.push(t(F.sizeCm, { cm: cast.sizeCm }));
  if (cast.record) notes.push(t(F.record, { coins: AB.fishing.record.coins }));
  if (cast.event === 'school') notes.push(t(F.events.school, { n: cast.quantity - 1 }));
  if (cast.event === 'giant') notes.push(t(F.events.giant, { coins: AB.fishing.events.giant.coins }));
  if (cast.event === 'bottle') notes.push(t(F.events.bottle, { coins: cast.bonusCoins ?? 0 }));
  if (cast.event === 'chest') notes.push(t(F.events.chest, { items: Object.entries(cast.bonusItems ?? {}).map(([id, n]) => `${nameOfItem(id)} ×${n}`).join(', ') }));
  return notes;
}

/** The catch book as a folding list under the rod. */
export function catchBookView(world: WorldSave, open: boolean, onToggle: (open: boolean) => void): HTMLElement {
  const F = vi.aquarium.fishing;
  const book = catchBookVm(world);
  return el(
    'details',
    { class: 'aquarium-rod__odds', attrs: open ? { open: '' } : {}, on: { toggle: (e) => onToggle((e.currentTarget as HTMLDetailsElement).open) } },
    el('summary', { text: t(F.book.show, { found: book.found, total: book.rows.length }) }),
    el('p', { class: 'aquarium-rod__lead', text: F.book.hint }),
    el(
      'ul',
      { class: 'aquarium-dialog__odds' },
      ...book.rows.map((r) =>
        el(
          'li',
          { class: r.count > 0 ? '' : 'is-unknown' },
          art(r.art, 'aquarium-dialog__odds-icon'),
          el('span', { text: r.name }),
          el('small', { text: r.count > 0 ? `${t(F.book.count, { n: r.count })} · ${t(F.book.best, { cm: r.bestCm ?? 0 })}` : F.book.empty }),
        ),
      ),
    ),
  );
}
