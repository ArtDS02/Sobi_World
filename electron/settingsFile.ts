// settings.json (spec §4): the player's key bindings, a file of their own next to the saves folder. Pure
// Node, tested with a temp dir. A write goes to a unique temp file and is renamed over the old one, so a power
// cut leaves the old file whole. Writes are queued one after another (B3) and a rename that antivirus or a
// sync tool holds open (EPERM / EBUSY / EACCES) is retried a few times, like the save files do.
import * as fsp from 'node:fs/promises';
import { dirname } from 'node:path';

export interface SettingsFile {
  /** The file's text, or null when there is none. */
  read(): Promise<string | null>;
  /** Atomic, queued write. Rejects on failure (the renderer reports it). */
  write(json: string): Promise<void>;
}

export interface SettingsFileOptions {
  rename?: (from: string, to: string) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}

const RENAME_RETRIES = 5;
const RENAME_RETRY_MS = 50;
const RETRYABLE = new Set(['EPERM', 'EBUSY', 'EACCES']);

export function createSettingsFile(path: string, opts: SettingsFileOptions = {}): SettingsFile {
  const rename = opts.rename ?? ((from: string, to: string) => fsp.rename(from, to));
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let queue: Promise<void> = Promise.resolve();
  let counter = 0;

  async function writeOnce(json: string): Promise<void> {
    await fsp.mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.${process.pid}-${(counter += 1)}.tmp`; // unique: two writes never share a temp file
    try {
      const fh = await fsp.open(tmp, 'w');
      try {
        await fh.writeFile(json, 'utf8');
        await fh.sync();
      } finally {
        await fh.close();
      }
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await rename(tmp, path);
        } catch (e) {
          const code = (e as NodeJS.ErrnoException).code ?? '';
          if (!RETRYABLE.has(code) || attempt >= RENAME_RETRIES) throw e;
          await sleep(RENAME_RETRY_MS * (attempt + 1));
        }
      }
    } catch (e) {
      await fsp.rm(tmp, { force: true }).catch(() => undefined); // never leave a half file behind
      throw e;
    }
  }

  return {
    async read() {
      try {
        return await fsp.readFile(path, 'utf8');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw e;
      }
    },
    write(json) {
      const run = queue.then(() => writeOnce(json));
      queue = run.then(() => undefined, () => undefined); // one failed write does not block the next
      return run;
    },
  };
}
