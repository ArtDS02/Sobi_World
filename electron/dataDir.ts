// Where each run mode keeps its data (spec §9.1, DECISIONS AM-1). One place, read by the Electron
// main process, the `npm run dev` save API and the admin dashboard:
//   installed game (SobiFarm.exe)                → %APPDATA%\Un In Homemade\saves\
//   npm run dev + npm run dev:desktop (one farm)  → %APPDATA%\Un In Homemade Dev\saves\
// The folders keep the pre-rebrand name on purpose (AM-2, game now "Sobi Farm"): players' saves live
// there, and renaming would make an update start a new farm.
import { join } from 'node:path';

export const DATA_DIR_NAME = { installed: 'Un In Homemade', dev: 'Un In Homemade Dev' } as const;

/** userData of an unpackaged run; `override` = UNIN_USER_DATA (e2e smoke test, copies). */
export const devUserDataDir = (appData: string, override?: string | null) =>
  override || join(appData, DATA_DIR_NAME.dev);
