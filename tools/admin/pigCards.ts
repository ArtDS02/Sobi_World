// Visual pig picker of the user editor (DECISIONS AM-1): every species as an image card — art,
// name, id, rarity, theme, how the game gets it — with search, rarity/theme filters and sorting.
// The list is the species table the dashboard edits (state.rows) + the manifest art: a pig created
// from a new asset shows up here as soon as it is saved to the game; a draft is shown but locked.
import { BREED_ID_VALUES } from '../../src/areas/farm/logic/config/ids';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import type { SpeciesRowData } from '../../scripts/admin/speciesText';
import { FAMILY_LABEL, RARITY_LABEL, esc, gold, rarityBadge, rowImage, stats } from './labels';
import { fold } from './listQuery';
import { state } from './store';

const SAVED = new Set<string>(BREED_ID_VALUES);

/** Why a species cannot be given to a save yet; null = can be chosen. */
export const pigBlocked = (row: SpeciesRowData) =>
  SAVED.has(row.id) ? null : 'Chưa lưu vào game — Quản lý heo → 💾 Lưu vào game';

function source(row: SpeciesRowData): string {
  const s = stats(row);
  if (!s.enabled) return 'Đang tắt';
  return s.buyGold !== null ? `Shop ${gold(s.buyGold)} · cấp ${s.unlockLevel}` : 'Chỉ lai ra';
}

const tier = (r: SpeciesRowData) => RARITY_VALUES.indexOf(r.rarity as (typeof RARITY_VALUES)[number]);
const searchText = (r: SpeciesRowData) => fold(`${r.id} ${r.nameVi} ${r.artId} ${FAMILY_LABEL[r.family] ?? r.family}`);

const SORTS: Record<string, (a: SpeciesRowData, b: SpeciesRowData) => number> = {
  table: () => 0,
  name: (a, b) => a.nameVi.localeCompare(b.nameVi, 'vi'),
  rarity: (a, b) => tier(a) - tier(b) || a.nameVi.localeCompare(b.nameVi, 'vi'),
  newest: (a, b) => state.rows.indexOf(b) - state.rows.indexOf(a),
};

function card(row: SpeciesRowData, chosen: string): string {
  const blocked = pigBlocked(row);
  return `<button type="button" class="pig-card${row.id === chosen ? ' is-on' : ''}${blocked ? ' is-blocked' : ''}"
      data-pig-card="${esc(row.id)}"
      title="${esc(blocked ?? row.id)}" ${blocked ? 'aria-disabled="true"' : ''}>
    <span class="pig-card__img"><img src="${esc(rowImage(row))}" alt="" loading="lazy" /></span>
    <b>${esc(row.nameVi)}</b>${rarityBadge(row.rarity)}
    <small class="mono">${esc(row.id)}</small>
    <small>${esc(FAMILY_LABEL[row.family] ?? row.family)} · ${esc(blocked ? 'Bản nháp' : source(row))}</small></button>`;
}

/** Markup of the grid; the choice is posted as the hidden input `name`. */
export function pigCardGrid(name: string, current: string): string {
  const opt = (v: string, l: string) => `<option value="${esc(v)}">${esc(l)}</option>`;
  const families = [...new Set(state.rows.map((r) => r.family))];
  return `<div class="pig-cards" data-pig-cards>
    <div class="toolbar">
      <input class="search" type="search" data-pc-q placeholder="Tìm tên, id, chủ đề…" />
      <select data-pc-rarity>${opt('', 'Mọi độ hiếm')}${RARITY_VALUES.map((r) => opt(r, RARITY_LABEL[r] ?? r)).join('')}</select>
      <select data-pc-family>${opt('', 'Mọi chủ đề')}${families.map((f) => opt(f, FAMILY_LABEL[f] ?? f)).join('')}</select>
      <select data-pc-sort>${opt('table', 'Thứ tự bảng')}${opt('rarity', 'Độ hiếm')}${opt('name', 'Tên A–Z')}${opt('newest', 'Mới thêm')}</select>
    </div>
    <p class="muted" data-pc-count></p>
    <div class="pig-card-grid" data-pc-grid></div>
    <input type="hidden" name="${esc(name)}" value="${esc(current)}" />
  </div>`;
}

/** Wires search / filters / sort / selection of a grid rendered by pigCardGrid inside `root`. */
export function bindPigCardGrid(root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-pig-cards]')!;
  const input = box.querySelector<HTMLInputElement>('input[type=hidden]')!;
  const grid = box.querySelector<HTMLElement>('[data-pc-grid]')!;
  const val = (sel: string) => box.querySelector<HTMLInputElement | HTMLSelectElement>(sel)!.value;
  const draw = () => {
    const q = fold(val('[data-pc-q]')).split(/\s+/).filter(Boolean);
    const rarity = val('[data-pc-rarity]');
    const family = val('[data-pc-family]');
    const rows = [...state.rows]
      .sort(SORTS[val('[data-pc-sort]')] ?? SORTS.table)
      .filter((r) => (!rarity || r.rarity === rarity) && (!family || r.family === family))
      .filter((r) => q.every((w) => searchText(r).includes(w)));
    grid.innerHTML = rows.map((r) => card(r, input.value)).join('') || '<p class="empty">Không có heo khớp bộ lọc.</p>';
    box.querySelector('[data-pc-count]')!.textContent = `${rows.length}/${state.rows.length} heo · bấm thẻ để chọn`;
  };
  box.addEventListener('input', draw);
  grid.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-pig-card]');
    if (!b || b.classList.contains('is-blocked')) return;
    input.value = b.dataset.pigCard!;
    grid.querySelectorAll('.pig-card.is-on').forEach((x) => x.classList.remove('is-on'));
    b.classList.add('is-on');
  });
  draw();
  grid.querySelector('.pig-card.is-on')?.scrollIntoView({ block: 'nearest' });
}
