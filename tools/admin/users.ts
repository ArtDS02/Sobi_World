// User management (DECISIONS AD-1): the game is single-player and offline, so a "user" is one save —
// a desktop save folder found by the dev API, or a .json file exported from the game (web/dev or
// another machine). This module loads/saves them; userDetail.ts draws the editor.
import { parseSave } from '../../src/core/save/migrate';
import { exportFileName } from '../../src/core/save/exportImport';
import type { SaveGame } from '../../src/core/types';
import { esc, gold } from './labels';
import { mountList } from './listKit';
import { byNumber, reverse } from './listQuery';
import { openModal } from './modal';
import { json, post, state } from './store';
import { summary } from './userEdits';

export interface Profile {
  id: string;
  app: string;
  folder: string;
  path: string;
  modifiedAt: number;
  bytes: number;
  backups: number;
}

interface Loaded {
  profile: Profile;
  save: SaveGame | null;
  error: string | null;
}

export const users = {
  list: [] as Loaded[],
  root: '',
  loaded: false,
  /** The save being edited: `file` = opened from a .json (saved back by download). */
  open: null as null | { id: string; source: 'disk' | 'file'; label: string; original: SaveGame; draft: SaveGame; baseModifiedAt: number; dirty: boolean },
};

export const appLabel = (app: string, folder: string) =>
  `${app === 'Un In Homemade' ? 'Bản cài đặt' : app === 'Un In Homemade Dev' ? 'Bản dev desktop' : app}${folder === 'saves' ? '' : ` · ${folder}`}`;

function parse(text: string): { save: SaveGame | null; error: string | null } {
  const r = parseSave(text);
  return r.ok ? { save: r.save, error: null } : { save: null, error: r.error };
}

export async function loadUsers() {
  const { profiles, root } = await json<{ profiles: Profile[]; root: string }>('/__admin/saves');
  users.root = root;
  users.list = await Promise.all(
    profiles.map(async (profile) => {
      const r = await json<{ json: string }>(`/__admin/saves/read?id=${encodeURIComponent(profile.id)}`);
      return { profile, ...parse(r.json) };
    }),
  );
  users.loaded = true;
}

export async function openProfile(id: string) {
  if (users.open?.id === id) return;
  const r = await json<{ profile: Profile; json: string }>(`/__admin/saves/read?id=${encodeURIComponent(id)}`);
  const p = parse(r.json);
  if (!p.save) throw new Error(`Save không đọc được (${p.error}) — game sẽ tự lấy bản backup gần nhất.`);
  users.open = { id, source: 'disk', label: appLabel(r.profile.app, r.profile.folder), original: p.save, draft: p.save, baseModifiedAt: r.profile.modifiedAt, dirty: false };
}

export async function openFile(file: File) {
  const p = parse(await file.text());
  if (!p.save) throw new Error(`File không phải save hợp lệ (${p.error})`);
  users.open = { id: 'file', source: 'file', label: file.name, original: p.save, draft: p.save, baseModifiedAt: 0, dirty: false };
}

/** Writes the draft: disk saves through the API (backup first), files as a download for import. */
export async function saveOpen(): Promise<string> {
  const o = users.open!;
  const text = JSON.stringify(o.draft);
  if (o.source === 'file') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = exportFileName(new Date());
    a.click();
    o.dirty = false;
    return `Đã tải ${a.download}. Trong game: Cài đặt → Nhập file lưu để dùng save này.`;
  }
  const r = await post<{ backup: string; modifiedAt: number }>('/__admin/saves/write', { id: o.id, json: text, baseModifiedAt: o.baseModifiedAt });
  o.original = o.draft;
  o.baseModifiedAt = r.modifiedAt;
  o.dirty = false;
  await loadUsers();
  return `Đã lưu save. Bản cũ ở backups/${r.backup} (khôi phục được trong game: Cài đặt → Khôi phục bản sao lưu).`;
}

export async function archiveOpen(): Promise<string> {
  const r = await post<{ backup: string }>('/__admin/saves/archive', { id: users.open!.id });
  users.open = null;
  await loadUsers();
  return `Đã chuyển save vào backups/${r.backup}. Lần mở tới game bắt đầu mới (vẫn khôi phục được).`;
}

const date = (ms: number) => new Date(ms).toLocaleString('vi-VN');

function row(u: Loaded) {
  const s = u.save ? summary(u.save) : null;
  return `<tr>
    <td><b>${esc(appLabel(u.profile.app, u.profile.folder))}</b><br /><small class="mono">${esc(u.profile.path)}</small></td>
    <td>${s ? `Cấp ${s.level}` : '—'}</td>
    <td class="num">${s ? gold(s.gold) : '—'}</td>
    <td class="num">${s ? `${s.pigs}/${s.slots}` : '—'}</td>
    <td class="num">${s ? s.discovered : '—'}</td>
    <td>${date(u.profile.modifiedAt)}</td>
    <td>${u.error ? `<span class="badge status-error">✕ ${esc(u.error)}</span>` : '<span class="badge status-ok">✓ Hợp lệ</span>'}</td>
    <td><a class="btn btn-small btn-primary" href="#/users/${encodeURIComponent(u.profile.id)}">Mở</a></td></tr>`;
}

export function renderUsers(root: HTMLElement, rerender: () => void) {
  if (!state.apiOnline) {
    root.innerHTML = '<p class="empty">Cần chạy <code>npm run admin</code> để đọc save trên máy.</p>';
    return;
  }
  if (!users.loaded) {
    root.innerHTML = '<p class="loading">Đang đọc save… 🐷</p>';
    loadUsers().then(rerender, (e: unknown) => (root.innerHTML = `<p class="empty">${esc((e as Error).message)}</p>`));
    return;
  }
  const none = users.list.length === 0
    ? `<div class="panel empty-guide"><h3>Không tìm thấy save nào trong thư mục quét</h3>
        <ol><li>Chơi bản desktop ít nhất 1 lần (<code>npm run dev:desktop</code> hoặc bản cài đặt) để game tạo <code>save.json</code>.</li>
        <li>Nếu chắc chắn đã có save mà vẫn trống: dashboard đang chạy trong môi trường không thấy <code>%APPDATA%</code> thật — tắt và chạy lại <code>npm run admin</code> từ terminal thường, hoặc bấm “📁 Đổi thư mục quét” và dán đường dẫn thư mục <code>AppData\\Roaming</code>.</li>
        <li>Save bản web/dev: trong game Cài đặt → Xuất file lưu, rồi “📂 Mở file save”.</li></ol></div>`
    : '';
  root.innerHTML = `
    <p class="muted">Game chơi đơn, offline: mỗi “người chơi” là một save — thư mục save desktop, hoặc file <code>.json</code> xuất từ game (bản web/dev, máy khác).
      Thư mục quét: <code>${esc(users.root)}</code> <button class="btn btn-small" data-root type="button">📁 Đổi thư mục quét</button></p>
    ${none}
    <div data-list></div>`;
  mountList(root.querySelector<HTMLElement>('[data-list]')!, {
    id: 'users',
    items: () => users.list,
    text: (u) => [u.profile.app, u.profile.folder, u.profile.path, appLabel(u.profile.app, u.profile.folder)],
    filters: [
      { key: 'app', label: 'Mọi bản game', options: [...new Set(users.list.map((u) => u.profile.app))].map((a) => [a, appLabel(a, 'saves')] as const), test: (u, v) => u.profile.app === v },
      { key: 'valid', label: 'Mọi trạng thái', options: [['ok', 'Hợp lệ'], ['error', 'Lỗi đọc']], test: (u, v) => (v === 'ok') === !u.error },
      { key: 'sick', label: 'Tình trạng heo', options: [['sick', 'Có heo ốm'], ['empty', 'Chưa có heo']],
        test: (u, v) => !!u.save && (v === 'sick' ? u.save.pigs.some((p) => p.isSick) : u.save.pigs.length === 0) },
    ],
    sorts: [
      { key: 'recent', label: 'Chơi gần nhất', compare: reverse(byNumber((u) => u.profile.modifiedAt)) },
      { key: 'gold', label: 'Nhiều vàng nhất', compare: reverse(byNumber((u) => u.save?.player.gold ?? -1)) },
      { key: 'xp', label: 'Cấp cao nhất', compare: reverse(byNumber((u) => u.save?.player.xp ?? -1)) },
    ],
    pageSize: 25,
    placeholder: 'Tìm bản game, thư mục…',
    noun: 'save',
    resultsClass: 'table-wrap',
    actions: `<button class="btn" data-reload type="button">↻ Đọc lại</button>
      <label class="btn btn-primary file-btn">📂 Mở file save (.json)<input type="file" accept="application/json,.json" data-file hidden /></label>`,
    render: (rows) => `<table class="table"><thead><tr><th>Save</th><th>Cấp</th><th>Vàng</th><th>Heo/chuồng</th><th>Đã khám phá</th><th>Lưu lần cuối</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>${rows.map(row).join('')}</tbody></table>`,
  });
  root.querySelector('[data-root]')?.addEventListener('click', () =>
    openModal({
      title: 'Thư mục quét save',
      submit: 'Quét thư mục này',
      body: `<label class="field"><span>Thư mục chứa các thư mục “Un In Homemade…” (để trống = mặc định %APPDATA%)</span>
        <input name="path" value="${esc(users.root)}" placeholder="C:\\Users\\ten\\AppData\\Roaming" /></label>`,
      onSubmit: async (f) => {
        await post('/__admin/saves/root', { path: String(new FormData(f).get('path') ?? '') });
        users.loaded = false;
        rerender();
      },
    }),
  );
  root.querySelector('[data-reload]')?.addEventListener('click', () => {
    users.loaded = false;
    rerender();
  });
  root.querySelector<HTMLInputElement>('[data-file]')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await openFile(file);
      location.hash = '#/users/file';
    } catch (x) {
      state.message = { kind: 'error', text: (x as Error).message };
      rerender();
    }
  });
}
