// Backups of content files before the admin overwrites them (plan step 7.2). Development only: lives in
// `.admin-backups/` (git-ignored), never in the shipped game. A failed backup refuses the save, never skipped silently.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BACKUP_ROOT = process.env.ADMIN_BACKUP_DIR ?? '.admin-backups';
/** Backups kept per content file. */
export const KEEP = 20;

export interface ContentBackup {
  name: string;
  /** Epoch ms parsed from the name. */
  at: number;
  size: number;
}

const folder = (root: string, file: string) => join(root, file.replace(/[\\/]/g, '__'));
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const stampOf = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${pad(d.getMilliseconds(), 3)}`;
};
const NAME = /^(\d{8})-(\d{6})-(\d{3})\.json$/;
const parse = (name: string): number | null => {
  const m = NAME.exec(name);
  if (!m) return null;
  const [, d, t, ms] = m as unknown as [string, string, string, string];
  return new Date(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), +t.slice(0, 2), +t.slice(2, 4), +t.slice(4, 6), +ms).getTime();
};

/** Newest first. */
export function listContentBackups(file: string, root = BACKUP_ROOT): ContentBackup[] {
  const dir = folder(root, file);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .flatMap((name) => {
      const at = parse(name);
      return at === null ? [] : [{ name, at, size: statSync(join(dir, name)).size }];
    })
    .sort((a, b) => b.at - a.at || (a.name < b.name ? 1 : -1));
}

/**
 * Keeps `text` (the file as it is now) before it is overwritten. Same content as the newest backup gives no new copy.
 * Throws when the copy cannot be written: the caller must then refuse the save.
 */
export function backupBeforeWrite(file: string, text: string, now: number, root = BACKUP_ROOT): string | null {
  const dir = folder(root, file);
  mkdirSync(dir, { recursive: true });
  const [newest] = listContentBackups(file, root);
  if (newest && readFileSync(join(dir, newest.name), 'utf8') === text) return null;
  let at = now;
  while (existsSync(join(dir, `${stampOf(at)}.json`))) at += 1; // two saves in one millisecond
  const name = `${stampOf(at)}.json`;
  writeFileSync(join(dir, name), text);
  for (const old of listContentBackups(file, root).slice(KEEP)) unlinkSync(join(dir, old.name));
  return name;
}

export function readContentBackup(file: string, name: string, root = BACKUP_ROOT): string {
  if (!NAME.test(name)) throw new Error(`invalid backup name: ${name}`);
  return readFileSync(join(folder(root, file), name), 'utf8');
}
