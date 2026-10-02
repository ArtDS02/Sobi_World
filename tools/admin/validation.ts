// Data validation page: one block per species with its problems, or a ✓ line when it is clean,
// then the asset-level findings (orphan files, art no species uses).
import { art, esc, rowImage } from './labels';
import { state } from './store';

const ICON = { error: '✕', warn: '⚠', info: 'ℹ' } as const;

export function renderValidation(root: HTMLElement, onOpen: (id: string) => void) {
  const errors = state.issues.filter((i) => i.level === 'error').length;
  const warns = state.issues.filter((i) => i.level === 'warn').length;
  const withIssues = state.rows.filter((r) => state.issues.some((i) => i.speciesId === r.id && i.level !== 'info'));
  const clean = state.rows.filter((r) => !withIssues.includes(r));
  const general = state.issues.filter((i) => i.speciesId === null || !state.rows.some((r) => r.id === i.speciesId));

  const block = (r: (typeof state.rows)[number]) => {
    const mine = state.issues.filter((i) => i.speciesId === r.id);
    const a = art(r);
    const assets = `Phải ${a.right ? '✓' : '✕'} · Trái ${a.left ? '✓' : '✕'} (lật) · Trước/Sau — (không sản xuất) · Ngủ ${a.sleep === null ? '—' : a.sleep ? '✓' : '✕'}`;
    return `<li class="vcard">
      <button class="vcard__head" data-open="${esc(r.id)}">
        <img src="${esc(rowImage(r))}" alt="" loading="lazy" onerror="this.classList.add('is-missing')" />
        <span><b>⚠ ${esc(r.nameVi)}</b><small>${esc(r.id)} · ${assets}</small></span>
      </button>
      <ul>${mine.map((i) => `<li class="issue ${i.level}">${ICON[i.level]} ${esc(i.text)}</li>`).join('')}</ul></li>`;
  };

  root.innerHTML = `
    <div class="summary-row">
      <span class="badge status-error">✕ ${errors} lỗi</span>
      <span class="badge status-warn">⚠ ${warns} cảnh báo</span>
      <span class="badge status-ok">✓ ${clean.length}/${state.rows.length} heo hợp lệ</span>
      ${state.apiOnline ? '' : '<span class="badge status-warn">Chế độ chỉ đọc — chạy npm run admin để kiểm file thật</span>'}
    </div>
    <p class="muted">Kiểm: trùng ID, trùng ảnh, thiếu dòng manifest, file ảnh hỏng/thiếu, thiếu hướng nhìn, thiếu trường bắt buộc,
      số không hợp lệ, luật độ hiếm (hiếm hơn = đắt hơn, lâu hơn; chỉ LEGENDARY không lai), xoá species đang có trong save.</p>
    ${withIssues.length ? `<h3>Cần xử lý</h3><ul class="vlist">${withIssues.map(block).join('')}</ul>` : ''}
    ${general.length ? `<h3>Asset & manifest</h3><ul class="issues">${general.map((i) => `<li class="issue ${i.level}">${ICON[i.level]} ${esc(i.text)}</li>`).join('')}</ul>` : ''}
    <h3>Hợp lệ</h3>
    <ul class="ok-list">${clean.map((r) => `<li><button data-open="${esc(r.id)}">✓ ${esc(r.nameVi)} <small>Asset đầy đủ</small></button></li>`).join('')}</ul>`;

  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    if (b) onOpen(b.dataset.open!);
  });
}
