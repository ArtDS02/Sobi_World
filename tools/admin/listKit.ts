// Shared list toolbar of the admin dashboard (DECISIONS AD-1): search box, filter selects, sort,
// "Xoá bộ lọc" with an active-filter badge, pagination. The toolbar is drawn once; typing only
// redraws the results, so the search box keeps focus. State survives page switches (per list id).
import { esc } from './labels';
import { activeCount, emptyState, runQuery, type ListQuery, type ListState } from './listQuery';

export interface ListSpec<T> extends ListQuery<T> {
  id: string;
  items: () => readonly T[];
  placeholder: string;
  noun: string; // "heo", "sản phẩm"…
  /** Results markup for one page. */
  render: (rows: T[]) => string;
  /** Wrapper class of the results (grid / table). */
  resultsClass: string;
  /** Extra toolbar markup on the right (create buttons…). */
  actions?: string;
  /** Called after each results redraw (bind row events). */
  bind?: (results: HTMLElement) => void;
}

const memory = new Map<string, ListState>();

export function listState(id: string, sort = ''): ListState {
  let s = memory.get(id);
  if (!s) memory.set(id, (s = emptyState(sort)));
  return s;
}

/** Applies `?key=value` links (overview cards) to a list's filters. */
export function applyQueryString(id: string, query: string) {
  const s = listState(id);
  const p = new URLSearchParams(query);
  for (const [k, v] of p) {
    if (k === 'q') s.q = v;
    else s.filters[k] = v;
  }
  if ([...p.keys()].length) s.page = 0;
}

const select = (key: string, all: string, opts: readonly (readonly [string, string])[], cur: string) =>
  `<select data-lf="${esc(key)}" class="${cur ? 'is-set' : ''}" aria-label="${esc(all)}">
    <option value="">${esc(all)}</option>
    ${opts.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}
  </select>`;

export function mountList<T>(root: HTMLElement, spec: ListSpec<T>) {
  const s = listState(spec.id, spec.sorts[0]?.key ?? '');
  root.innerHTML = `
    <div class="toolbar">
      <input class="search" type="search" data-lq placeholder="${esc(spec.placeholder)}" value="${esc(s.q)}" />
      ${spec.filters.map((f) => select(f.key, f.label, f.options, s.filters[f.key] ?? '')).join('')}
      ${spec.sorts.length > 1 ? `<select data-ls aria-label="Sắp xếp">${spec.sorts.map((o) => `<option value="${o.key}"${o.key === s.sort ? ' selected' : ''}>↕ ${esc(o.label)}</option>`).join('')}</select>` : ''}
      <button class="btn btn-small" data-lclear type="button">✕ Xoá bộ lọc <span class="count-badge" data-lcount></span></button>
      ${spec.actions ?? ''}
    </div>
    <p class="muted list-meta" data-lmeta></p>
    <div class="${spec.resultsClass}" data-lresults></div>
    <nav class="pager" data-lpager></nav>`;
  const results = root.querySelector<HTMLElement>('[data-lresults]')!;
  const draw = () => {
    const r = runQuery(spec.items(), spec, s);
    s.page = r.page;
    results.innerHTML = r.rows.length ? spec.render(r.rows) : `<p class="empty">Không có ${esc(spec.noun)} nào khớp bộ lọc 🐽</p>`;
    const n = activeCount(s);
    const clear = root.querySelector<HTMLButtonElement>('[data-lclear]')!;
    clear.disabled = n === 0;
    clear.classList.toggle('is-active', n > 0);
    root.querySelector('[data-lcount]')!.textContent = n ? String(n) : '';
    root.querySelector('[data-lmeta]')!.textContent =
      `${r.total}/${spec.items().length} ${spec.noun}${n ? ` · đang lọc ${n} tiêu chí` : ''}`;
    root.querySelector('[data-lpager]')!.innerHTML = r.pages > 1
      ? `<button class="btn btn-small" data-lpage="${r.page - 1}" ${r.page === 0 ? 'disabled' : ''}>‹ Trước</button>
         <span>Trang ${r.page + 1}/${r.pages}</span>
         <button class="btn btn-small" data-lpage="${r.page + 1}" ${r.page >= r.pages - 1 ? 'disabled' : ''}>Sau ›</button>`
      : '';
    spec.bind?.(results);
  };
  root.querySelector<HTMLInputElement>('[data-lq]')!.addEventListener('input', (e) => {
    s.q = (e.target as HTMLInputElement).value;
    s.page = 0;
    draw();
  });
  root.querySelectorAll<HTMLSelectElement>('[data-lf]').forEach((el) =>
    el.addEventListener('change', () => {
      s.filters[el.dataset.lf!] = el.value;
      el.classList.toggle('is-set', !!el.value);
      s.page = 0;
      draw();
    }),
  );
  root.querySelector<HTMLSelectElement>('[data-ls]')?.addEventListener('change', (e) => {
    s.sort = (e.target as HTMLSelectElement).value;
    draw();
  });
  root.querySelector('[data-lclear]')!.addEventListener('click', () => {
    Object.assign(s, emptyState(s.sort));
    mountList(root, spec);
  });
  root.querySelector('[data-lpager]')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-lpage]');
    if (!b) return;
    s.page = Number(b.dataset.lpage);
    draw();
    root.scrollIntoView({ block: 'start' });
  });
  draw();
  return { redraw: draw };
}
