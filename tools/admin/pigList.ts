// Pig management page: searchable, filterable, sortable card grid with pagination (listKit).
// A card opens the editor drawer.
import { FAMILY_VALUES } from '../../src/core/config/breeds';
import { RARITY_VALUES, rarityRank } from '../../src/core/config/rarity';
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
import { mountList } from './listKit';
import { byNumber, byText, reverse } from './listQuery';
import { state } from './store';

type Row = (typeof state.rows)[number];

const STATUS_FILTER = [
  ['ok', '✓ Đủ asset'],
  ['warn', '⚠ Cần xem'],
  ['error', '✕ Lỗi'],
  ['new', '🆕 Mới'],
  ['shop', '🛒 Bán trong shop'],
  ['breedOnly', '🧬 Chỉ lai ra'],
  ['disabled', '⏸ Đang tắt'],
] as const;

function statusTest(r: Row, st: string) {
  if (st === 'new') return isNew(r);
  if (st === 'disabled') return !stats(r).enabled;
  if (st === 'shop') return stats(r).buyGold !== null;
  if (st === 'breedOnly') return stats(r).buyGold === null;
  return rowStatus(r) === st;
}

function cardHtml(r: Row) {
  const s = stats(r);
  return `<button class="pig-card${s.enabled ? '' : ' is-disabled'}" data-open="${esc(r.id)}">
    <span class="pig-card__thumb" style="--pig:${'#' + r.color.toString(16).padStart(6, '0')}">
      <img src="${esc(rowImage(r))}" alt="" loading="lazy" onerror="this.classList.add('is-missing')" />
      ${isNew(r) ? '<span class="ribbon">Mới</span>' : ''}
    </span>
    <span class="pig-card__name">${esc(r.nameVi)}</span>
    <span class="pig-card__id">${esc(r.id)}</span>
    <span class="pig-card__meta">${rarityBadge(r.rarity)} <span class="chip">${esc(FAMILY_LABEL[r.family] ?? r.family)}</span></span>
    <span class="pig-card__foot">${statusBadge(rowStatus(r))}<span class="price">${s.buyGold !== null ? `🛒 ${gold(s.buyGold)}` : '🧬 Lai'}</span></span>
  </button>`;
}

export function renderPigList(root: HTMLElement, onOpen: (id: string | null) => void) {
  root.innerHTML = `<p class="muted">Mỗi heo = 1 dòng <code>speciesTable.ts</code> + 1 ảnh đã đăng ký manifest.</p><div data-list></div>`;
  mountList(root.querySelector<HTMLElement>('[data-list]')!, {
    id: 'pigs',
    items: () => state.rows,
    text: (r) => [r.id, r.nameVi, r.artId, r.family, FAMILY_LABEL[r.family]],
    filters: [
      { key: 'family', label: 'Mọi nhóm', options: FAMILY_VALUES.map((f) => [f, FAMILY_LABEL[f] ?? f] as const), test: (r, v) => r.family === v },
      { key: 'rarity', label: 'Mọi độ hiếm', options: RARITY_VALUES.map((v) => [v, RARITY_LABEL[v] ?? v] as const), test: (r, v) => r.rarity === v },
      { key: 'status', label: 'Mọi trạng thái', options: STATUS_FILTER, test: statusTest },
    ],
    sorts: [
      { key: 'table', label: 'Thứ tự bảng', compare: () => 0 },
      { key: 'az', label: 'Tên A-Z', compare: byText((r) => r.nameVi) },
      { key: 'za', label: 'Tên Z-A', compare: reverse(byText((r) => r.nameVi)) },
      { key: 'rarity', label: 'Độ hiếm tăng dần', compare: byNumber((r) => rarityRank(r.rarity as never)) },
      { key: 'price', label: 'Giá bán cao nhất', compare: reverse(byNumber((r) => stats(r).sellGold)) },
      { key: 'newest', label: 'Mới thêm nhất', compare: reverse(byNumber((r) => state.rows.indexOf(r))) },
    ],
    pageSize: 48,
    placeholder: 'Tìm tên, ID, art, nhóm…',
    noun: 'heo',
    resultsClass: 'pig-grid',
    actions: `<button class="btn btn-primary" data-new ${state.apiOnline ? '' : 'disabled'}>＋ Thêm heo</button>`,
    render: (rows) => rows.map(cardHtml).join(''),
    bind: (el) => el.querySelectorAll<HTMLElement>('[data-open]').forEach((b) => b.addEventListener('click', () => onOpen(b.dataset.open!))),
  });
  root.querySelector('[data-new]')?.addEventListener('click', () => onOpen(null));
}
