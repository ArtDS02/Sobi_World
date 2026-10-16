// User management (decisions AD-1, 036): the game is single-player and offline, so a "user" is one world save — a
// desktop save folder found by the dev API, or a .json file exported from the game (web/dev or another machine). This
// module loads and writes them; userDetail.ts draws the editor, worldEdits.ts holds the edits.
import { parseWorldSave } from '../../src/app/saveCodec';
import { exportFileName } from '../../src/core/save/exportImport';
import type { WorldSave } from '../../src/core/save/world';
import { esc, gold } from './labels';
import { mountList } from './listKit';
import { byNumber, reverse } from './listQuery';
import { openModal } from './modal';
import { json, post, state } from './store';
import { apply, summary, type Edit } from './worldEdits';

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
  world: WorldSave | null;
  error: string | null;
}

/** A part of the save edited by a generic (schema) form: its own copy, edited in place. */
export interface PartDraft {
  path: readonly string[];
  obj: unknown;
}

export interface OpenSave {
  id: string;
  source: 'disk' | 'file';
  label: string;
  path: string;
  original: WorldSave;
  draft: WorldSave;
  baseModifiedAt: number;
  dirty: boolean;
  /** Edits applied since it was opened: replayed on a newer save the game wrote meanwhile. */
  edits: Edit[];
  parts: Map<string, PartDraft>;
}

export const users = {
  list: [] as Loaded[],
  root: '',
  loaded: false,
  /** The save being edited: `file` = opened from a .json (saved back by download). */
  open: null as OpenSave | null,
};

/** Which run mode plays a save folder (electron/dataDir.ts, DECISIONS AM-1). */
export const appLabel = (app: string, folder: string) => `${APP_LABELS[app] ?? app}${folder === 'saves' ? '' : ` · ${folder}`}`;

const APP_LABELS: Record<string, string> = {
  SobiWorld: 'Bản cài đặt',
  'SobiWorld Dev': 'Bản dev (npm run dev / dev:desktop)',
  'Un In Homemade': 'Sobi Farm cũ — bản cài',
  'Un In Homemade Dev': 'Sobi Farm cũ — bản dev',
};

/** A save file as the world (older saves migrated the way the game does). */
function parse(text: string): { world: WorldSave | null; error: string | null } {
  const r = parseWorldSave(text);
  return r.ok ? { world: r.save, error: null } : { world: null, error: r.error };
}

export async function loadUsers() {
  const { profiles, root } = await json<{ profiles: Profile[]; root: string }>('/__admin/saves');
  users.root = root;
  users.list = await Promise.all(
    profiles.map(async (profile) => {
      try {
        const r = await json<{ json: string }>(`/__admin/saves/read?id=${encodeURIComponent(profile.id)}`);
        return { profile, ...parse(r.json) };
      } catch (e) {
        return { profile, world: null, error: (e as Error).message };
      }
    }),
  );
  users.loaded = true;
}

const opened = (id: string, source: OpenSave['source'], label: string, path: string, world: WorldSave, baseModifiedAt: number): OpenSave => ({
  id, source, label, path, original: world, draft: world, baseModifiedAt, dirty: false, edits: [], parts: new Map(),
});

export async function openProfile(id: string) {
  const r = await json<{ profile: Profile; json: string }>(`/__admin/saves/read?id=${encodeURIComponent(id)}`);
  const p = parse(r.json);
  if (!p.world) throw new Error(`Save không đọc được (${p.error}) — game sẽ tự lấy bản backup gần nhất.`);
  users.open = opened(id, 'disk', appLabel(r.profile.app, r.profile.folder), r.profile.path, p.world, r.profile.modifiedAt);
}

export async function openFile(file: File) {
  const p = parse(await file.text());
  if (!p.world) throw new Error(`File không phải save hợp lệ (${p.error})`);
  users.open = opened('file', 'file', file.name, file.name, p.world, 0);
}

/** Drops the draft: back to the save as it was opened. */
export function discardOpen() {
  const o = users.open!;
  o.draft = o.original;
  o.edits = [];
  o.parts.clear();
  o.dirty = false;
}

/** Writes the draft: disk saves through the API (backup first), files as a download for import. */
export async function saveOpen(): Promise<string> {
  const o = users.open!;
  if (o.source === 'file') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(o.draft)], { type: 'application/json' }));
    a.download = exportFileName(new Date());
    a.click();
    o.dirty = false;
    return `Đã tải ${a.download}. Trong game: Cài đặt → Nhập file lưu để dùng save này.`;
  }
  const write = (world: WorldSave) =>
    post<{ backup: string; modifiedAt: number }>('/__admin/saves/write', { id: o.id, json: JSON.stringify(world), baseModifiedAt: o.baseModifiedAt });
  let r: { backup: string; modifiedAt: number };
  let replayed = false;
  try {
    r = await write(o.draft);
  } catch (e) {
    if ((e as { status?: number }).status !== 409) throw e;
    // The running game autosaved meanwhile: replay these edits on its newer save (AM-1).
    const fresh = await json<{ profile: Profile; json: string }>(`/__admin/saves/read?id=${encodeURIComponent(o.id)}`);
    const p = parse(fresh.json);
    if (!p.world) throw new Error(`Save trên đĩa không đọc được (${p.error})`, { cause: e });
    o.draft = o.edits.reduce(apply, p.world);
    o.baseModifiedAt = fresh.profile.modifiedAt;
    r = await write(o.draft);
    replayed = true;
  }
  o.original = o.draft;
  o.edits = [];
  o.parts.clear();
  o.baseModifiedAt = r.modifiedAt;
  o.dirty = false;
  users.loaded = false;
  return `Đã lưu save${replayed ? ' (game vừa tự lưu — đã áp lại thay đổi của bạn lên bản mới nhất)' : ''}. Game đang mở sẽ tự tải lại. Bản cũ ở backups/${r.backup} (khôi phục được trong game: Cài đặt → Khôi phục bản sao lưu).`;
}

export async function archiveOpen(): Promise<string> {
  const r = await post<{ backup: string }>('/__admin/saves/archive', { id: users.open!.id });
  users.open = null;
  users.loaded = false;
  return `Đã chuyển save vào backups/${r.backup}. Lần mở tới game bắt đầu mới (vẫn khôi phục được).`;
}

const date = (ms: number) => new Date(ms).toLocaleString('vi-VN');

function row(u: Loaded) {
  const s = u.world ? summary(u.world) : null;
  return `<tr>
    <td><a class="user-link" href="#/users/${encodeURIComponent(u.profile.id)}"><b>${esc(appLabel(u.profile.app, u.profile.folder))}</b></a><br /><small class="mono muted">${esc(u.profile.path)}</small></td>
    <td>${s ? `<b>Cấp ${s.level}</b><br /><small class="muted">${gold(s.xp)} KN</small>` : '—'}</td>
    <td class="num">${s ? `🪙 ${gold(s.coins)}<br /><small class="muted">💎 ${gold(s.gems)} · 🎟️ ${gold(s.tokens)}</small>` : '—'}</td>
    <td class="num">${s ? `${s.areas}/5` : '—'}</td>
    <td class="num">${s ? `${s.pigs}/${s.slots}${s.sick ? ` <span class="badge status-error">${s.sick} ốm</span>` : ''}` : '—'}</td>
    <td>${date(u.profile.modifiedAt)}<br /><small class="muted">${u.profile.backups} bản sao lưu</small></td>
    <td>${u.error ? `<span class="badge status-error">✕ ${esc(u.error)}</span>` : '<span class="badge status-ok">✓ Hợp lệ</span>'}</td>
    <td>${u.world ? `<a class="btn btn-small btn-primary" href="#/users/${encodeURIComponent(u.profile.id)}">Mở</a>` : ''}</td></tr>`;
}

export function renderUsers(root: HTMLElement, rerender: () => void) {
  if (!state.apiOnline) {
    root.innerHTML = `<div class="panel empty-guide"><h3>Cần chạy <code>npm run admin</code> để đọc save trên máy</h3>
      <p>Hoặc mở một file save xuất từ game: <label class="btn btn-primary file-btn">📂 Mở file save (.json)<input type="file" accept="application/json,.json" data-file hidden /></label></p></div>`;
    bindFile(root, rerender);
    return;
  }
  if (!users.loaded) {
    root.innerHTML = '<p class="loading">Đang đọc save…</p>';
    loadUsers().then(rerender, (e: unknown) => (root.innerHTML = `<p class="empty">${esc((e as Error).message)}</p>`));
    return;
  }
  const none = users.list.length === 0
    ? `<div class="panel empty-guide"><h3>Không tìm thấy save nào trong thư mục quét</h3>
        <ol><li>Chơi bản desktop ít nhất 1 lần (<code>npm run dev:desktop</code> hoặc bản cài đặt) để game tạo <code>save.json</code>.</li>
        <li>Đã có save mà vẫn trống: bấm “📁 Đổi thư mục quét” và dán đường dẫn thư mục <code>AppData\\Roaming</code>.</li>
        <li>Save bản web/dev: trong game Cài đặt → Xuất file lưu, rồi “📂 Mở file save”.</li></ol></div>`
    : '';
  root.innerHTML = `
    <p class="muted">Mỗi “người chơi” là một save thế giới (đủ 5 khu). Thư mục quét: <code>${esc(users.root)}</code>
      <button class="btn btn-small" data-root type="button">📁 Đổi thư mục quét</button></p>
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
        test: (u, v) => !!u.world && (v === 'sick' ? summary(u.world).sick > 0 : summary(u.world).pigs === 0) },
    ],
    sorts: [
      { key: 'recent', label: 'Chơi gần nhất', compare: reverse(byNumber((u) => u.profile.modifiedAt)) },
      { key: 'coins', label: 'Nhiều Sobi Coin nhất', compare: reverse(byNumber((u) => u.world?.wallet.coins ?? -1)) },
      { key: 'xp', label: 'Cấp cao nhất', compare: reverse(byNumber((u) => (u.world ? summary(u.world).xp : -1))) },
    ],
    pageSize: 24,
    placeholder: 'Tìm bản game, thư mục…',
    noun: 'save',
    resultsClass: 'table-wrap',
    actions: `<button class="btn" data-reload type="button">↻ Đọc lại</button>
      <label class="btn btn-primary file-btn">📂 Mở file save (.json)<input type="file" accept="application/json,.json" data-file hidden /></label>`,
    render: (rows) => `<table class="table"><thead><tr><th>Save</th><th>Cấp</th><th>Tiền</th><th>Khu</th><th>Heo</th><th>Lưu lần cuối</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>${rows.map(row).join('')}</tbody></table>`,
  });
  root.querySelector('[data-root]')?.addEventListener('click', () =>
    openModal({
      title: 'Thư mục quét save',
      submit: 'Quét thư mục này',
      body: `<label class="field"><span>Thư mục chứa các thư mục “SobiWorld…” (để trống = mặc định %APPDATA%)</span>
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
  bindFile(root, rerender);
}

function bindFile(root: HTMLElement, rerender: () => void) {
  root.querySelector<HTMLInputElement>('[data-file]')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (users.open?.dirty && !confirm('Save đang mở còn thay đổi chưa lưu. Bỏ các thay đổi đó?')) return;
    try {
      await openFile(file);
      location.hash = '#/users/file';
    } catch (x) {
      state.message = { kind: 'error', text: (x as Error).message };
      rerender();
    }
  });
}
