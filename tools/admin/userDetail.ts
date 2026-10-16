// One player's world save in tabs (decisions AD-1, AM-1, 036): Tổng quan · Ví · Túi đồ · Tiến trình · Bộ sưu tập ·
// one tab per Area · Thế giới & thời gian · Nâng cao. A change applies to the draft at once (no "Áp dụng" step) and is
// checked with the game's own save schemas; "💾 Lưu" writes the whole draft once (backup first). Problems the game
// would refuse are listed above the tabs and block the save.
import { AREAS } from '../../src/app/areas';
import { esc, gold } from './labels';
import { state } from './store';
import { userTabBody, bindUserTab } from './userTabs';
import { archiveOpen, discardOpen, openProfile, saveOpen, users } from './users';
import { saveProblems, summary } from './worldEdits';
import { areaIcon, problemsHtml } from './userDraft';

export type Tab = 'overview' | 'wallet' | 'bag' | 'progress' | 'codex' | 'world' | 'advanced' | `area:${string}`;

const TAB_KEY = 'sobi-admin:user-tab';
let tab: Tab = ((): Tab => {
  try {
    return (sessionStorage.getItem(TAB_KEY) as Tab | null) ?? 'overview';
  } catch {
    return 'overview';
  }
})();

function tabs(): [Tab, string][] {
  return [
    ['overview', '🏠 Tổng quan'],
    ['wallet', '🪙 Ví & giao dịch'],
    ['bag', '🎒 Túi đồ'],
    ['progress', '📈 Tiến trình & khu'],
    ['codex', '📖 Bộ sưu tập & thành tựu'],
    ...AREAS.modules.map((m): [Tab, string] => [`area:${m.manifest.id}`, `${areaIcon(m.manifest.id)} ${m.manifest.name.vi}`]),
    ['world', '🌦️ Thế giới & thời gian'],
    ['advanced', '🛠️ Nâng cao'],
  ];
}

export function renderUserDetail(root: HTMLElement, id: string, rerender: () => void) {
  if (users.open?.id !== id) {
    if (id === 'file') return void (location.hash = '#/users');
    if (users.open?.dirty && !confirm(`Save “${users.open.label}” còn thay đổi chưa lưu. Bỏ các thay đổi đó để mở save khác?`)) {
      location.hash = `#/users/${encodeURIComponent(users.open.id)}`;
      return;
    }
    root.innerHTML = '<p class="loading">Đang mở save…</p>';
    openProfile(id).then(rerender, (e: unknown) => (root.innerHTML = `<p class="empty">${esc((e as Error).message)}</p><p><a class="link" href="#/users">← Danh sách save</a></p>`));
    return;
  }
  const o = users.open;
  const s = summary(o.draft);
  const problems = saveProblems(o.draft);
  const list = tabs();
  if (!list.some(([k]) => k === tab)) tab = 'overview';
  root.innerHTML = `
    <a class="link" href="#/users">← Danh sách save</a>
    <div class="user-head"><div><h2>${esc(o.label)}</h2><p class="muted mono">${esc(o.path)}</p></div>
      <div class="stats stats--compact">
        <div class="stat"><span class="stat__icon">⭐</span><span class="stat__value">${s.level}</span><span class="stat__label">Cấp · ${gold(s.xp)} KN</span></div>
        <div class="stat"><span class="stat__icon">🪙</span><span class="stat__value">${gold(s.coins)}</span><span class="stat__label">Sobi Coin</span></div>
        <div class="stat"><span class="stat__icon">💎</span><span class="stat__value">${gold(s.gems)}</span><span class="stat__label">Ngọc</span></div>
        <div class="stat"><span class="stat__icon">🗺️</span><span class="stat__value">${s.areas}/${AREAS.modules.length}</span><span class="stat__label">Khu đã mở</span></div>
      </div></div>
    <div class="savebar">
      <span class="grow muted">${o.source === 'disk' ? 'Lưu xong, game đang mở tự tải lại save này (không cần đóng game). Bản cũ vào backups/.' : 'Save mở từ file: Lưu = tải file về để Nhập trong game.'}</span>
      <span class="badge status-warn" data-dirty-badge ${o.dirty ? '' : 'hidden'}>● Chưa lưu</span>
      <button class="btn" data-undo ${o.dirty ? '' : 'hidden'}>↺ Huỷ thay đổi</button>
      <button class="btn btn-primary" data-save ${!o.dirty || problems.length ? 'disabled' : ''}>${o.source === 'disk' ? '💾 Lưu vào save' : '⬇ Tải file save'}</button>
    </div>
    <div data-problems>${problemsHtml(problems)}</div>
    <div class="seg tabs" role="tablist">${list.map(([k, l]) => `<button role="tab" data-tab="${esc(k)}" class="${k === tab ? 'is-on' : ''}">${esc(l)}</button>`).join('')}</div>
    <div data-tabbody>${userTabBody(tab)}</div>`;
  root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      tab = b.dataset.tab as Tab;
      try {
        sessionStorage.setItem(TAB_KEY, tab);
      } catch {
        /* storage blocked */
      }
      rerender();
    }),
  );
  root.querySelector('[data-undo]')?.addEventListener('click', () => {
    discardOpen();
    state.message = null;
    rerender();
  });
  root.querySelector('[data-save]')?.addEventListener('click', async (e) => {
    (e.currentTarget as HTMLButtonElement).disabled = true;
    try {
      state.message = { kind: 'ok', text: await saveOpen() };
    } catch (x) {
      state.message = { kind: 'error', text: (x as Error).message };
    }
    rerender();
  });
  bindUserTab(tab, root.querySelector<HTMLElement>('[data-tabbody]')!, root, rerender, {
    archive: async () => {
      state.message = { kind: 'ok', text: await archiveOpen() };
      location.hash = '#/users';
    },
  });
}

export const userDirty = () => !!users.open?.dirty;
