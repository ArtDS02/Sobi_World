// Desktop save files (spec §9.1, §9.2, R00-4). Pure Node: no Electron import, tested with a temp dir.
// Main never validates a save: it hands JSON strings to the renderer, which runs core's parseSave.
import { constants } from 'node:fs';
import * as fsp from 'node:fs/promises';
import { join } from 'node:path';
import type {
  BackupInfo,
  SaveCandidate,
  SaveCandidateSource,
} from '../src/platform/desktop/bridge';

export const BACKUP_KEEP = 10;
export const BACKUP_SPACING_MS = 15 * 60 * 1000;
const RENAME_RETRIES = 5;
const RENAME_RETRY_MS = 50;
const BACKUP_NAME = /^save-(\d{8})-(\d{6})(?:-(\d+))?\.json$/;

/** The fs calls a write goes through; tests replace one to simulate a crash or a locked file. */
export interface FsOps {
  writeFile(path: string, data: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
}

const realFs: FsOps = {
  async writeFile(path, data) {
    const fh = await fsp.open(path, 'w');
    try {
      await fh.writeFile(data, 'utf8');
      await fh.sync(); // flush to disk before the rename makes it the current save
    } finally {
      await fh.close();
    }
  },
  rename: (from, to) => fsp.rename(from, to),
};

export interface SaveFilesOptions {
  /** The saves/ directory. */
  dir: string;
  now: () => number;
  fs?: Partial<FsOps>;
  sleep?: (ms: number) => Promise<void>;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** YYYYMMDD-HHmmss in local time. */
export function stamp(at: number): string {
  const d = new Date(at);
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function parseBackupName(name: string): { at: number; seq: number } | null {
  const m = BACKUP_NAME.exec(name);
  if (!m) return null;
  const [, date, time, seq] = m as unknown as [string, string, string, string | undefined];
  const at = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)) - 1,
    Number(date.slice(6, 8)),
    Number(time.slice(0, 2)),
    Number(time.slice(2, 4)),
    Number(time.slice(4, 6)),
  ).getTime();
  return { at, seq: seq === undefined ? 0 : Number(seq) };
}

const exists = (path: string) =>
  fsp.access(path, constants.F_OK).then(
    () => true,
    () => false,
  );

const isRetryable = (e: unknown) =>
  typeof e === 'object' &&
  e !== null &&
  ['EPERM', 'EBUSY', 'EACCES'].includes((e as { code?: string }).code ?? '');

export function createSaveFiles(opts: SaveFilesOptions) {
  const fs: FsOps = { ...realFs, ...opts.fs };
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const dir = opts.dir;
  const backupsDir = join(dir, 'backups');
  const savePath = join(dir, 'save.json');
  const tmpPath = join(dir, 'save.json.tmp');
  let wroteThisSession = false;
  let lastBackupAt: number | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  /** Serializes every mutation so two writes never interleave. */
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };

  async function listBackups(): Promise<BackupInfo[]> {
    let names: string[];
    try {
      names = await fsp.readdir(backupsDir);
    } catch {
      return [];
    }
    return names
      .map((name) => ({ name, parsed: parseBackupName(name) }))
      .filter((b) => b.parsed !== null)
      .sort((a, b) => b.parsed!.at - a.parsed!.at || b.parsed!.seq - a.parsed!.seq)
      .map(({ name, parsed }) => ({ name, at: parsed!.at }));
  }

  /** A free name `<prefix><stamp>[-n].json` in `folder`. */
  async function freeName(folder: string, prefix: string): Promise<string> {
    const base = `${prefix}${stamp(opts.now())}`;
    for (let n = 0; ; n++) {
      const name = n === 0 ? `${base}.json` : `${base}-${n}.json`;
      if (!(await exists(join(folder, name)))) return name;
    }
  }

  async function renameWithRetry(from: string, to: string) {
    for (let attempt = 0; ; attempt++) {
      try {
        await fs.rename(from, to);
        return;
      } catch (e) {
        // Windows: antivirus or a sync client may hold the file for a moment.
        if (!isRetryable(e) || attempt >= RENAME_RETRIES) throw e;
        await sleep(RENAME_RETRY_MS * (attempt + 1));
      }
    }
  }

  /** Copies the current save.json into backups/ and drops the oldest beyond BACKUP_KEEP. */
  async function backupCurrent(): Promise<void> {
    if (!(await exists(savePath))) return;
    await fsp.mkdir(backupsDir, { recursive: true });
    await fsp.copyFile(savePath, join(backupsDir, await freeName(backupsDir, 'save-')));
    lastBackupAt = opts.now();
    const all = await listBackups();
    for (const old of all.slice(BACKUP_KEEP)) await fsp.unlink(join(backupsDir, old.name));
  }

  async function atomicWrite(json: string) {
    await fsp.mkdir(dir, { recursive: true });
    await fs.writeFile(tmpPath, json);
    await renameWithRetry(tmpPath, savePath);
  }

  function sourcePath(source: SaveCandidateSource): string {
    if (source === 'save') return savePath;
    const name = source.slice('backup:'.length);
    if (!BACKUP_NAME.test(name)) throw new Error(`invalid backup source: ${source}`);
    return join(backupsDir, name);
  }

  return {
    savePath,
    listBackups,

    /** save.json first, then backups newest first. Unreadable files are skipped, never deleted. */
    async readCandidates(): Promise<SaveCandidate[]> {
      const out: SaveCandidate[] = [];
      const read = async (source: SaveCandidateSource) => {
        try {
          out.push({ source, json: await fsp.readFile(sourcePath(source), 'utf8') });
        } catch {
          // missing or unreadable: the next candidate is tried
        }
      };
      await read('save');
      for (const b of await listBackups()) await read(`backup:${b.name}`);
      return out;
    },

    /** Backup (first write of the session, then at most every 15 min), then atomic replace. */
    write(json: string): Promise<void> {
      return serial(async () => {
        const due =
          !wroteThisSession ||
          lastBackupAt === null ||
          opts.now() - lastBackupAt >= BACKUP_SPACING_MS;
        if (due) await backupCurrent();
        await atomicWrite(json);
        wroteThisSession = true;
        lastBackupAt ??= opts.now();
      });
    },

    /** Renames a file that failed to parse to saves/save.corrupt-YYYYMMDD-HHmmss.json. */
    markCorrupt(source: SaveCandidateSource): Promise<void> {
      return serial(async () => {
        const from = sourcePath(source);
        if (!(await exists(from))) return;
        await renameWithRetry(from, join(dir, await freeName(dir, 'save.corrupt-')));
      });
    },

    /** Backs up the current save now (before an import overwrites it, §9.3). */
    backupNow: () => serial(backupCurrent),

    /** Resolves when every queued write has finished (quit waits on it). */
    idle: () => queue.then(() => undefined),

    restoreBackup(name: string): Promise<void> {
      return serial(async () => {
        const json = await fsp.readFile(sourcePath(`backup:${name}`), 'utf8');
        await backupCurrent();
        await atomicWrite(json);
        wroteThisSession = true;
      });
    },

    /** Writes an export to a path the player chose in the native dialog. */
    exportTo: (path: string, json: string) => fsp.writeFile(path, json, 'utf8'),

    readExternal: (path: string) => fsp.readFile(path, 'utf8'),
  };
}

export type SaveFiles = ReturnType<typeof createSaveFiles>;
