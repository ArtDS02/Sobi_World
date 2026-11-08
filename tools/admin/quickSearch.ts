// Quick search (Ctrl+K, admin plan step 3.4): jump to a page or to the content file that holds a named row (a skill, a
// pig, an enemy, an item, a map…). Pure matching in `search`; the dialog is plain DOM.
import { esc } from './labels';
import { json } from './store';

export interface SearchEntry {
  label: string;
  sub: string;
  href: string;
  kind: 'page' | 'content';
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

/** Entries whose label (or id) contains every word of the query, folded for accents; label matches first. */
export function search(entries: readonly SearchEntry[], query: string, limit = 30): SearchEntry[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries.filter((e) => e.kind === 'page').slice(0, limit);
  const scored: [number, SearchEntry][] = [];
  for (const e of entries) {
    const label = fold(e.label);
    const hay = `${label} ${fold(e.sub)}`;
    if (!words.every((w) => hay.includes(w))) continue;
    scored.push([(words.every((w) => label.startsWith(w)) ? 0 : words.every((w) => label.includes(w)) ? 1 : 2) + (e.kind === 'page' ? 0 : 0.5), e]);
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, e]) => e);
}

type Raw = Record<string, unknown>;
const nameOf = (row: Raw): string | null => {
  const n = row.name;
  if (typeof n === 'string') return n;
  if (n && typeof n === 'object' && typeof (n as Raw).vi === 'string') return (n as Raw).vi as string;
  return typeof row.nameVi === 'string' ? row.nameVi : null;
};

/** Every row of every content file that has an id and a name. */
export function contentEntries(files: Record<string, unknown>): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const [file, doc] of Object.entries(files)) {
    if (!doc || typeof doc !== 'object') continue;
    for (const list of Object.values(doc as Raw)) {
      if (!Array.isArray(list)) continue;
      for (const row of list) {
        if (!row || typeof row !== 'object') continue;
        const r = row as Raw;
        const name = nameOf(r);
        if (name && typeof r.id === 'string') out.push({ label: name, sub: `${r.id} · ${file}`, href: `#/content/${encodeURIComponent(file)}`, kind: 'content' });
      }
    }
  }
  return out;
}

let cache: SearchEntry[] | null = null;
async function loadContent(): Promise<SearchEntry[]> {
  if (cache) return cache;
  try {
    cache = contentEntries((await json<{ files: Record<string, unknown> }>('/__admin/content')).files);
  } catch {
    cache = []; // API offline: pages only
  }
  return cache;
}

/** Opens the search over the dashboard; `pages` are the nav items. Returns the closer. */
export function openQuickSearch(pages: readonly SearchEntry[]): () => void {
  const host = document.createElement('div');
  host.className = 'qs-host';
  host.innerHTML = `<div class="qs-backdrop" data-qs-close></div><div class="qs" role="dialog" aria-modal="true" aria-label="Tìm nhanh">
    <input class="qs__input" type="search" placeholder="Tìm trang hoặc tên trong nội dung game… (Esc để đóng)" autocomplete="off" />
    <ul class="qs__list" role="listbox"></ul></div>`;
  document.body.append(host);
  const input = host.querySelector<HTMLInputElement>('.qs__input')!;
  const list = host.querySelector<HTMLUListElement>('.qs__list')!;
  let all: SearchEntry[] = [...pages];
  let shown: SearchEntry[] = [];
  let at = 0;
  const draw = () => {
    shown = search(all, input.value);
    at = Math.min(at, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length
      ? shown.map((e, i) => `<li role="option" class="qs__row${i === at ? ' is-on' : ''}" data-i="${i}"><b>${esc(e.label)}</b><small>${esc(e.sub)}</small></li>`).join('')
      : '<li class="qs__empty">Không thấy kết quả.</li>';
  };
  const close = () => {
    host.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  const choose = (e: SearchEntry | undefined) => {
    if (!e) return;
    close();
    location.hash = e.href;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return void (e.preventDefault(), e.stopPropagation(), close());
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      at = Math.max(0, Math.min(shown.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)));
      draw();
      list.querySelector('.is-on')?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(shown[at]);
    }
  };
  document.addEventListener('keydown', onKey, true);
  input.addEventListener('input', () => ((at = 0), draw()));
  list.addEventListener('click', (e) => choose(shown[Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i)]));
  host.querySelector('[data-qs-close]')!.addEventListener('click', close);
  draw();
  input.focus();
  void loadContent().then((c) => {
    all = [...pages, ...c];
    if (host.isConnected) draw();
  });
  return close;
}
