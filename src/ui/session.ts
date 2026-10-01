// Per-session UI around the farm (spec §9.2, §9.3, §9.5, §10.3): the tutorial step, the export
// reminder (once per session), the save error / recovered banner, the backup list, the away
// summary and the recovery screen. State here is never saved, except through actions.
import type { GameEvent } from '../core/events';
import { setSetting } from '../core/actions/setSetting';
import type { SaveGame } from '../core/types';
import { vi } from '../i18n/vi';
import type { BoundAction, GameStore, StoreSnapshot } from '../store/gameStore';
import { awayVm } from './awayVm';
import { openAwayDialog } from './components/awayDialog';
import { openConfirmDialog } from './components/dialog';
import { renderTutorialCard } from './components/tutorialCard';
import { el } from './dom';
import { renderRecoveryScreen } from './screens/statusScreen';
import {
  backupsVm,
  exportReminderDue,
  settingsVm,
  type BackupsState,
  type SettingsVm,
} from './settingsVm';
import type { SettingsHandlers } from './screens/settingsScreen';
import { tutorialVm } from './tutorialVm';
import type { AssetManifest } from '../core/assets/manifestSchema';

/** How long "Đã lưu lại được." stays after a failing write finally succeeds. */
const RECOVERED_NOTICE_MS = 4000;

export interface SessionDeps {
  store: Pick<GameStore, 'getSnapshot' | 'listBackups' | 'startNewGame'>;
  now: () => number;
  act: (run: BoundAction) => void;
  dialogHost: HTMLElement;
  rerender: () => void;
  settings: SettingsHandlers;
  manifest: AssetManifest | null;
  version: string | null;
  /** The platform keeps backups (desktop). */
  hasBackups: boolean;
}

export function createSession(d: SessionDeps) {
  let step = 0;
  let reminderDismissed = false;
  let backups: BackupsState = d.hasBackups ? null : undefined;
  let lastSaveError = false;
  let recoveredUntil = 0;
  let recoveryListed = false;

  const loadBackups = () => {
    if (!d.hasBackups) return;
    backups = null;
    void d.store.listBackups().then((list) => {
      backups = list;
      d.rerender();
    });
  };
  const setDone = () => d.act((s, c) => setSetting(s, { key: 'tutorialDone', value: true }, c));

  return {
    loadBackups,

    settingsVm: (save: SaveGame): SettingsVm => settingsVm(save, backups, d.manifest, d.version),

    /** §10.3: coach card while the tutorial is not done (never on a read-only instance). */
    coach(snap: StoreSnapshot): HTMLElement | null {
      if (!snap.save || snap.readOnly) return null;
      const vm = tutorialVm(snap.save, step);
      if (!vm) return null;
      return renderTutorialCard(vm, {
        next: () => {
          if (vm.last) setDone();
          else {
            step += 1;
            d.rerender();
          }
        },
        skip: setDone,
      });
    },

    /** §9.2 save banner (persistent while failing, brief "recovered"), §9.3 export reminder. */
    banners(snap: StoreSnapshot): HTMLElement | null {
      if (lastSaveError && !snap.saveError) {
        recoveredUntil = d.now() + RECOVERED_NOTICE_MS;
        setTimeout(d.rerender, RECOVERED_NOTICE_MS + 50);
      }
      lastSaveError = snap.saveError;
      if (snap.saveError) return banner(vi.saveStatus.error, 'alert');
      if (d.now() < recoveredUntil) return banner(vi.saveStatus.recovered, 'status');
      const save = snap.save;
      if (!save || snap.readOnly || reminderDismissed || !exportReminderDue(save, d.now())) {
        return null;
      }
      return el(
        'div',
        { class: 'c-banner', attrs: { role: 'status' } },
        el('span', { text: vi.settings.exportReminder }),
        button(vi.settings.export, () => {
          reminderDismissed = true;
          d.settings.exportSave();
          d.rerender();
        }),
        button(
          vi.action.close,
          () => {
            reminderDismissed = true;
            d.rerender();
          },
          'c-button--ghost',
        ),
      );
    },

    /** §9.5: one summary modal for a long catch-up. */
    showAway(events: GameEvent[], awayMs: number) {
      const save = d.store.getSnapshot().save;
      if (save) openAwayDialog(d.dialogHost, awayVm(events, save, d.now(), awayMs));
    },

    recovery(): HTMLElement {
      if (!recoveryListed) {
        recoveryListed = true;
        loadBackups();
      }
      return renderRecoveryScreen(backupsVm(backups), {
        restore: d.settings.restore,
        importSave: d.settings.importSave,
        startNew: () =>
          openConfirmDialog(d.dialogHost, vi.recovery.startNew, vi.recovery.startNewWarning, () =>
            d.store.startNewGame(),
          ),
      });
    },
  };
}

const button = (text: string, onClick: () => void, variant = '') =>
  el('button', {
    class: `c-button ${variant}`.trim(),
    text,
    attrs: { type: 'button' },
    on: { click: onClick },
  });

const banner = (text: string, role: 'alert' | 'status') =>
  el('div', { class: 'c-banner', attrs: { role } }, el('span', { text }));

export type Session = ReturnType<typeof createSession>;
