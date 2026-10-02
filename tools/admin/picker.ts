// Visual picker (DECISIONS AD-1): choose an image (pig art, product icon, layout asset) from a
// searchable thumbnail grid instead of a plain id dropdown. Grouped, with a note per item
// ("đang dùng: Heo Hồng…") and items that cannot be chosen greyed out with the reason.
import { esc } from './labels';
import { fold } from './listQuery';
import { openModal } from './modal';

export interface PickItem {
  id: string;
  label: string;
  url: string | null;
  group: string;
  note?: string;
  /** Why it cannot be chosen; null/undefined = selectable. */
  blocked?: string | null;
}

export function openPicker(o: { title: string; items: PickItem[]; current: string; onPick: (id: string) => void }) {
  // Choosable first (current choice always visible), then the greyed-out ones.
  const items = [...o.items].sort((a, b) => Number(!!a.blocked) - Number(!!b.blocked));
  const groups = [...new Set(items.map((i) => i.group))];
  const anyBlocked = items.some((i) => i.blocked);
  let chosen = o.current;
  const tile = (i: PickItem) => `<button type="button" class="pick${i.id === chosen ? ' is-on' : ''}${i.blocked ? ' is-blocked' : ''}" data-pick-id="${esc(i.id)}"
      data-text="${esc(fold(`${i.id} ${i.label} ${i.note ?? ''}`))}" data-group="${esc(i.group)}" title="${esc(i.blocked ?? i.note ?? i.id)}" ${i.blocked ? 'aria-disabled="true"' : ''}>
      ${i.url ? `<img src="${esc(i.url)}" alt="" loading="lazy" />` : '<span class="pick__none">?</span>'}
      <b>${esc(i.label)}</b><small>${esc(i.blocked ?? i.note ?? i.id)}</small></button>`;
  openModal({
    title: o.title,
    submit: 'Chọn',
    body: `<div class="toolbar"><input class="search" type="search" data-pq placeholder="Tìm tên, id…" />
        ${groups.length > 1 ? `<select data-pg><option value="">Mọi nhóm</option>${groups.map((g) => `<option>${esc(g)}</option>`).join('')}</select>` : ''}
        ${anyBlocked ? '<label class="check"><input type="checkbox" data-pfree checked /> Chỉ cái chọn được</label>' : ''}</div>
      <p class="muted" data-pcount></p>
      <div class="pick-grid">${items.map(tile).join('')}</div>`,
    onOpen: (f) => {
      const apply = () => {
        const q = fold(f.querySelector<HTMLInputElement>('[data-pq]')!.value).split(/\s+/).filter(Boolean);
        const g = f.querySelector<HTMLSelectElement>('[data-pg]')?.value ?? '';
        const free = f.querySelector<HTMLInputElement>('[data-pfree]')?.checked ?? false;
        let shown = 0;
        f.querySelectorAll<HTMLElement>('.pick').forEach((el) => {
          const ok = q.every((w) => el.dataset.text!.includes(w)) && (!g || el.dataset.group === g) && (!free || !el.classList.contains('is-blocked'));
          el.hidden = !ok;
          if (ok) shown++;
        });
        f.querySelector('[data-pcount]')!.textContent = `${shown}/${items.length} mục`;
      };
      apply();
      f.addEventListener('input', apply);
      f.addEventListener('change', apply);
      f.querySelector('.pick-grid')!.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('.pick');
        if (!b || b.classList.contains('is-blocked')) return;
        chosen = b.dataset.pickId!;
        f.querySelectorAll('.pick.is-on').forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
      });
      f.querySelector('.pick-grid')!.addEventListener('dblclick', (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('.pick');
        if (b && !b.classList.contains('is-blocked')) f.requestSubmit();
      });
      f.querySelector('.pick.is-on')?.scrollIntoView({ block: 'center' });
    },
    onSubmit: () => {
      if (!chosen) return 'Chọn một mục';
      o.onPick(chosen);
    },
  });
}

/** Button that shows the current choice as a thumbnail and opens the picker. */
export const pickButton = (name: string, value: string, url: string | null, label: string) =>
  `<button type="button" class="pick-btn" data-picker="${esc(name)}">
    ${url ? `<img src="${esc(url)}" alt="" />` : '<span class="pick__none">?</span>'}
    <span><b>${esc(label)}</b><small>${esc(value || 'chưa chọn')} · đổi…</small></span></button>
    <input type="hidden" name="${esc(name)}" value="${esc(value)}" />`;
