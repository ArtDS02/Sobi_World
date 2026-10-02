// Admin dashboard entry (admin.html, `npm run admin`). Hash routes: #/ overview, #/pigs[?filters],
// #/pigs/<ID> editor drawer, #/pigs/new, #/validation, #/assets, #/daynight (DN).
import { renderAssets } from './assets';
import { renderDayNight } from './dayNight';
import { renderEditor } from './editor';
import { esc } from './labels';
import { renderOverview } from './overview';
import { filtersFromHash, renderPigList } from './pigList';
import { discard, load, onChange, save, state } from './store';
import { renderValidation } from './validation';

const NAV = [
  ['', '🏡', 'Tổng quan'],
  ['pigs', '🐷', 'Quản lý heo'],
  ['validation', '🩺', 'Kiểm tra dữ liệu'],
  ['assets', '🖼️', 'Asset nguồn'],
  ['daynight', '🌗', 'Ngày / Đêm'],
] as const;

const app = document.getElementById('admin')!;

function route() {
  const [path = '', query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [page = '', id = null] = path.split('/');
  return { page, id: id ? decodeURIComponent(id) : null, query };
}

const go = (hash: string) => {
  location.hash = hash;
};

function shell() {
  const { page } = route();
  const errors = state.issues.filter((i) => i.level === 'error').length;
  const nav = NAV.map(
    ([p, icon, label]) => `<a href="#/${p}" class="nav__item${page === p ? ' is-active' : ''}">
      <span class="nav__icon">${icon}</span><span class="nav__label">${label}</span>
      ${p === 'validation' && errors ? `<span class="nav__count">${errors}</span>` : ''}</a>`,
  ).join('');
  const title = NAV.find((n) => n[0] === page)?.[2] ?? 'Tổng quan';
  const msg = state.message
    ? `<div class="toast ${state.message.kind}"><pre>${esc(state.message.text)}</pre><button class="icon-btn" data-dismiss>✕</button></div>`
    : '';
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand"><span class="brand__logo">🐽</span><span><b>Ủn Ỉn</b><small>Admin</small></span></div>
        <nav class="nav">${nav}</nav>
        <p class="sidebar__foot">${state.apiOnline ? '● Đang nối data game' : '○ Chỉ đọc'}</p>
      </aside>
      <main class="main">
        <header class="header">
          <h1>${esc(title)}</h1>
          <div class="header__actions">
            ${state.dirty ? '<span class="badge status-warn">Chưa lưu</span><button class="btn" data-discard>Huỷ thay đổi</button>' : ''}
            <button class="btn btn-primary" data-save ${!state.dirty || state.saving || !state.apiOnline || errors > 0 ? 'disabled' : ''}
              title="${errors ? 'Sửa hết lỗi trước khi lưu' : 'Ghi vào src/core/config + manifest'}">
              ${state.saving ? 'Đang lưu…' : '💾 Lưu vào game'}</button>
          </div>
        </header>
        ${msg}
        <div class="content"></div>
      </main>
    </div>
    <div class="drawer-host"></div>`;
  app.querySelector('[data-save]')?.addEventListener('click', () => void save());
  app.querySelector('[data-discard]')?.addEventListener('click', discard);
  app.querySelector('[data-dismiss]')?.addEventListener('click', () => {
    state.message = null;
    render();
  });
}

function render() {
  const scroll = app.querySelector('.content')?.scrollTop ?? 0;
  shell();
  const { page, id, query } = route();
  const content = app.querySelector<HTMLElement>('.content')!;
  const open = (pigId: string | null) => go(`#/pigs/${pigId ? encodeURIComponent(pigId) : 'new'}`);
  if (page === 'pigs') {
    filtersFromHash(query);
    renderPigList(content, open);
  } else if (page === 'validation') renderValidation(content, (pigId) => open(pigId));
  else if (page === 'assets') renderAssets(content);
  else if (page === 'daynight') renderDayNight(content, state.apiOnline);
  else renderOverview(content);
  content.scrollTop = scroll;
  if (page === 'pigs' && id) {
    renderEditor(app.querySelector<HTMLElement>('.drawer-host')!, id === 'new' ? null : id, () => go('#/pigs'));
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', (e) => {
  if (state.dirty) e.preventDefault();
});
onChange(render);
app.innerHTML = '<p class="loading">Đang tải data heo… 🐷</p>';
load().catch((e: unknown) => {
  app.innerHTML = `<p class="empty">Không tải được manifest: ${esc((e as Error).message)}</p>`;
});
