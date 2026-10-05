// Where each run mode keeps its data (spec §12, ARCHITECTURE §9). One place, read by the Electron
// main process, the `npm run dev` save API and the admin dashboard:
//   installed game                               → %APPDATA%\SobiWorld\saves\
//   npm run dev + npm run dev:desktop (one farm)  → %APPDATA%\SobiWorld Dev\saves\
// Sobi Farm kept its saves in "Un In Homemade[ Dev]"; the first run of Sobi World copies them over
// (adoptLegacySaves) and never deletes the old folder.
import { constants } from 'node:fs';
import * as fsp from 'node:fs/promises';
import { join } from 'node:path';

export const DATA_DIR_NAME = { installed: 'SobiWorld', dev: 'SobiWorld Dev' } as const;
/** Sobi Farm's folders (AM-2): read once, to carry the player's farm over. */
export const LEGACY_DATA_DIR_NAME = { installed: 'Un In Homemade', dev: 'Un In Homemade Dev' } as const;

/** userData of an unpackaged run; `override` = UNIN_USER_DATA (e2e smoke test, copies). */
export const devUserDataDir = (appData: string, override?: string | null) =>
  override || join(appData, DATA_DIR_NAME.dev);

const exists = (path: string) =>
  fsp.access(path, constants.F_OK).then(
    () => true,
    () => false,
  );

/**
 * First run of Sobi World: when `toUserData` has no saves/save.json but `fromUserData` (Sobi Farm)
 * has one, copies its whole saves/ folder (save + backups). The save is migrated on load like any
 * older save. Never overwrites, never deletes. Resolves true when it copied.
 */
export async function adoptLegacySaves(fromUserData: string, toUserData: string): Promise<boolean> {
  const from = join(fromUserData, 'saves');
  const to = join(toUserData, 'saves');
  if (await exists(join(to, 'save.json'))) return false;
  if (!(await exists(join(from, 'save.json')))) return false;
  await fsp.mkdir(to, { recursive: true });
  await fsp.cp(from, to, { recursive: true, force: false, errorOnExist: false });
  return true;
}
