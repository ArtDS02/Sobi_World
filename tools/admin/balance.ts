// Balance table (plan 8.6): the numeric fields of one list side by side, outliers highlighted. Pure part first.
import { esc } from './labels';
import { json } from './store';

export type Row = Record<string, unknown>;
export interface Column {
  key: string;
  mean: number;
  std: number;
}

/** Flat numeric fields of a row: `stats.hp` for a nested number; arrays and strings are ignored. */
export function numbersOf(row: Row, prefix = ''): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[`${prefix}${k}`] = v;
    else if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, numbersOf(v as Row, `${prefix}${k}.`));
  }
  return out;
}

/** Columns with at least 2 distinct values among the rows, with mean and standard deviation. */
export function columns(rows: readonly Row[]): Column[] {
  const per = new Map<string, number[]>();
  for (const r of rows) for (const [k, v] of Object.entries(numbersOf(r))) per.set(k, [...(per.get(k) ?? []), v]);
  return [...per]
    .filter(([, vs]) => vs.length >= 3 && new Set(vs).size > 1)
    .map(([key, vs]) => {
      const mean = vs.reduce((a, b) => a + b, 0) / vs.length;
      return { key, mean, std: Math.sqrt(vs.reduce((a, b) => a + (b - mean) ** 2, 0) / vs.length) };
    });
}

/** How many standard deviations `v` is from the column mean (0 when the column is flat). */
export const zScore = (v: number, c: Column): number => (c.std === 0 ? 0 : (v - c.mean) / c.std);
export const isOutlier = (v: number, c: Column, limit = 2): boolean => Math.abs(zScore(v, c)) >= limit;

const LISTS: readonly (readonly [file: string, key: string, label: string])[] = [
  ['adventure/enemies.json', 'enemies', '⚔️ Kẻ địch'],
  ['adventure/skills.json', 'skills', '✨ Kỹ năng'],
  ['adventure/equipment.json', 'equipment', '🛡️ Trang bị'],
  ['garden/crops.json', 'crops', '🌱 Cây trồng'],
  ['aquarium/fish.json', 'fish', '🐟 Cá'],
  ['cloud/flowers.json', 'flowers', '☁️ Hoa'],
  ['shared/items.json', 'items', '📦 Vật phẩm'],
  ['shared/recipes.json', 'recipes', '⚙️ Công thức'],
];

let files: Record<string, Row> | null = null;
let current = 0;
let error = '';

export function renderBalance(root: HTMLElement, rerender: () => void) {
  if (error) return void (root.innerHTML = `<p class="empty">Cần chạy <code>npm run admin</code>: ${esc(error)}</p>`);
  if (!files) {
    root.innerHTML = '<p class="loading">Đang đọc nội dung…</p>';
    json<{ files: Record<string, Row> }>('/__admin/content').then((r) => ((files = r.files), rerender()), (e: Error) => ((error = e.message), rerender()));
    return;
  }
  const [file, key] = LISTS[current]!;
  const rows = ((files[file]?.[key] ?? []) as Row[]).filter((r) => r && typeof r === 'object');
  const cols = columns(rows);
  const head = cols.map((c) => `<th title="trung bình ${c.mean.toFixed(2)} · độ lệch ${c.std.toFixed(2)}">${esc(c.key)}</th>`).join('');
  const body = rows
    .map((r) => {
      const n = numbersOf(r);
      const name = String(r.nameVi ?? (r.name as { vi?: string } | undefined)?.vi ?? r.id ?? '?');
      return `<tr><td><b>${esc(name)}</b><div class="mono muted">${esc(String(r.id ?? ''))}</div></td>${cols.map((c) => {
        const v = n[c.key];
        return v === undefined ? '<td class="muted">—</td>' : `<td class="${isOutlier(v, c) ? 'is-outlier' : ''}" title="${zScore(v, c).toFixed(1)}σ">${Number.isInteger(v) ? v : v.toFixed(2)}</td>`;
      }).join('')}</tr>`;
    })
    .join('');
  root.innerHTML = `<p class="muted">So số liệu của các hàng trong một danh sách. Ô tô vàng lệch ≥ 2 độ lệch chuẩn so với trung bình cột (di chuột để xem). Chỉ đọc: sửa ở <a href="#/content/${encodeURIComponent(file)}">Nội dung game</a>.</p>
    <div class="subtabs">${LISTS.map(([, , label], i) => `<button type="button" class="chip${i === current ? ' is-on' : ''}" data-list="${i}">${esc(label)}</button>`).join('')}</div>
    ${cols.length ? `<div class="table-wrap"><table class="table balance"><thead><tr><th>Hàng (${rows.length})</th>${head}</tr></thead><tbody>${body}</tbody></table></div>` : '<p class="muted">Danh sách này không có đủ số liệu để so sánh.</p>'}`;
  root.querySelectorAll<HTMLElement>('[data-list]').forEach((b) =>
    b.addEventListener('click', () => {
      current = Number(b.dataset.list);
      rerender();
    }),
  );
}
