// "🎮 Desktop Game" (DECISIONS AM-1): build status + a step-by-step guide from development to the
// installed game with a desktop shortcut. Commands, paths and versions come from the dev API
// (scripts/admin/buildInfo.ts reads package.json, release/ and the save folders) — none typed here.
import { esc, gold } from './labels';
import { json, post, state } from './store';

interface FileInfo { path: string; exists: boolean; bytes: number; modifiedAt: number | null }
interface BuildInfo {
  version: string;
  productName: string;
  platform: string;
  icon: string;
  scripts: { name: string; command: string; runs: string }[];
  output: string;
  installer: FileInfo;
  unpacked: FileInfo;
  lastBuild: FileInfo;
  installDir: string;
  nsis: { shortcutName: string; createDesktopShortcut: boolean; createStartMenuShortcut: boolean; deleteAppDataOnUninstall: boolean };
  data: { installed: FileInfo & { dir: string }; dev: FileInfo & { dir: string } };
}

let info: BuildInfo | null = null;
const date = (ms: number | null) => (ms ? new Date(ms).toLocaleString('vi-VN') : '—');
const mb = (bytes: number) => `${gold(Math.round(bytes / 1024 / 1024))} MB`;

const cmd = (text: string) =>
  `<div class="cmd"><code>${esc(text)}</code><button type="button" class="btn btn-small" data-copy="${esc(text)}">📋 Copy</button></div>`;

function script(i: BuildInfo, name: string) {
  const s = i.scripts.find((x) => x.name === name);
  return s ? `${cmd(s.command)}<p class="muted small">chạy: <code>${esc(s.runs)}</code></p>` : `<p class="issue error">package.json không có script ${esc(name)}</p>`;
}

function status(i: BuildInfo) {
  const ready = i.installer.exists;
  return `<section class="panel build-status">
    <h3>Desktop Build <span class="badge ${ready ? 'status-ok' : 'status-warn'}">● ${ready ? 'Ready' : 'Chưa có installer'}</span></h3>
    <dl class="kv">
      <dt>Phiên bản</dt><dd>${esc(i.version)} (package.json)</dd>
      <dt>Nền tảng</dt><dd>${esc(i.platform)}</dd>
      <dt>Build gần nhất</dt><dd>${date(i.lastBuild.modifiedAt)}</dd>
      <dt>Installer</dt><dd>${i.installer.exists ? `<code>${esc(i.installer.path)}</code> · ${mb(i.installer.bytes)} · ${date(i.installer.modifiedAt)}` : `<code>${esc(i.installer.path)}</code> — chưa build`}</dd>
      <dt>Bản chạy thử (không cài)</dt><dd>${i.unpacked.exists ? `<code>${esc(i.unpacked.path)}</code>` : '—'}</dd>
      <dt>Icon</dt><dd><code>${esc(i.icon)}</code> (exe, shortcut, Start Menu, installer, taskbar)</dd>
    </dl>
    <p class="actions"><button class="btn" type="button" data-open="output">📂 Mở thư mục output</button>
      <button class="btn" type="button" data-copy="npm run dist:win">📋 Copy lệnh build desktop</button>
      <a class="btn" href="#/desktop" data-jump="guide-steps">📘 Xem hướng dẫn</a></p></section>`;
}

function steps(i: BuildInfo) {
  const sc = i.nsis.shortcutName;
  const d = i.data;
  return `<div id="guide-steps" class="desktop-steps">
    <section class="panel"><h3>1 · Development (lập trình viên)</h3>
      <p>Chơi thử nhanh trong trình duyệt (tự tải lại khi sửa code):</p>${script(i, 'dev')}
      <p>Chơi thử trong cửa sổ Electron thật:</p>${script(i, 'dev:desktop')}
      <p>Dashboard này:</p>${script(i, 'admin')}
      <p class="muted">Hai lệnh dev dùng <b>chung một nông trại</b>: <code>${esc(d.dev.dir)}</code> — chính là save “Bản dev” trong mục Người chơi. Sửa ở dashboard → game đang mở tự tải lại.</p></section>
    <section class="panel"><h3>2 · Production Build</h3>${script(i, 'build')}
      <p class="muted">Kiểm tra kiểu + đóng gói giao diện vào <code>dist/</code> và Electron vào <code>dist-electron/</code>. Bản build không có server, không localhost, không cần npm khi chơi.</p></section>
    <section class="panel"><h3>3 · Package Desktop (tạo installer)</h3>${script(i, 'dist:win')}
      <p class="muted">Tự chạy build rồi electron-builder (NSIS). Mất vài phút.</p></section>
    <section class="panel"><h3>4 · Output</h3><ul>
      <li>Installer: <code>${esc(i.installer.path)}</code></li>
      <li>Bản chạy không cần cài (thử nhanh): <code>${esc(i.unpacked.path)}</code></li></ul></section>
    <section class="panel"><h3>5 · Install</h3><ol>
      <li>Double-click <code>${esc(i.installer.path.split(/[\\/]/).pop() ?? '')}</code> (copy sang máy khác cũng được — không cần Node, VS Code hay mạng).</li>
      <li>Chọn thư mục cài (mặc định cho riêng người dùng: <code>${esc(i.installDir)}</code>) → Cài đặt.</li>
      <li>Windows SmartScreen có thể cảnh báo vì installer chưa ký số: “More info” → “Run anyway”.</li></ol></section>
    <section class="panel"><h3>6 · Shortcut</h3>
      <p>${i.nsis.createDesktopShortcut ? '✓ Desktop' : '✕ Desktop'} · ${i.nsis.createStartMenuShortcut ? '✓ Start Menu' : '✕ Start Menu'} — tên “${esc(sc)}”, trỏ thẳng vào file .exe của game.</p>
      <p><b>Desktop → ${esc(sc)} → Double-click → Loading → Chơi.</b> Không cần Terminal, npm hay dev server.</p></section>
    <section class="panel"><h3>7 · Data & Save</h3><ul>
      <li>Bản cài: <code>${esc(d.installed.dir)}</code> ${d.installed.exists ? `· save lưu lúc ${date(d.installed.modifiedAt)} <button class="btn btn-small" type="button" data-open="installed">📂 Mở</button>` : '· chưa có (tạo ở lần chơi đầu)'}</li>
      <li>Bản dev: <code>${esc(d.dev.dir)}</code> ${d.dev.exists ? `<button class="btn btn-small" type="button" data-open="dev">📂 Mở</button>` : ''}</li>
      <li>Save nằm trong AppData, <b>không</b> nằm trong thư mục cài → cài lại / cập nhật không đụng tới. Gỡ cài đặt cũng giữ save${i.nsis.deleteAppDataOnUninstall ? ' (đang tắt!)' : ''}.</li>
      <li>Mỗi lần game ghi, bản cũ vào <code>saves\\backups\\</code> (khôi phục trong game: Cài đặt → Khôi phục bản sao lưu).</li></ul></section>
    <section class="panel"><h3>8 · Update</h3><ol>
      <li>Tăng <code>version</code> trong package.json (hiện ${esc(i.version)}).</li>
      <li>Chạy lại ${cmd('npm run dist:win')}</li>
      <li>Chạy installer mới trên máy đã cài — nó ghi đè bản cũ ở cùng thư mục, shortcut giữ nguyên.</li>
      <li>Mở game: save, heo, kho đồ, tiến trình vẫn nguyên (save cũ hơn được tự nâng cấp; save mới hơn bản game thì game không ghi đè).</li></ol></section>
  </div>`;
}

export function renderDesktop(root: HTMLElement) {
  if (!state.apiOnline) {
    root.innerHTML = '<p class="empty">Cần chạy <code>npm run admin</code> để đọc thông tin build.</p>';
    return;
  }
  if (!info) {
    root.innerHTML = '<p class="loading">Đang đọc package.json… 🐷</p>';
    json<BuildInfo>('/__admin/build-info').then(
      (i) => {
        info = i;
        renderDesktop(root);
      },
      (e: unknown) => (root.innerHTML = `<p class="empty">${esc((e as Error).message)}</p>`),
    );
    return;
  }
  root.innerHTML = `<p class="muted">Từ code tới icon trên Desktop: người chơi chỉ cần installer, double-click shortcut là vào game.
      <button class="btn btn-small" type="button" data-refresh>↻ Đọc lại</button></p>${status(info)}${steps(info)}`;
  root.querySelector('[data-refresh]')?.addEventListener('click', () => {
    info = null;
    renderDesktop(root);
  });
  root.querySelectorAll<HTMLElement>('[data-copy]').forEach((b) =>
    b.addEventListener('click', () => {
      void navigator.clipboard.writeText(b.dataset.copy!).then(() => (b.textContent = '✓ Đã copy'));
    }),
  );
  root.querySelectorAll<HTMLElement>('[data-open]').forEach((b) =>
    b.addEventListener('click', () =>
      void post('/__admin/open-folder', { which: b.dataset.open }).catch((e: Error) => alert(e.message)),
    ),
  );
  root.querySelector<HTMLElement>('[data-jump]')?.addEventListener('click', (e) => {
    e.preventDefault();
    root.querySelector('#guide-steps')?.scrollIntoView({ behavior: 'smooth' });
  });
}
