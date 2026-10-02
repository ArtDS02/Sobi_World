// Pig management page: searchable, filterable card grid. A card opens the editor drawer.
import { FAMILY_VALUES } from '../../src/core/config/breeds';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import {
  FAMILY_LABEL,
  RARITY_LABEL,
  esc,
  gold,
  isNew,
  rarityBadge,
  rowImage,
  rowStatus,
  stats,
  statusBadge,
} from './labels';
import { state } from './store';

export const filters = { q: '', family: '', rarity: '', status: '' };

/** Reads `#/pigs?status=ok` style links from the overview. */
export function filtersFromHash(query: string) {
  const p = new URLSearchParams(query);
  for (const k of Object.keys(filters) as (keyof typeof filters)[]) {
    if (p.has(k)) filters[k] = p.get(k) ?? '';
  }
}

function visibleRows() {
  const q = filters.q.trim().toLowerCase();
  return state.rows.filter((r) => {
    if (q && ![r.id, r.nameVi, r.artId].some((s) => s.toLowerCase().includes(q))) return false;
    if (filters.family && r.family !== filters.family) return false;
    if (filters.rarity && r.rarity !== filters.rarity) return false;
    const st = filters.status;
    if (st === 'new') return isNew(r);
    if (st === 'disabled') return !stats(r).enabled;
    if (st === 'shop') return stats(r).buyGold !== null;
    return !st || rowStatus(r) === st;
  });
}

const options = (values: readonly string[], labels: Record<string, string>, current: string, all: string) =>
  [`<option value="">${all}</option>`, ...values.map((v) => `<option value="${v}"${v === current ? ' selected' : ''}>${esc(labels[v] ?? v)}</option>`)].join('');

const STATUS_FILTER: Record<string, string> = {
  ok: '✓ Đủ asset',
  warn: '⚠ Cần xem',
  error: '✕ Lỗi',
  new: '🆕 Mới',
  shop: '🛒 Bán trong shop',
  disabled: '⏸ Đang tắt',
};

function cardHtml(r: (typeof state.rows)[number]) {
  const s = stats(r);
  const st = rowStatus(r);
  return `<button class="pig-card${s.enabled ? '' : ' is-disabled'}" data-open="${esc(r.id)}">
    <span class="pig-card__thumb" style="--pig:${'#' + r.color.toString(16).padStart(6, '0')}">
      <img src="${esc(rowImage(r))}" alt="" loading="lazy" onerror="this.classList.add('is-missing')" />
      ${isNew(r) ? '<span class="ribbon">Mới</span>' : ''}
    </span>
    <span class="pig-card__name">${esc(r.nameVi)}</span>
    <span class="pig-card__id">${esc(r.id)}</span>
    <span class="pig-card__meta">${rarityBadge(r.rarity)} <span class="chip">${esc(FAMILY_LABEL[r.family] ?? r.family)}</span></span>
    <span class="pig-card__foot">${statusBadge(st)}<span class="price">${s.buyGold !== null ? `🛒 ${gold(s.buyGold)}` : '🧬 Lai'}</span></span>
  </button>`;
}

export function renderPigList(root: HTMLElement, onOpen: (id: string | null) => void) {
  const rows = visibleRows();
  root.innerHTML = `
    <div class="toolbar">
      <input class="search" type="search" placeholder="Tìm tên, ID, art…" value="${esc(filters.q)}" data-filter="q" />
      <select data-filter="family">${options(FAMILY_VALUES, FAMILY_LABEL, filters.family, 'Mọi nhóm')}</select>
      <select data-filter="rarity">${options(RARITY_VALUES, RARITY_LABEL, filters.rarity, 'Mọi độ hiếm')}</select>
      <select data-filter="status">${options(Object.keys(STATUS_FILTER), STATUS_FILTER, filters.status, 'Mọi trạng thái')}</select>
      <button class="btn btn-primary" data-new ${state.apiOnline ? '' : 'disabled'}>＋ Thêm heo</button>
    </div>
    <p class="muted">${rows.length}/${state.rows.length} heo</p>
    <div class="pig-grid">${rows.map(cardHtml).join('') || '<p class="empty">Không có heo nào khớp bộ lọc 🐽</p>'}</div>`;

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-filter]').forEach((el) => {
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
      filters[el.dataset.filter as keyof typeof filters] = el.value;
      const grid = root.querySelector('.pig-grid')!;
      const list = visibleRows();
      grid.innerHTML = list.map(cardHtml).join('') || '<p class="empty">Không có heo nào khớp bộ lọc 🐽</p>';
      root.querySelector('.muted')!.textContent = `${list.length}/${state.rows.length} heo`;
    });
  });
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const card = t.closest<HTMLElement>('[data-open]');
    if (card) onOpen(card.dataset.open!);
    else if (t.closest('[data-new]')) onOpen(null);
  });
}
