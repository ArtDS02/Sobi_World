// Local error log (A2): logs/error.log under userData, rotated by size. Node only; the renderer reaches it
// through the `unin:log:error` IPC. Never throws: a broken log must not break the app.
import * as fsp from 'node:fs/promises';
import { join } from 'node:path';

export interface ErrorLog {
  /** Appends one line `ISO-time [where] message`; resolves when written (or silently failed). */
  log(where: string, message: string): Promise<void>;
  /** Resolves when every queued line is written. */
  idle(): Promise<void>;
}

export interface ErrorLogOptions {
  dir: string;
  now: () => number;
  /** Rotate when the file would grow past this many bytes. */
  maxBytes?: number;
  /** Rotated files kept (error.1.log … error.N.log). */
  keep?: number;
}

const MAX_LINE = 4000;

export function createErrorLog({ dir, now, maxBytes = 256 * 1024, keep = 2 }: ErrorLogOptions): ErrorLog {
  const file = join(dir, 'error.log');
  const rotated = (n: number) => join(dir, `error.${n}.log`);
  let queue: Promise<void> = Promise.resolve();

  async function rotate() {
    await fsp.rm(rotated(keep), { force: true });
    for (let n = keep - 1; n >= 1; n--) await fsp.rename(rotated(n), rotated(n + 1)).catch(() => undefined);
    await fsp.rename(file, rotated(1));
  }

  async function write(line: string) {
    try {
      await fsp.mkdir(dir, { recursive: true });
      const size = await fsp.stat(file).then((s) => s.size, () => 0);
      if (size > 0 && size + Buffer.byteLength(line) > maxBytes) await rotate();
      await fsp.appendFile(file, line, 'utf8');
    } catch {
      /* the log is best effort */
    }
  }

  return {
    log(where, message) {
      const flat = message.replace(/\r?\n/g, '\n  ').slice(0, MAX_LINE);
      const line = `${new Date(now()).toISOString()} [${where}] ${flat}\n`;
      queue = queue.then(() => write(line));
      return queue;
    },
    idle: () => queue,
  };
}
