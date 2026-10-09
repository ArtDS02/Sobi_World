// settings.json (spec §4): the player's key bindings, a file of their own next to the saves folder. Pure
// Node, tested with a temp dir. A write goes to a temp file and is renamed over the old one, so a power
// cut leaves the old file whole.
import * as fsp from 'node:fs/promises';
import { dirname } from 'node:path';

export interface SettingsFile {
  /** The file's text, or null when there is none. */
  read(): Promise<string | null>;
  /** Atomic write. Rejects on failure (the renderer reports it). */
  write(json: string): Promise<void>;
}

export function createSettingsFile(path: string): SettingsFile {
  return {
    async read() {
      try {
        return await fsp.readFile(path, 'utf8');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw e;
      }
    },
    async write(json) {
      await fsp.mkdir(dirname(path), { recursive: true });
      const tmp = `${path}.tmp`;
      const fh = await fsp.open(tmp, 'w');
      try {
        await fh.writeFile(json, 'utf8');
        await fh.sync();
      } finally {
        await fh.close();
      }
      await fsp.rename(tmp, path);
    },
  };
}
