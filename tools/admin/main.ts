// Sobi World admin dashboard entry (admin.html, `npm run admin`; decisions A7-1, AD-1, 036). Hash routes:
// #/ overview · #/users[/<id>] · #/content[/<file>] · #/pigs[?filters] · #/pigs/<ID> | #/pigs/new[?art=pig_x] · #/validation
// #/breeding · #/products · #/layout · #/seasons · #/daynight · #/adventure · #/adventure-world · #/adventure-network · #/adventure-editor/<mapId> · #/adventure-assets · #/adventure-maps[/<mapId>] · #/battle-lab · #/rig-lab · #/assets · #/library · #/desktop · #/guide[/<section>]
import { renderAssets } from './assets';
import { renderAdventure } from './adventure';
import { renderAdventureMaps } from './adventureMaps';
import { renderMapManage } from './mapManage';
import { watchRichSelects } from './richSelect';
import { renderMapNetwork } from './mapNetworkPage';
import { editorDirty, renderMapEditor } from './mapEditor';
import { renderMapAssets } from './mapAssetsPage';
import { renderBattleLab } from './battleLab';
import { renderRigLab } from './rigLab';
import { breedingDirty, renderBreeding } from './breeding';
import { contentDirty, renderContent } from './contentPage';
import { renderDayNight } from './dayNight';
import { renderSeasons } from './seasons';
import { renderEditor } from './editor';
import { renderDesktop } from './desktop';
import { openGuide, renderGuide } from './guide';
import { esc } from './labels';
import { layoutDirty, renderLayout } from './layout';
import { renderLibrary } from './library';
import { renderOverview } from './overview';
import { installRedrawGuard } from './redraw';
import { isFolded, readPrefs, setAll, toggleGroup, writePrefs } from './navState';
import { openQuickSearch, type SearchEntry } from './quickSearch';
import { installShortcuts } from './shortcuts';
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
  ['Thế giới (dùng chung)', [['daynight', '🌗', 'Ngày / Đêm', 'daynight']]],
  ['Phiêu lưu', [
    ['adventure', '⚔️', 'Mô phỏng trận', 'battle-sim'],
    ['adventure-world', '🧭', 'Quản lý map', 'map-manage'],
    ['adventure-network', '🕸️', 'Mạng map', 'map-network'],
    ['adventure-editor', '✏️', 'Map Editor', 'map-editor'],
    ['adventure-assets', '🌲', 'Asset bản đồ', 'map-assets'],
    ['adventure-maps', '🗺️', 'Bản đồ khu', 'adventure-maps'],
  ]],
  ['Xưởng hoạt họa', [['battle-lab', '✨', 'Animation trận', 'battle-lab'], ['rig-lab', '🦴', 'Rig sinh vật', 'battle-lab']]],
  ['Asset', [['assets', '📥', 'Asset nguồn', 'asset-source'], ['library', '🖼️', 'Thư viện asset', 'asset-library']]],
  ['Hệ thống', [['desktop', '🎮', 'Bản desktop', 'desktop'], ['guide', '📘', 'Hướng dẫn', 'overview']]],
];
const ALL = NAV.flatMap(([, items]) => items);
/** The world / adventure / animation pages share one design (worldUi.css, `.wpage`). The Map Editor is a full-screen tool with its own dark theme. */
const WORLD_PAGES = new Set(['daynight', 'adventure', 'adventure-world', 'adventure-network', 'adventure-assets', 'adventure-maps', 'battle-lab', 'rig-lab']);
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

const anyDirty = () => state.dirty || productsDirty() || breedingDirty() || layoutDirty() || userDirty() || contentDirty() || editorDirty();

function shell() {
  const { page } = route();
  const errors = state.issues.filter((i) => i.level === 'error').length;
  const dirtyOf: Record<string, () => boolean> = {
    pigs: () => state.dirty, products: productsDirty, breeding: breedingDirty, layout: layoutDirty, users: userDirty, content: contentDirty,
  };
  const prefs = readPrefs();
  const item = ([p, icon, label]: NavItem) => `<a href="#/${p}" class="nav__item${page === p ? ' is-active' : ''}" title="${esc(label)}">
      <span class="nav__icon">${icon}</span><span class="nav__label">${label}</span>
      ${p === 'validation' && errors ? `<span class="nav__count">${errors}</span>` : ''}${dirtyOf[p]?.() ? '<span class="dot-warn" title="Có thay đổi chưa lưu"></span>' : ''}</a>`;
  const nav = NAV.map(([group, items]) => {
    const rows = items.map(item).join('');
    if (!group) return `<div class="nav__sec">${rows}</div>`;
    const folded = isFolded(group, prefs, items.some((n) => n[0] === page));
    return `<div class="nav__sec${folded ? ' is-folded' : ''}" data-group="${esc(group)}"><button type="button" class="nav__group" data-nav-group aria-expanded="${!folded}"><span class="nav__chev">▾</span><span class="nav__gtext">${esc(group)}</span></button><div class="nav__items">${rows}</div></div>`;
  }).join('');
  const tools = `<div class="nav__tools"><button type="button" class="nav__tool" data-quick-search title="Tìm nhanh (Ctrl+K)">🔍<span class="nav__label"> Tìm nhanh</span></button><button type="button" class="nav__tool" data-nav-all="fold" title="Thu tất cả nhóm">⮝</button><button type="button" class="nav__tool" data-nav-all="open" title="Mở tất cả nhóm">⮟</button><button type="button" class="nav__tool" data-nav-icons title="Thanh bên chỉ có biểu tượng">▤</button></div>`;
  const current = ALL.find((n) => n[0] === page) ?? ALL[0]!;
  const species = SPECIES_PAGES.has(page);
  const msg = state.message
    ? `<div class="toast ${state.message.kind}"><pre>${esc(state.message.text)}</pre><button class="icon-btn" data-dismiss aria-label="Đóng">✕</button></div>`
    : '';
  app.innerHTML = `
    <div class="layout${prefs.icons ? ' nav-icons' : ''}">
      <aside class="sidebar">
        <a class="brand" href="#/"><span class="brand__logo">🌍</span><span><b>Sobi World</b><small>Admin</small></span></a>
        ${tools}<nav class="nav">${nav}</nav>
        <p class="sidebar__foot"><span class="api-dot ${state.apiOnline ? 'is-on' : ''}"></span>${state.apiOnline ? 'Đang nối dữ liệu game' : 'Chỉ đọc — chạy npm run admin'}</p>
      </aside>
      <main class="main">
        <header class="header">
          <h1>${current[1]} ${esc(current[2])}</h1>
          <div class="header__actions">
            ${page !== 'guide' ? `<button type="button" class="help-link" data-guide="${current[3]}">❔ Hướng dẫn</button>` : ''}
            ${species && state.dirty ? '<span class="badge status-warn">● Chưa lưu</span><button class="btn" data-discard>↺ Huỷ thay đổi</button>' : ''}
            ${species ? `<button class="btn btn-primary" data-save ${!state.dirty || state.saving || !state.apiOnline || errors > 0 ? 'disabled' : ''}
              title="${errors ? 'Sửa hết lỗi trước khi lưu' : 'Ghi vào content/farm/species.json + manifest'}">
              ${state.saving ? 'Đang lưu…' : '💾 Lưu giống heo'}</button>` : ''}
          </div>
        </header>
        ${msg}
        <div class="content${WORLD_PAGES.has(page) ? ' wpage' : ''}"></div>
      </main>
    </div>
    <div class="drawer-host"></div>`;
  app.querySelector('[data-save]')?.addEventListener('click', () => void save());
  // The guide opens over the page (no navigation: the work on the page stays).
  app.querySelector<HTMLButtonElement>('[data-guide]')?.addEventListener('click', (e) => openGuide((e.currentTarget as HTMLButtonElement).dataset.guide!));
  app.querySelector('[data-discard]')?.addEventListener('click', discard);
  app.querySelector('[data-dismiss]')?.addEventListener('click', () => {
    state.message = null;
    render();
  });
}

/** Sidebar clicks change the nav in place (no page redraw): fold a group, fold / open all, icon-only mode, quick search. */
function wireNav() {
  const pages: SearchEntry[] = ALL.map(([p, icon, label]) => ({ label: `${icon} ${label}`, sub: 'Trang', href: `#/${p}`, kind: 'page' }));
  const openSearch = () => void openQuickSearch(pages);
  installShortcuts({ openSearch, root: app });
  app.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const groups = NAV.flatMap(([g]) => (g ? [g] : []));
    const fold = (g: string, on: boolean) => app.querySelectorAll<HTMLElement>('.nav__sec[data-group]').forEach((el) => el.dataset.group === g && el.classList.toggle('is-folded', on));
    if (t?.closest('[data-quick-search]')) return openSearch();
    const one = t?.closest<HTMLElement>('[data-nav-group]')?.parentElement?.dataset.group;
    if (one) {
      const next = toggleGroup(readPrefs(), one);
      writePrefs(next);
      return fold(one, next.collapsed.includes(one));
    }
    const all = t?.closest<HTMLElement>('[data-nav-all]')?.dataset.navAll;
    if (all) {
      writePrefs(setAll(readPrefs(), groups, all === 'fold'));
      for (const g of groups) fold(g, all === 'fold');
      return;
    }
    if (t?.closest('[data-nav-icons]')) {
      const next = { ...readPrefs(), icons: !readPrefs().icons };
      writePrefs(next);
      app.querySelector('.layout')?.classList.toggle('nav-icons', next.icons);
    }
  });
}

function render() {
  const { page, id, query } = route();
  if (MOVED[page]) return void location.replace(MOVED[page]);
  const scroll = document.scrollingElement?.scrollTop ?? 0;
  // The page is rebuilt: hold its height meanwhile so the browser does not clamp the scroll to the top.
  app.style.minHeight = `${app.offsetHeight}px`;
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
    'adventure-world': () => renderMapManage(content),
    'adventure-network': () => renderMapNetwork(content),
    'adventure-editor': () => renderMapEditor(content, id),
    'adventure-assets': () => renderMapAssets(content),
    'adventure-maps': () => renderAdventureMaps(content, id),
    'battle-lab': () => renderBattleLab(content),
    'rig-lab': () => renderRigLab(content),
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
  requestAnimationFrame(() => {
    if (location.hash === lastHash && page !== 'guide') document.scrollingElement?.scrollTo({ top: scroll });
    app.style.minHeight = '';
  });
  if (page === 'pigs' && id) {
    const art = new URLSearchParams(query).get('art') ?? undefined;
    renderEditor(app.querySelector<HTMLElement>('.drawer-host')!, id === 'new' ? null : id, () => go('#/pigs'), art);
  }
}

installRedrawGuard(app); // every page's own `innerHTML = …` redraw keeps scroll and focus (step 2)
wireNav();
window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', (e) => {
  if (anyDirty()) e.preventDefault();
});
onChange(render);
watchRichSelects();
app.innerHTML = '<p class="loading">Đang tải dữ liệu Sobi World… 🌍</p>';
load().catch((e: unknown) => {
  app.innerHTML = `<p class="empty">Không tải được manifest: ${esc((e as Error).message)}</p>`;
});
