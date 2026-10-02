// Asset library page: every pig image the game can use (public/assets/pigs/base/), with its manifest
// registration, the species using it, size and date. Unregistered files (imported before AD-1) can
// be registered here; unused art opens "Tạo heo mới" preselected.
import { FAMILY_VALUES } from '../../src/core/config/breeds';
import { FAMILY_LABEL, esc } from './labels';
import { mountList } from './listKit';
import { byNumber, byText, reverse } from './listQuery';
import { openModal } from './modal';
import { openUpload } from './assets';
import { registerArt, state, type LibraryItem } from './store';

const DAY = 24 * 3600 * 1000;
const usedBy = (i: LibraryItem) => state.rows.filter((r) => r.artId === (i.rowId ?? i.artId));
const rowOf = (i: LibraryItem) => (i.rowId ? state.pigs.find((p) => p.id === i.rowId) : undefined);
const date = (ms: number) => new Date(ms).toLocaleDateString('vi-VN');
const kb = (n: number) => `${Math.round(n / 1024)} KB`;

function card(i: LibraryItem) {
  const users = usedBy(i);
  const row = rowOf(i);
  const sizeOk = i.size && i.size.width === 512 && i.size.height === 512;
  const reg = i.rowId
    ? `<span class="badge status-ok">✓ Manifest: ${esc(i.rowId)}</span>`
    : '<span class="badge status-error">✕ Chưa đăng ký manifest</span>';
  const use = users.length
    ? users.map((r) => `<a class="chip" href="#/pigs/${esc(r.id)}">🐷 ${esc(r.nameVi)}</a>`).join(' ')
    : i.sleep ? '<span class="chip">Ảnh ngủ</span>' : '<span class="chip">Chưa gán heo</span>';
  const action = !state.apiOnline || i.sleep
    ? ''
    : !i.rowId
      ? `<button class="btn btn-small btn-primary" data-register="${esc(i.artId)}">📝 Đăng ký</button>`
      : users.length === 0
        ? `<a class="btn btn-small btn-primary" href="#/pigs/new?art=${esc(i.rowId)}">🐷 Tạo heo</a>`
        : '';
  return `<div class="src-card">
    <span class="src-card__imgs"><span class="compare"><img src="/assets/${esc(i.file)}" alt="" loading="lazy" /></span></span>
    <b>${esc(row?.nameVi ?? i.artId)}</b>
    <small>${esc(i.file)}</small>
    <small>${i.size ? `${i.size.width}×${i.size.height}` : '?'}${sizeOk ? '' : ' ⚠ chuẩn 512×512'} · ${kb(i.bytes)} · ${date(i.modifiedAt)}${row ? ` · ${esc(row.status)}` : ''}</small>
    ${reg}
    <span class="chips">${use}</span>
    ${action}
  </div>`;
}

function openRegister(artId: string) {
  openModal({
    title: `Đăng ký ${artId}`,
    submit: 'Đăng ký',
    body: `<img class="modal__preview" src="/assets/pigs/base/${esc(artId)}.png" alt="" />
      <label class="field"><span>Tên hiển thị (manifest)</span><input name="nameVi" required /></label>`,
    onSubmit: (f) => registerArt(artId, String(new FormData(f).get('nameVi')).trim()),
  });
}

const familyOf = (i: LibraryItem) => usedBy(i).map((r) => r.family);

export function renderLibrary(root: HTMLElement) {
  const lib = state.library;
  const unregistered = lib.filter((i) => !i.rowId).length;
  root.innerHTML = `
    <div class="summary-row">
      <span class="badge status-ok">🖼️ ${lib.length} ảnh</span>
      <span class="badge ${unregistered ? 'status-error' : 'status-ok'}">${unregistered ? `✕ ${unregistered} chưa đăng ký` : '✓ Đã đăng ký hết'}</span>
      <span class="badge status-warn">${lib.filter((i) => !i.sleep && usedBy(i).length === 0).length} chưa gán heo</span>
    </div>
    <p class="muted">Ảnh trong <code>public/assets/pigs/base/</code> — đây là những gì game thật sự tải. Ảnh chỉ dùng được khi có dòng manifest.</p>
    <div data-list></div>`;
  mountList(root.querySelector<HTMLElement>('[data-list]')!, {
    id: 'asset-library',
    items: () => state.library,
    text: (i) => [i.artId, i.file, rowOf(i)?.nameVi, ...(rowOf(i)?.tags ?? []), ...usedBy(i).map((r) => r.nameVi)],
    filters: [
      { key: 'reg', label: 'Mọi trạng thái manifest', options: [['yes', 'Đã đăng ký'], ['no', 'Chưa đăng ký']], test: (i, v) => (v === 'yes') === !!i.rowId },
      { key: 'used', label: 'Đang dùng / chưa', options: [['used', 'Đang dùng'], ['unused', 'Chưa gán heo']], test: (i, v) => (v === 'used') === usedBy(i).length > 0 },
      { key: 'type', label: 'Mọi loại', options: [['idle', 'Ảnh thường'], ['sleep', 'Ảnh ngủ']], test: (i, v) => (v === 'sleep') === i.sleep },
      { key: 'theme', label: 'Mọi chủ đề', options: FAMILY_VALUES.map((f) => [f, FAMILY_LABEL[f] ?? f] as const), test: (i, v) => familyOf(i).includes(v) },
      { key: 'status', label: 'Mọi mức art', options: [['production', 'production'], ['final', 'final'], ['placeholder', 'placeholder']], test: (i, v) => rowOf(i)?.status === v },
      { key: 'date', label: 'Mọi ngày tạo', options: [['7', '7 ngày qua'], ['30', '30 ngày qua'], ['old', 'Cũ hơn 30 ngày']],
        test: (i, v) => (v === 'old' ? Date.now() - i.modifiedAt > 30 * DAY : Date.now() - i.modifiedAt <= Number(v) * DAY) },
    ],
    sorts: [
      { key: 'new', label: 'Mới nhất', compare: reverse(byNumber((i) => i.modifiedAt)) },
      { key: 'old', label: 'Cũ nhất', compare: byNumber((i) => i.modifiedAt) },
      { key: 'az', label: 'Tên A-Z', compare: byText((i) => i.artId) },
      { key: 'za', label: 'Tên Z-A', compare: reverse(byText((i) => i.artId)) },
    ],
    pageSize: 60,
    placeholder: 'Tìm art id, tên, tag, heo đang dùng…',
    noun: 'ảnh',
    resultsClass: 'src-grid',
    actions: state.apiOnline ? '<button class="btn btn-primary" data-upload type="button">⬆ Tải ảnh lên</button>' : '',
    render: (rows) => rows.map(card).join(''),
    bind: (el) =>
      el.querySelectorAll<HTMLElement>('[data-register]').forEach((b) => b.addEventListener('click', () => openRegister(b.dataset.register!))),
  });
  root.querySelector('[data-upload]')?.addEventListener('click', openUpload);
}
