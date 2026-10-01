// Platform selection (spec §4.1). Only the web adapter exists yet; R02 adds desktop (window.unin).
import type { FileDialogs, InstanceGuard, SaveStorage } from '../core/save/port';
import { createWebFileDialogs } from './web/fileDialogs';
import { createSaveStorage } from './web/idbSaveStorage';
import { browserChannel, createWebInstanceGuard } from './web/tabGuard';

export interface Platform {
  storage: SaveStorage;
  dialogs: FileDialogs;
  instanceGuard: InstanceGuard;
}

export function createPlatform(): Platform {
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  return {
    storage: createSaveStorage(),
    dialogs: createWebFileDialogs(),
    instanceGuard: createWebInstanceGuard(browserChannel(), crypto.randomUUID(), sleep),
  };
}
