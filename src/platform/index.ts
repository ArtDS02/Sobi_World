// Platform selection (spec §4.1, §13.1): desktop adapters when window.unin exists, web otherwise
// (`npm run dev`: the dev save file through the dev server, AM-1; a plain web build: IndexedDB).
import type { BackupStore, FileDialogs, InstanceGuard, SaveStorage } from '../core/save/port';
import type { SettingsStorage } from '../core/settings/port';
import type { UninBridge } from './desktop/bridge';
import { createFileSettings } from './desktop/fileSettings';
import { createDesktopFileDialogs, desktopInstanceGuard } from './desktop/fileDialogs';
import { createFileSaveStorage, type SaveParser } from './desktop/fileSaveStorage';
import { createDevFileSaveStorage, devBackups, hasDevSaveApi } from './web/devFileSaves';
import { createWebFileDialogs } from './web/fileDialogs';
import { createLocalSettings } from './web/localSettings';
import { createSaveStorage } from './web/idbSaveStorage';
import { browserChannel, createWebInstanceGuard } from './web/tabGuard';

export interface Platform {
  kind: 'desktop' | 'web';
  storage: SaveStorage;
  /** settings.json: key bindings, apart from the save (spec §4). */
  settings: SettingsStorage;
  dialogs: FileDialogs;
  instanceGuard: InstanceGuard;
  /** Desktop: main asks for a flush before the window closes (§13.1). */
  onFlushRequest(flush: () => Promise<void>): void;
  version: string | null;
  /** Desktop backups (§9.2); the browser build has none to pick from. */
  backups: BackupStore | null;
}

/** `parseSave`: JSON → migrated world save (core parseSave with this build's codec). */
export function createPlatform(parseSave: SaveParser): Platform {
  const bridge = (globalThis as { unin?: UninBridge }).unin;
  if (bridge) {
    return {
      kind: 'desktop',
      storage: createFileSaveStorage(bridge.save, parseSave),
      settings: createFileSettings(bridge.settings),
      dialogs: createDesktopFileDialogs(bridge.save),
      instanceGuard: desktopInstanceGuard,
      onFlushRequest: (flush) => bridge.app.onFlushRequest(flush),
      version: bridge.app.version,
      backups: {
        list: () => bridge.save.listBackups(),
        restore: (n) => bridge.save.restoreBackup(n),
        backupBeforeReset: () => bridge.save.backupBeforeReset(),
        backupBeforeMigration: (v) => bridge.save.backupBeforeMigration(v),
      },
    };
  }
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  // `npm run dev`: the dev save file shared with dev:desktop and the admin dashboard (AM-1).
  const devFiles = import.meta.env.DEV && hasDevSaveApi();
  return {
    kind: 'web',
    storage: devFiles
      ? createDevFileSaveStorage(createSaveStorage({ parseSave }), parseSave)
      : createSaveStorage({ parseSave }),
    settings: createLocalSettings(),
    dialogs: createWebFileDialogs(),
    instanceGuard: createWebInstanceGuard(browserChannel(), crypto.randomUUID(), sleep),
    onFlushRequest: () => {},
    version: null,
    backups: devFiles ? devBackups : null,
  };
}
