// Player saves for the admin dashboard's user management (DECISIONS AD-1). The game is single-player
// and offline: a "user" is one desktop save folder (%APPDATA%\SobiWorld*\saves*\save.json and Sobi Farm's %APPDATA%\Un In Homemade*\…,
// spec §9.1). Writes follow the game's own rules: the current save is copied into backups/ first
// (a name the in-game restore lists), then tmp → rename. Nothing is ever hard-deleted.
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';

type Result = { status: number; body: unknown };

export interface SaveProfile {
  id: string;
  app: string; // "SobiWorld" (installed) | "SobiWorld Dev" (npm run dev) | Sobi Farm's "Un In Homemade[ Dev]"
  folder: string; // saves | saves-<test>
  path: string;
  modifiedAt: number;
  bytes: number;
  backups: number;
}

/** Game folders: Sobi World's, and Sobi Farm's (read-only history, still editable). */
const APP_PREFIXES = ['SobiWorld', 'Un In Homemade'];
const isAppDir = (name: string) => APP_PREFIXES.some((p) => name.startsWith(p));
const SAVE = 'save.json';

let rootOverride: string | null = null;

/** The folder chosen in the dashboard, else UNIN_ADMIN_SAVES_ROOT (tests, copies), else %APPDATA%. */
export const savesRoot = () =>
  rootOverride ?? process.env.UNIN_ADMIN_SAVES_ROOT ?? process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');

/** Dashboard "Đổi thư mục quét": a folder holding the game folders; empty = default. */
export function setSavesRoot(path: string): Result {
  const p = path.trim().replace(/^"|"$/g, '');
  if (!p) {
    rootOverride = null;
    return { status: 200, body: { root: savesRoot() } };
  }
  if (!existsSync(p) || !statSync(p).isDirectory()) return { status: 400, body: { error: `Không có thư mục ${p}` } };
  rootOverride = resolve(p);
  return { status: 200, body: { root: rootOverride } };
}

const encode = (rel: string) => Buffer.from(rel, 'utf8').toString('base64url');

/** Profile id → its saves folder, refusing anything outside the root's game folders. */
function folderOf(root: string, id: string): string | null {
  const rel = Buffer.from(id, 'base64url').toString('utf8');
  const [app, folder, ...rest] = rel.split('/');
  if (!app || !isAppDir(app) || !folder || !/^saves[\w-]*$/.test(folder) || rest.length) return null;
  const dir = resolve(root, app, folder);
  return dir.startsWith(resolve(root) + sep) ? dir : null;
}

const dirs = (path: string) =>
  existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

export function listProfiles(root = savesRoot()): SaveProfile[] {
  const out: SaveProfile[] = [];
  for (const app of dirs(root).filter(isAppDir)) {
    for (const folder of dirs(join(root, app)).filter((d) => /^saves[\w-]*$/.test(d))) {
      const path = join(root, app, folder, SAVE);
      if (!existsSync(path)) continue;
      const st = statSync(path);
      const backups = join(root, app, folder, 'backups');
      out.push({
        id: encode(`${app}/${folder}`),
        app,
        folder,
        path,
        modifiedAt: st.mtimeMs,
        bytes: st.size,
        backups: existsSync(backups) ? readdirSync(backups).filter((f) => f.endsWith('.json')).length : 0,
      });
    }
  }
  return out.sort((a, b) => b.modifiedAt - a.modifiedAt);
}

export function readProfile(id: string, root = savesRoot()): Result {
  const dir = folderOf(root, id);
  if (!dir || !existsSync(join(dir, SAVE))) return { status: 404, body: { error: 'Không tìm thấy save' } };
  const profile = listProfiles(root).find((p) => p.id === id);
  return { status: 200, body: { profile, json: readFileSync(join(dir, SAVE), 'utf8') } };
}

const pad = (n: number) => String(n).padStart(2, '0');
/** save-YYYYMMDD-HHmmss[-n].json, the backup name electron/saveFiles.ts lists for restore. */
function backupName(dir: string, at: Date): string {
  const s = `save-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`;
  let name = `${s}.json`;
  for (let n = 1; existsSync(join(dir, name)); n++) name = `${s}-${n}.json`;
  return name;
}

function backupCurrent(dir: string, now: Date): string {
  const backups = join(dir, 'backups');
  mkdirSync(backups, { recursive: true });
  const name = backupName(backups, now);
  writeFileSync(join(backups, name), readFileSync(join(dir, SAVE)));
  return name;
}

/**
 * Validated JSON → save.json. `baseModifiedAt` is the mtime the dashboard loaded: a newer file
 * means the game (or another tab) wrote meanwhile, and the edit is refused instead of lost.
 */
export function writeProfile(
  args: { id: string; json: string; baseModifiedAt: number },
  validate: (json: string) => string | null,
  root = savesRoot(),
  now = new Date(),
): Result {
  const dir = folderOf(root, args.id);
  if (!dir || !existsSync(join(dir, SAVE))) return { status: 404, body: { error: 'Không tìm thấy save' } };
  const error = validate(args.json);
  if (error) return { status: 400, body: { error: `Save không hợp lệ: ${error}` } };
  if (Math.abs(statSync(join(dir, SAVE)).mtimeMs - args.baseModifiedAt) > 1)
    return { status: 409, body: { error: 'Save vừa được game tự lưu sau khi bạn mở — dashboard sẽ áp lại thay đổi lên bản mới nhất.' } };
  const backup = backupCurrent(dir, now);
  writeFileSync(join(dir, `${SAVE}.tmp`), args.json, 'utf8');
  renameSync(join(dir, `${SAVE}.tmp`), join(dir, SAVE));
  return { status: 200, body: { ok: true, backup, modifiedAt: statSync(join(dir, SAVE)).mtimeMs } };
}

/** "Delete" = the save moves into backups/ (restorable from the game's settings), never erased. */
export function archiveProfile(id: string, root = savesRoot(), now = new Date()): Result {
  const dir = folderOf(root, id);
  if (!dir || !existsSync(join(dir, SAVE))) return { status: 404, body: { error: 'Không tìm thấy save' } };
  const backups = join(dir, 'backups');
  mkdirSync(backups, { recursive: true });
  const name = backupName(backups, now);
  renameSync(join(dir, SAVE), join(backups, name));
  return { status: 200, body: { ok: true, backup: name } };
}
