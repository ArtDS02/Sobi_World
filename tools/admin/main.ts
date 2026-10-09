// Admin dashboard entry (admin.html, `npm run admin`). Hash routes (DECISIONS A7-1, AD-1):
// #/ overview · #/users[/<id>] · #/pigs[?filters] · #/pigs/<ID> | #/pigs/new[?art=pig_x] · #/validation
// #/assets (source) · #/library · #/layout · #/products · #/breeding · #/daynight · #/numbers · #/seasons · #/desktop · #/guide[/<section>]
import { renderAssets } from './assets';
import { breedingDirty, renderBreeding } from './breeding';
import { renderDayNight } from './dayNight';
import { renderNumbers } from './numbers';
import { renderSeasons } from './seasons';
import { renderEditor } from './editor';
import { renderDesktop } from './desktop';
import { renderGuide } from './guide';
import { esc } from './labels';
import { layoutDirty, renderLayout } from './layout';
import { renderLibrary } from './library';
import { renderOverview } from './overview';
import { applyQueryString } from './listKit';
import { renderPigList } from './pigList';
import { productsDirty, renderProducts } from './products';
import { discard, load, onChange, save, state } from './store';
import { renderUserDetail, userDirty } from './userDetail';
import { renderUsers } from './users';
import { renderValidation } from './validation';

type NavItem = readonly [page: string, icon: string, label: string, help: string];
const NAV: readonly (readonly [group: string | null, items: readonly NavItem[]])[] = [
  [null, [['', '🏡', 'Tổng quan', 'overview'], ['users', '👤', 'Người chơi', 'users']]],
  ['Heo', [['pigs', '🐷', 'Quản lý heo', 'pigs'], ['validation', '🩺', 'Kiểm tra dữ liệu', 'pigs']]],
  ['Asset', [['assets', '📥', 'Asset nguồn', 'asset-source'], ['library', '🖼️', 'Thư viện asset', 'asset-library']]],
  ['Game', [['layout', '🗺️', 'Bố cục nông trại', 'layout'], ['daynight', '🌗', 'Ngày / Đêm', 'daynight'], ['numbers', '🔢', 'Số liệu', 'numbers'], ['seasons', '🍂', 'Mùa & hiệu ứng', 'seasons']]],
  ['Cửa hàng', [['products', '🛒', 'Sản phẩm', 'shop']]],
  ['Phối giống', [['breeding', '🧬', 'Luật phối giống', 'breeding']]],
  ['Hệ thống / Hướng dẫn', [['desktop', '🎮', 'Desktop Game', 'desktop'], ['guide', '📘', 'Hướng dẫn quản trị', 'overview']]],
];
const ALL = NAV.flatMap(([, items]) => items);
/** Pages that edit the species draft: the header save belongs to them. */
const SPECIES_PAGES = new Set(['pigs', 'validation']);
/** `#/<page>?key=value` links (overview cards) preset that page's list filters. */
const LIST_OF: Record<string, string> = { pigs: 'pigs', assets: 'asset-source', library: 'asset-library', products: 'products', breeding: 'breeding', users: 'users' };

const app = document.getElementById('admin')!;
let appliedHash = '';

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
  const nav = NAV.map(([group, items]) => `${group ? `<p class="nav__group">${esc(group)}</p>` : ''}${items
    .map(([p, icon, label]) => `<a href="#/${p}" class="nav__item${page === p ? ' is-active' : ''}">
      <span class="nav__icon">${icon}</span><span class="nav__label">${label}</span>
      ${p === 'validation' && errors ? `<span class="nav__count">${errors}</span>` : ''}</a>`)
    .join('')}`).join('');
  const current = ALL.find((n) => n[0] === page) ?? ALL[0]!;
  const species = SPECIES_PAGES.has(page);
  const msg = state.message
    ? `<div class="toast ${state.message.kind}"><pre>${esc(state.message.text)}</pre><button class="icon-btn" data-dismiss>✕</button></div>`
    : '';
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand"><span class="brand__logo">🐽</span><span><b>Sobi Farm</b><small>Admin</small></span></div>
        <nav class="nav">${nav}</nav>
        <p class="sidebar__foot">${state.apiOnline ? '● Đang nối data game' : '○ Chỉ đọc'}</p>
      </aside>
      <main class="main">
        <header class="header">
          <h1>${current[1]} ${esc(current[2])}</h1>
          <div class="header__actions">
            ${page !== 'guide' ? `<a class="help-link" href="#/guide/${current[3]}">❔ Hướng dẫn</a>` : ''}
            ${species && state.dirty ? '<span class="badge status-warn">Chưa lưu</span><button class="btn" data-discard>Huỷ thay đổi</button>' : ''}
            ${species ? `<button class="btn btn-primary" data-save ${!state.dirty || state.saving || !state.apiOnline || errors > 0 ? 'disabled' : ''}
              title="${errors ? 'Sửa hết lỗi trước khi lưu' : 'Ghi vào src/core/config + manifest'}">
              ${state.saving ? 'Đang lưu…' : '💾 Lưu vào game'}</button>` : ''}
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
  const pages: Record<string, () => void> = {
    pigs: () => renderPigList(content, open),
    validation: () => renderValidation(content, (pigId) => open(pigId)),
    assets: () => renderAssets(content),
    library: () => renderLibrary(content),
    daynight: () => renderDayNight(content, state.apiOnline),
    seasons: () => renderSeasons(content, render),
    numbers: () => renderNumbers(content, state.apiOnline, render),
    users: () => (id ? renderUserDetail(content, id, render) : renderUsers(content, render)),
    products: () => renderProducts(content, render),
    breeding: () => renderBreeding(content, render),
    layout: () => renderLayout(content, render),
    desktop: () => renderDesktop(content),
    guide: () => renderGuide(content, id),
  };
  if (query && !id && LIST_OF[page] && location.hash !== appliedHash) applyQueryString(LIST_OF[page], query);
  appliedHash = location.hash;
  (pages[page] ?? (() => renderOverview(content)))();
  if (page !== 'guide') content.scrollTop = scroll;
  if (page === 'pigs' && id) {
    const art = new URLSearchParams(query).get('art') ?? undefined;
    renderEditor(app.querySelector<HTMLElement>('.drawer-host')!, id === 'new' ? null : id, () => go('#/pigs'), art);
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', (e) => {
  if (state.dirty || productsDirty() || breedingDirty() || layoutDirty() || userDirty()) e.preventDefault();
});
onChange(render);
app.innerHTML = '<p class="loading">Đang tải data heo… 🐷</p>';
load().catch((e: unknown) => {
  app.innerHTML = `<p class="empty">Không tải được manifest: ${esc((e as Error).message)}</p>`;
});
