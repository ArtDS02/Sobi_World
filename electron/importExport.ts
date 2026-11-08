// Import / export file handling (B6). Pure Node, tested with a temp dir.
import * as fsp from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** A save is a few hundred KB; anything near this size is not one. */
export const IMPORT_MAX_BYTES = 64 * 1024 * 1024;

/**
 * Reads a file the player picked for import and checks it is a JSON object of a sane size BEFORE anything else
 * happens (the caller backs the current save up only after this passes, so a bad file cannot push a good backup
 * out of the rotation). The game's own validation (schema, migration) still runs in the renderer.
 */
export async function readImportFile(path: string): Promise<string> {
  const st = await fsp.stat(path);
  if (!st.isFile() || st.size > IMPORT_MAX_BYTES) throw new Error('IMPORT_REJECTED: not a file or too large');
  const text = await fsp.readFile(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('IMPORT_REJECTED: not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('IMPORT_REJECTED: not a save document');
  }
  return text;
}

/** Atomic export: temp file in the target folder, then rename, so a failed export never leaves half a file. */
export async function writeExportFile(path: string, json: string): Promise<void> {
  const tmp = join(dirname(path), `.${Date.now()}-${process.pid}.export.tmp`);
  try {
    await fsp.writeFile(tmp, json, 'utf8');
    await fsp.rename(tmp, path);
  } catch (e) {
    await fsp.rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}
