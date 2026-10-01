// What the settings screen's buttons do (spec §9.3, §12): sound toggles through the store,
// export / import through the platform's file dialogs.
import { setSetting } from '../core/actions/setSetting';
import { exportSave } from '../core/save/exportImport';
import type { FileDialogs } from '../core/save/port';
import type { BoundAction, GameStore } from '../store/gameStore';
import { openImportDialog } from './dialogs';
import type { SettingsHandlers } from './screens/settingsScreen';

export interface SettingsDeps {
  store: Pick<GameStore, 'getSnapshot' | 'markExported' | 'importSave'>;
  now: () => number;
  act: (run: BoundAction) => void;
  /** Host of modal dialogs. */
  dialogHost: HTMLElement;
  /** Platform file dialogs; absent in DOM tests. */
  files?: FileDialogs;
  /** The platform has a save folder to open (desktop). */
  saveFolder?: boolean;
}

export function settingsHandlers(d: SettingsDeps): SettingsHandlers {
  const files = d.files;
  return {
    toggle: (key, value) => d.act((s, c) => setSetting(s, { key, value }, c)),
    exportSave: () => {
      const save = d.store.getSnapshot().save;
      if (!save || !files) return;
      const at = d.now();
      const out = exportSave(save, new Date(at));
      void files.exportSave(out.json, out.fileName).then((ok) => {
        if (ok) void d.store.markExported(at);
      });
    },
    importSave: () => {
      if (!files) return;
      openImportDialog(d.dialogHost, async () => {
        const json = await files.importSave();
        if (json === null) return;
        await d.store.importSave(json); // a rejection is toasted by the FeedbackDirector
      });
    },
    openSaveFolder: d.saveFolder && files ? () => void files.openSaveFolder() : null,
  };
}
