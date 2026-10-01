// Native export/import dialogs and the save folder (spec §9.3), all through window.unin.
import type { FileDialogs, InstanceGuard } from '../../core/save/port';
import type { UninBridge } from './bridge';

export function createDesktopFileDialogs(bridge: UninBridge['save']): FileDialogs {
  return {
    exportSave: (json, suggestedName) => bridge.exportTo(json, suggestedName),
    importSave: () => bridge.importFrom(),
    openSaveFolder: () => bridge.openFolder(),
  };
}

/** Main holds the single-instance lock (§9.4), so the renderer always owns the save. */
export const desktopInstanceGuard: InstanceGuard = {
  start: async () => true,
  isReadOnly: () => false,
  close: () => {},
};
