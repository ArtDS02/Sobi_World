// Platform selection (spec §4.1, §13.1): desktop adapters when window.unin exists, web otherwise.
import type { FileDialogs, InstanceGuard, SaveStorage } from '../core/save/port';
import type { UninBridge } from './desktop/bridge';
import { createDesktopFileDialogs, desktopInstanceGuard } from './desktop/fileDialogs';
import { createFileSaveStorage } from './desktop/fileSaveStorage';
import { createWebFileDialogs } from './web/fileDialogs';
import { createSaveStorage } from './web/idbSaveStorage';
import { browserChannel, createWebInstanceGuard } from './web/tabGuard';

export interface Platform {
  kind: 'desktop' | 'web';
  storage: SaveStorage;
  dialogs: FileDialogs;
  instanceGuard: InstanceGuard;
  /** Desktop: main asks for a flush before the window closes (§13.1). */
  onFlushRequest(flush: () => Promise<void>): void;
  version: string | null;
}

export function createPlatform(): Platform {
  const bridge = (globalThis as { unin?: UninBridge }).unin;
  if (bridge) {
    return {
      kind: 'desktop',
      storage: createFileSaveStorage(bridge.save),
      dialogs: createDesktopFileDialogs(bridge.save),
      instanceGuard: desktopInstanceGuard,
      onFlushRequest: (flush) => bridge.app.onFlushRequest(flush),
      version: bridge.app.version,
    };
  }
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  return {
    kind: 'web',
    storage: createSaveStorage(),
    dialogs: createWebFileDialogs(),
    instanceGuard: createWebInstanceGuard(browserChannel(), crypto.randomUUID(), sleep),
    onFlushRequest: () => {},
    version: null,
  };
}
