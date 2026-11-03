// Dropdowns with a picture for every choice (admin UX): a page writes an ordinary <select data-rich> whose options carry a visual —
// `data-img` (a picture URL), `data-swatch` (a colour), `data-icon` (an emoji) and `data-sub` (a second line) — and the dashboard
// lays a button + list over it. The native select stays in the page and keeps the value: picking an entry sets it and fires its
// own `change`, so every page keeps working as before. Long lists get a search box; Up / Down / Enter / Esc work.
import { esc } from './labels';

export interface Visual {
  img?: string | null;
  swatch?: string;
  icon?: string;
  sub?: string;
  /** Shown on the button only, never in the list (a menu's label). */
  label?: boolean;
  /** An area whose painting replaces `img` once loaded (mapThumb.ts). */
  mapId?: string;
}

/** One <option> with its visual. */
export function optionHtml(value: string, label: string, selected: boolean, v: Visual = {}, disabled = false): string {
  const attrs = [
    v.img ? `data-img="${esc(v.img)}"` : '',
    v.swatch ? `data-swatch="${esc(v.swatch)}"` : '',
    v.icon ? `data-icon="${esc(v.icon)}"` : '',
    v.sub ? `data-sub="${esc(v.sub)}"` : '',
    v.mapId ? `data-map-thumb="${esc(v.mapId)}"` : '',
    v.label ? 'data-label-only' : '',
  ].filter(Boolean).join(' ');
  return `<option value="${esc(value)}"${selected ? ' selected' : ''}${disabled ? ' disabled' : ''} ${attrs}>${esc(label)}</option>`;
}

const visualHtml = (o: HTMLOptionElement): string => {
  const d = o.dataset;
  if (d.img) return `<img class="rsel__img" src="${esc(d.img)}" alt="" loading="lazy" />`;
  if (d.swatch) return `<i class="rsel__swatch" style="background:${esc(d.swatch)}"></i>`;
  if (d.icon) return `<span class="rsel__icon">${esc(d.icon)}</span>`;
  return '<span class="rsel__icon rsel__icon--none"></span>';
};
const entryHtml = (o: HTMLOptionElement) =>
  `${visualHtml(o)}<span class="rsel__text"><span class="rsel__label">${esc(o.textContent ?? '')}</span>${o.dataset.sub ? `<small class="rsel__sub">${esc(o.dataset.sub)}</small>` : ''}</span>`;

let open: { close: () => void } | null = null;

function openList(select: HTMLSelectElement, button: HTMLButtonElement) {
  open?.close();
  const options = [...select.options];
  const pop = document.createElement('div');
  pop.className = 'rsel__pop';
  pop.setAttribute('role', 'listbox');
  const searchable = options.length > 10;
  pop.innerHTML = `${searchable ? '<input class="rsel__search" type="search" placeholder="Tìm…" />' : ''}<div class="rsel__list"></div>`;
  document.body.append(pop);
  const list = pop.querySelector<HTMLElement>('.rsel__list')!;
  const search = pop.querySelector<HTMLInputElement>('.rsel__search');
  let active = Math.max(0, select.selectedIndex);
  const shown = () => {
    const q = (search?.value ?? '').trim().toLowerCase();
    return options.map((o, i) => ({ o, i })).filter(({ o }) => !('labelOnly' in o.dataset)).filter(({ o }) => !q || `${o.textContent} ${o.dataset.sub ?? ''} ${o.value}`.toLowerCase().includes(q));
  };
  const paint = () => {
    const rows = shown();
    if (!rows.some((r) => r.i === active)) active = rows[0]?.i ?? -1;
    list.innerHTML = rows.length
      ? rows.map(({ o, i }) => `<div class="rsel__opt${i === select.selectedIndex ? ' is-selected' : ''}${i === active ? ' is-active' : ''}${o.disabled ? ' is-disabled' : ''}" role="option" data-i="${i}">${entryHtml(o)}</div>`).join('')
      : '<p class="rsel__empty">Không có lựa chọn khớp.</p>';
    list.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
  };
  const place = () => {
    const r = button.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    pop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 260) - 8))}px`;
    pop.style.minWidth = `${Math.max(r.width, 260)}px`;
    pop.style.maxHeight = `${Math.max(220, Math.min(460, below > 300 ? below - 16 : r.top - 16))}px`;
    if (below > 300 || below > r.top) pop.style.top = `${r.bottom + 4}px`;
    else pop.style.bottom = `${window.innerHeight - r.top + 4}px`;
  };
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    close();
    if (select.selectedIndex !== i) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    paintButton(select, button);
    button.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const rows = shown().filter(({ o }) => !o.disabled);
    const at = rows.findIndex((r) => r.i === active);
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter') choose(active);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') active = rows[Math.max(0, Math.min(rows.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))]?.i ?? active;
    else return;
    e.preventDefault();
    e.stopPropagation();
    if (pop.isConnected) paint();
  };
  const onOutside = (e: Event) => {
    if (!pop.contains(e.target as Node) && e.target !== button && !button.contains(e.target as Node)) close();
  };
  const onScroll = (e: Event) => {
    if (!pop.contains(e.target as Node)) close();
  };
  function close() {
    pop.remove();
    document.removeEventListener('pointerdown', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', close);
    button.setAttribute('aria-expanded', 'false');
    if (open?.close === close) open = null;
  }
  list.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (row) choose(Number(row.dataset.i));
  });
  list.addEventListener('pointermove', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (row && Number(row.dataset.i) !== active) {
      active = Number(row.dataset.i);
      list.querySelectorAll('.is-active').forEach((x) => x.classList.remove('is-active'));
      row.classList.add('is-active');
    }
  });
  search?.addEventListener('input', paint);
  document.addEventListener('pointerdown', onOutside, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', close);
  button.setAttribute('aria-expanded', 'true');
  open = { close };
  place();
  paint();
  (search ?? list).focus?.();
}

function paintButton(select: HTMLSelectElement, button: HTMLButtonElement) {
  const o = select.options[select.selectedIndex];
  button.innerHTML = `${o ? entryHtml(o) : '<span class="rsel__text">—</span>'}<span class="rsel__caret" aria-hidden="true">▾</span>`;
  button.disabled = select.disabled;
}

function enhance(select: HTMLSelectElement) {
  select.dataset.richDone = '1';
  select.classList.add('rsel__native');
  select.tabIndex = -1;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `rsel${select.dataset.rich === 'compact' ? ' rsel--compact' : ''}`;
  button.setAttribute('aria-haspopup', 'listbox');
  select.after(button);
  paintButton(select, button);
  button.addEventListener('click', () => (open && button.getAttribute('aria-expanded') === 'true' ? open.close() : openList(select, button)));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openList(select, button);
    }
  });
  // A page that sets the value itself (or redraws the options) keeps the button in step.
  select.addEventListener('change', () => paintButton(select, button));
  new MutationObserver(() => paintButton(select, button)).observe(select, { childList: true, subtree: true, attributes: true });
}

/** Lays the picture dropdown over every `select[data-rich]` under `root` not done yet. */
export function richSelects(root: ParentNode = document) {
  root.querySelectorAll<HTMLSelectElement>('select[data-rich]:not([data-rich-done])').forEach(enhance);
}

/** Keeps every picture dropdown of the dashboard laid out as pages and dialogs draw (once, from main.ts). */
export function watchRichSelects() {
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      richSelects(document);
    });
  }).observe(document.body, { childList: true, subtree: true });
  richSelects(document);
}
