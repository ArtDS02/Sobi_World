// Data check center (plan 8.7) and "Dùng ở đâu" (8.5): broken references, rows missing an English name, art ids that are
// not in the asset manifest, and a finder that lists every place an id is used. Read only.
import { esc } from './labels';
import { brokenRefs, rowIds, usages, type Files } from './refs';
import { artUrl, json } from './store';

interface Loaded {
  files: Files;
  texts: Record<string, Record<string, { vi: string; en: string }>>;
}
interface Report {
  broken: ReturnType<typeof brokenRefs>;
  noEnglish: { file: string; id: string }[];
  noArt: { file: string; id: string; art: string }[];
}

let loaded: Loaded | null = null;
let report: Report | null = null;
let finder = '';
let error = '';

const ART_KEYS = ['art', 'artId', 'icon'];

export function check(data: Loaded, hasArt: (id: string) => boolean): Report {
  const noEnglish: Report['noEnglish'] = [];
  for (const [file, rows] of Object.entries(data.texts)) {
    for (const [id, t] of Object.entries(rows)) if (!t.en.trim()) noEnglish.push({ file, id });
  }
  const noArt: Report['noArt'] = [];
  for (const [file, doc] of Object.entries(data.files)) {
    const visit = (v: unknown, row: string | null) => {
      if (Array.isArray(v)) return v.forEach((x) => visit(x, row));
      if (!v || typeof v !== 'object') return;
      const r = v as Record<string, unknown>;
      const id = typeof r.id === 'string' ? r.id : row;
      for (const k of ART_KEYS) if (typeof r[k] === 'string' && r[k] && !hasArt(r[k] as string)) noArt.push({ file, id: id ?? '?', art: r[k] as string });
      for (const x of Object.values(r)) visit(x, id);
    };
    visit(doc, null);
  }
  return { broken: brokenRefs(data.files), noEnglish, noArt };
}

/** Count for the sidebar badge: broken references only. Missing art is the art phase's list (docs/ASSET_TODO.md), not an error. */
export const problemCount = (): number => report?.broken.length ?? 0;

/** Lines of the health panel on the overview (9.1): what the last data check found; null while it is still loading. */
export function healthCounts(): { broken: number; noEnglish: number; noArt: number } | null {
  return report ? { broken: report.broken.length, noEnglish: report.noEnglish.length, noArt: report.noArt.length } : null;
}

/** Loads the report in the background so the sidebar badge is right before the page is opened. */
export function preloadChecks(rerender: () => void): void {
  if (!loaded && !error) void load(rerender);
}

let busy = false;
async function load(rerender: () => void) {
  if (busy) return;
  busy = true;
  try {
    loaded = await json<Loaded>('/__admin/content');
    report = check(loaded, (id) => artUrl(id) !== null);
  } catch (e) {
    error = (e as Error).message;
  }
  busy = false;
  rerender();
}

const section = (title: string, rows: string[], empty: string) =>
  `<section class="panel"><h3>${esc(title)} <span class="badge ${rows.length ? 'status-warn' : 'status-ok'}">${rows.length}</span></h3>${rows.length ? `<ul class="check-list">${rows.slice(0, 80).map((r) => `<li>${r}</li>`).join('')}</ul>${rows.length > 80 ? `<p class="muted">… và ${rows.length - 80} mục nữa</p>` : ''}` : `<p class="muted">${esc(empty)}</p>`}</section>`;

const fileLink = (file: string) => `<a href="#/content/${encodeURIComponent(file)}">${esc(file)}</a>`;

export function renderChecks(root: HTMLElement, rerender: () => void) {
  if (error) {
    root.innerHTML = `<p class="empty">Cần chạy <code>npm run admin</code> để đọc nội dung game: ${esc(error)}</p>`;
    return;
  }
  if (!loaded || !report) {
    root.innerHTML = '<p class="loading">Đang kiểm tra dữ liệu… 🔎</p>';
    void load(rerender);
    return;
  }
  const r = report;
  const found = finder.trim() ? usages(loaded.files, finder.trim()) : null;
  const known = finder.trim() ? rowIds(loaded.files).get(finder.trim()) : undefined;
  root.innerHTML = `<p class="muted">Quét mọi file trong <b>Nội dung game</b>. Chỉ đọc, không ghi gì.</p>
    <div class="grid-2">
      ${section('Tham chiếu hỏng (id trỏ tới hàng không tồn tại)', r.broken.map((b) => `${fileLink(b.file)} › ${esc(b.path)} → <code>${esc(b.value)}</code>`), 'Không có tham chiếu hỏng.')}
      ${section('Ảnh chưa có trong manifest (chờ phase art, không phải lỗi)', r.noArt.map((a) => `${fileLink(a.file)} › <code>${esc(a.id)}</code> dùng ảnh <code>${esc(a.art)}</code>`), 'Mọi ảnh được khai báo đều có trong manifest.')}
      ${section('Thiếu tên tiếng Anh', r.noEnglish.map((t) => `${fileLink(t.file)} › <code>${esc(t.id)}</code>`), 'Mọi hàng đều có tên tiếng Anh.')}
    </div>
    <section class="panel"><h3>🔗 Dùng ở đâu</h3>
      <input type="search" class="search-input" data-finder placeholder="Gõ id, ví dụ item_manure" value="${esc(finder)}" />
      ${found === null ? '<p class="muted">Nhập một id để xem mọi chỗ nhắc tới nó (xoá hoặc đổi tên id khi còn chỗ dùng sẽ làm game hỏng).</p>'
        : `<p>${known ? `Hàng nằm ở ${fileLink(known.file)}.` : 'Không có hàng nào mang id này.'} ${found.length} chỗ dùng:</p>${found.length ? `<ul class="check-list">${found.slice(0, 100).map((u) => `<li>${fileLink(u.file)} › ${esc(u.path)}</li>`).join('')}</ul>` : ''}`}
    </section>`;
  const input = root.querySelector<HTMLInputElement>('[data-finder]')!;
  input.addEventListener('change', () => {
    finder = input.value;
    rerender();
  });
  if (finder) input.focus();
}
