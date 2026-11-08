// What the settings screen's buttons do (spec §9.2, §9.3, §12): toggles through the store,
// export / import through the platform's file dialogs, backup restore after a confirmation.
import { setSetting } from '../logic/actions/setSetting';
import { exportSave } from '../../../core/save/exportImport';
import type { FileDialogs } from '../../../core/save/port';
import type { BoundAction, FarmStore } from '../store';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { openConfirmDialog, openDialog } from '../../../ui/components/dialog';
import { saveCheckLines } from './saveCheckVm';
import { pageCanvases, photoFileName, shootStage } from '../../../ui/photo';
import { openImportDialog } from './dialogs';
import type { SettingsHandlers } from './screens/settingsScreen';

export interface SettingsDeps {
  store: Pick<FarmStore, 'getSnapshot' | 'worldSave' | 'inspectSave' | 'markExported' | 'importSave' | 'restoreBackup' | 'resetGame'>;
  now: () => number;
  act: (run: BoundAction) => void;
  /** Host of modal dialogs. */
  dialogHost: HTMLElement;
  /** Platform file dialogs; absent in DOM tests. */
  files?: FileDialogs;
  /** The platform has a save folder to open (desktop). */
  saveFolder?: boolean;
  /** After a restore attempt (the backup list changes). */
  onRestored?: () => void;
}

export function settingsHandlers(d: SettingsDeps): SettingsHandlers {
  const files = d.files;
  return {
    toggle: (key, value) => d.act((s, c) => setSetting(s, { key, value }, c)),
    exportSave: () => {
      const save = d.store.worldSave();
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
    checkSave: () => {
      const found = d.store.inspectSave();
      if (!found) return;
      const dialog = openDialog(d.dialogHost, vi.settings.checkTitle, vi.action.close);
      dialog.body.append(...saveCheckLines(found));
    },
    openSaveFolder: d.saveFolder && files ? () => void files.openSaveFolder() : null,
    // D9: a PNG of the stage through the platform's save dialog (never a network call).
    takePhoto: files?.savePhoto
      ? () => void shootStage(pageCanvases()).then((png) => (png ? files.savePhoto!(png, photoFileName(new Date(d.now()))) : undefined))
      : null,
    // Two confirmations (PG-4): the second names what is lost from the game itself.
    reset: () =>
      openConfirmDialog(d.dialogHost, vi.settings.reset, vi.settings.resetWarning, async () =>
        openConfirmDialog(d.dialogHost, vi.settings.reset, vi.settings.resetConfirmAgain, () =>
          d.store.resetGame().then(() => d.onRestored?.()),
        ),
      ),
    restore: (name, label) =>
      openConfirmDialog(
        d.dialogHost,
        vi.settings.restoreBackup,
        t(vi.settings.restoreConfirm, { label }),
        () => d.store.restoreBackup(name).then(() => d.onRestored?.()),
      ),
  };
}
