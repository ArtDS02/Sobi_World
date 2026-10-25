// Sobi World admin dashboard entry (admin.html, `npm run admin`; decisions A7-1, AD-1, 036). Hash routes:
// #/ overview · #/users[/<id>] · #/content[/<file>] · #/pigs[?filters] · #/pigs/<ID> | #/pigs/new[?art=pig_x] · #/validation
// #/breeding · #/products · #/layout · #/seasons · #/daynight · #/adventure · #/adventure-maps · #/battle-lab · #/assets · #/library · #/desktop · #/guide[/<section>]
import { renderAssets } from './assets';
import { renderAdventure } from './adventure';
import { renderAdventureMaps } from './adventureMaps';
import { renderBattleLab } from './battleLab';
import { breedingDirty, renderBreeding } from './breeding';
import { contentDirty, renderContent } from './contentPage';
import { renderDayNight } from './dayNight';
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
  [null, [['', '🏠', 'Tổng quan', 'overview'], ['users', '👤', 'Người chơi', 'users'], ['content', '📚', 'Nội dung game', 'content']]],
  ['Sobi Farm', [
    ['pigs', '🐷', 'Giống heo', 'pigs'],
    ['validation', '🩺', 'Kiểm tra dữ liệu heo', 'pigs'],
    ['breeding', '🧬', 'Phối giống heo', 'breeding'],
    ['products', '🛒', 'Cửa hàng Farm', 'shop'],
    ['layout', '🗺️', 'Bố cục cảnh', 'layout'],
    ['seasons', '🍂', 'Mùa & hiệu ứng', 'seasons'],
  ]],
  ['Thế giới', [['daynight', '🌗', 'Ngày / Đêm', 'daynight'], ['adventure', '⚔️', 'Mô phỏng trận', 'content'], ['adventure-maps', '🗺️', 'Bản đồ khu', 'content'], ['battle-lab', '✨', 'Xưởng animation trận', 'content']]],
  ['Asset', [['assets', '📥', 'Asset nguồn', 'asset-source'], ['library', '🖼️', 'Thư viện asset', 'asset-library']]],
  ['Hệ thống', [['desktop', '🎮', 'Bản desktop', 'desktop'], ['guide', '📘', 'Hướng dẫn', 'overview']]],
];
const ALL = NAV.flatMap(([, items]) => items);
/** Pages that edit the species draft: the header save belongs to them. */
const SPECIES_PAGES = new Set(['pigs', 'validation']);
/** `#/<page>?key=value` links (overview cards) preset that page's list filters. */
const LIST_OF: Record<string, string> = { pigs: 'pigs', assets: 'asset-source', library: 'asset-library', products: 'products', breeding: 'breeding', users: 'users' };
/** Old routes that moved. */
const MOVED: Record<string, string> = { numbers: '#/content' };

const app = document.getElementById('admin')!;
let appliedHash = '';
let lastHash = location.hash;

function route() {
  const [path = '', query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [page = '', id = null] = path.split('/');
  return { page, id: id ? decodeURIComponent(id) : null, query };
}

const go = (hash: string) => {
  location.hash = hash;
};

const anyDirty = () => state.dirty || productsDirty() || breedingDirty() || layoutDirty() || userDirty() || contentDirty();

function shell() {
  const { page } = route();
  const errors = state.issues.filter((i) => i.level === 'error').length;
  const dirtyOf: Record<string, () => boolean> = {
    pigs: () => state.dirty, products: productsDirty, breeding: breedingDirty, layout: layoutDirty, users: userDirty, content: contentDirty,
  };
  const nav = NAV.map(([group, items]) => `${group ? `<p class="nav__group">${esc(group)}</p>` : ''}${items
    .map(([p, icon, label]) => `<a href="#/${p}" class="nav__item${page === p ? ' is-active' : ''}">
      <span class="nav__icon">${icon}</span><span class="nav__label">${label}</span>
      ${p === 'validation' && errors ? `<span class="nav__count">${errors}</span>` : ''}${dirtyOf[p]?.() ? '<span class="dot-warn" title="Có thay đổi chưa lưu"></span>' : ''}</a>`)
    .join('')}`).join('');
  const current = ALL.find((n) => n[0] === page) ?? ALL[0]!;
  const species = SPECIES_PAGES.has(page);
  const msg = state.message
    ? `<div class="toast ${state.message.kind}"><pre>${esc(state.message.text)}</pre><button class="icon-btn" data-dismiss aria-label="Đóng">✕</button></div>`
    : '';
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <a class="brand" href="#/"><span class="brand__logo">🌍</span><span><b>Sobi World</b><small>Admin</small></span></a>
        <nav class="nav">${nav}</nav>
        <p class="sidebar__foot"><span class="api-dot ${state.apiOnline ? 'is-on' : ''}"></span>${state.apiOnline ? 'Đang nối dữ liệu game' : 'Chỉ đọc — chạy npm run admin'}</p>
      </aside>
      <main class="main">
        <header class="header">
          <h1>${current[1]} ${esc(current[2])}</h1>
          <div class="header__actions">
            ${page !== 'guide' ? `<a class="help-link" href="#/guide/${current[3]}">❔ Hướng dẫn</a>` : ''}
            ${species && state.dirty ? '<span class="badge status-warn">● Chưa lưu</span><button class="btn" data-discard>↺ Huỷ thay đổi</button>' : ''}
            ${species ? `<button class="btn btn-primary" data-save ${!state.dirty || state.saving || !state.apiOnline || errors > 0 ? 'disabled' : ''}
              title="${errors ? 'Sửa hết lỗi trước khi lưu' : 'Ghi vào content/farm/species.json + manifest'}">
              ${state.saving ? 'Đang lưu…' : '💾 Lưu giống heo'}</button>` : ''}
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
  const { page, id, query } = route();
  if (MOVED[page]) return void location.replace(MOVED[page]);
  const scroll = document.scrollingElement?.scrollTop ?? 0;
  shell();
  const content = app.querySelector<HTMLElement>('.content')!;
  const open = (pigId: string | null) => go(`#/pigs/${pigId ? encodeURIComponent(pigId) : 'new'}`);
  const pages: Record<string, () => void> = {
    pigs: () => renderPigList(content, open),
    validation: () => renderValidation(content, (pigId) => open(pigId)),
    assets: () => renderAssets(content),
    library: () => renderLibrary(content),
    daynight: () => renderDayNight(content, state.apiOnline),
    seasons: () => renderSeasons(content, render),
    content: () => renderContent(content, id, state.apiOnline, render),
    users: () => (id ? renderUserDetail(content, id, render) : renderUsers(content, render)),
    products: () => renderProducts(content, render),
    breeding: () => renderBreeding(content, render),
    adventure: () => renderAdventure(content),
    'adventure-maps': () => renderAdventureMaps(content),
    'battle-lab': () => renderBattleLab(content),
    layout: () => renderLayout(content, render),
    desktop: () => renderDesktop(content),
    guide: () => renderGuide(content, id),
  };
  if (query && !id && LIST_OF[page] && location.hash !== appliedHash) applyQueryString(LIST_OF[page], query);
  appliedHash = location.hash;
  (pages[page] ?? (() => renderOverview(content, render)))();
  // Same page redrawn (an edit): keep the scroll; another page starts at the top.
  if (location.hash === lastHash && page !== 'guide') document.scrollingElement?.scrollTo({ top: scroll });
  else window.scrollTo({ top: 0 });
  lastHash = location.hash;
  if (page === 'pigs' && id) {
    const art = new URLSearchParams(query).get('art') ?? undefined;
    renderEditor(app.querySelector<HTMLElement>('.drawer-host')!, id === 'new' ? null : id, () => go('#/pigs'), art);
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', (e) => {
  if (anyDirty()) e.preventDefault();
});
onChange(render);
app.innerHTML = '<p class="loading">Đang tải dữ liệu Sobi World… 🌍</p>';
load().catch((e: unknown) => {
  app.innerHTML = `<p class="empty">Không tải được manifest: ${esc((e as Error).message)}</p>`;
});
