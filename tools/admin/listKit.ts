// Shared list toolbar of the admin dashboard (DECISIONS AD-1): search box, filter selects with live
// counts per option, sort, page size, "Xoá bộ lọc" with an active-filter badge, pagination. The
// toolbar is drawn once; typing only redraws the results, so the search box keeps focus. State is
// remembered per list id, also across the reload Vite does after a config file is saved.
import { esc } from './labels';
import { activeCount, emptyState, facetCounts, runQuery, type ListQuery, type ListState } from './listQuery';

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

type Saved = ListState & { size?: number };
const memory = new Map<string, Saved>();
const KEY = (id: string) => `unin-admin:list:${id}`;
const SIZES = [12, 24, 48, 96];

function persist(id: string, s: Saved) {
  try {
    localStorage.setItem(KEY(id), JSON.stringify({ ...s, page: 0 }));
  } catch {
    /* storage blocked: the list just forgets on reload */
  }
}

export function listState(id: string, sort = ''): Saved {
  let s = memory.get(id);
  if (!s) {
    s = emptyState(sort);
    try {
      const raw = localStorage.getItem(KEY(id));
      if (raw) Object.assign(s, JSON.parse(raw) as Saved);
    } catch {
      /* unreadable: start clean */
    }
    memory.set(id, s);
  }
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
  persist(id, s);
}

const select = (key: string, all: string, opts: readonly (readonly [string, string])[], cur: string) =>
  `<select data-lf="${esc(key)}" class="${cur ? 'is-set' : ''}" aria-label="${esc(all)}">
    <option value="">${esc(all)}</option>
    ${opts.map(([v, l]) => `<option value="${esc(v)}" data-label="${esc(l)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}
  </select>`;

export function mountList<T>(root: HTMLElement, spec: ListSpec<T>) {
  const s = listState(spec.id, spec.sorts[0]?.key ?? '');
  if (!spec.sorts.some((o) => o.key === s.sort)) s.sort = spec.sorts[0]?.key ?? '';
  const sizes = [...new Set([...SIZES, spec.pageSize])].sort((a, b) => a - b);
  root.innerHTML = `
    <div class="toolbar">
      <input class="search" type="search" data-lq placeholder="${esc(spec.placeholder)}" value="${esc(s.q)}" />
      ${spec.filters.map((f) => select(f.key, f.label, f.options, s.filters[f.key] ?? '')).join('')}
      ${spec.sorts.length > 1 ? `<select data-ls aria-label="Sắp xếp">${spec.sorts.map((o) => `<option value="${o.key}"${o.key === s.sort ? ' selected' : ''}>↕ ${esc(o.label)}</option>`).join('')}</select>` : ''}
      <button class="btn btn-small" data-lclear type="button">✕ Xoá bộ lọc <span class="count-badge" data-lcount></span></button>
      ${spec.actions ?? ''}
    </div>
    <div class="list-meta"><span class="muted" data-lmeta></span><span class="active-chips" data-lchips></span>
      <label class="muted page-size">Hiển thị <select data-lsize aria-label="Số dòng mỗi trang">${sizes.map((n) => `<option value="${n}"${n === (s.size ?? spec.pageSize) ? ' selected' : ''}>${n}</option>`).join('')}</select> / trang</label></div>
    <div class="${spec.resultsClass}" data-lresults></div>
    <nav class="pager" data-lpager></nav>`;
  const results = root.querySelector<HTMLElement>('[data-lresults]')!;
  const query = () => ({ ...spec, pageSize: s.size ?? spec.pageSize });

  /** Option texts get "(n)": what choosing it would leave, given everything else. */
  const counts = () => {
    for (const el of root.querySelectorAll<HTMLSelectElement>('[data-lf]')) {
      const n = facetCounts(spec.items(), query(), s, el.dataset.lf!);
      for (const o of el.options) if (o.value) o.textContent = `${o.dataset.label} (${n[o.value] ?? 0})`;
    }
  };

  /** One removable chip per active criterion, so the state is readable at a glance. */
  const chips = () =>
    [
      s.q.trim() ? `<button type="button" class="chip chip--on" data-unset="q">🔍 “${esc(s.q.trim())}” ✕</button>` : '',
      ...spec.filters.map((f) => {
        const v = s.filters[f.key];
        const label = f.options.find(([x]) => x === v)?.[1];
        return v && label ? `<button type="button" class="chip chip--on" data-unset="${esc(f.key)}">${esc(label)} ✕</button>` : '';
      }),
    ].join('');

  const draw = () => {
    const r = runQuery(spec.items(), query(), s);
    s.page = r.page;
    results.innerHTML = r.rows.length ? spec.render(r.rows) : `<p class="empty">Không có ${esc(spec.noun)} nào khớp bộ lọc 🐽</p>`;
    const n = activeCount(s);
    const clear = root.querySelector<HTMLButtonElement>('[data-lclear]')!;
    clear.disabled = n === 0;
    clear.classList.toggle('is-active', n > 0);
    root.querySelector('[data-lcount]')!.textContent = n ? String(n) : '';
    root.querySelector('[data-lmeta]')!.textContent = `${r.total}/${spec.items().length} ${spec.noun}`;
    root.querySelector('[data-lchips]')!.innerHTML = chips();
    root.querySelector('[data-lpager]')!.innerHTML = r.pages > 1
      ? `<button class="btn btn-small" data-lpage="0" ${r.page === 0 ? 'disabled' : ''}>«</button>
         <button class="btn btn-small" data-lpage="${r.page - 1}" ${r.page === 0 ? 'disabled' : ''}>‹ Trước</button>
         <span>Trang ${r.page + 1}/${r.pages}</span>
         <button class="btn btn-small" data-lpage="${r.page + 1}" ${r.page >= r.pages - 1 ? 'disabled' : ''}>Sau ›</button>
         <button class="btn btn-small" data-lpage="${r.pages - 1}" ${r.page >= r.pages - 1 ? 'disabled' : ''}>»</button>`
      : '';
    counts();
    persist(spec.id, s);
    spec.bind?.(results);
  };
  const reset = () => {
    s.page = 0;
    draw();
  };
  root.querySelector<HTMLInputElement>('[data-lq]')!.addEventListener('input', (e) => {
    s.q = (e.target as HTMLInputElement).value;
    reset();
  });
  root.querySelectorAll<HTMLSelectElement>('[data-lf]').forEach((el) =>
    el.addEventListener('change', () => {
      s.filters[el.dataset.lf!] = el.value;
      el.classList.toggle('is-set', !!el.value);
      reset();
    }),
  );
  root.querySelector<HTMLSelectElement>('[data-ls]')?.addEventListener('change', (e) => {
    s.sort = (e.target as HTMLSelectElement).value;
    draw();
  });
  root.querySelector<HTMLSelectElement>('[data-lsize]')!.addEventListener('change', (e) => {
    s.size = Number((e.target as HTMLSelectElement).value);
    reset();
  });
  root.querySelector('[data-lclear]')!.addEventListener('click', () => {
    Object.assign(s, emptyState(s.sort));
    persist(spec.id, s);
    mountList(root, spec);
  });
  root.querySelector('[data-lchips]')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-unset]');
    if (!b) return;
    if (b.dataset.unset === 'q') s.q = '';
    else s.filters[b.dataset.unset!] = '';
    s.page = 0;
    persist(spec.id, s);
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
