// Full-screen states before the farm can be shown: loading, recovery (§9.2), save too new.
import type { StoreStatus } from '../../store/gameStore';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { SettingsVm } from '../settingsVm';

export interface RecoveryHandlers {
  restore(name: string, label: string): void;
  /** Null where the platform cannot open a file. */
  importSave: (() => void) | null;
  /** Asks for confirmation first. */
  startNew(): void;
}

export function renderStatusScreen(
  status: Exclude<StoreStatus, 'ready' | 'recovery'>,
): HTMLElement {
  if (status === 'loading') {
    return el('p', { class: 'c-status', text: vi.app.loading, attrs: { role: 'status' } });
  }
  return el('p', { class: 'c-status', text: vi.error.SAVE_TOO_NEW, attrs: { role: 'alert' } });
}

/** §9.2: every copy failed — pick a backup, import a file, or start new (confirmed). */
export function renderRecoveryScreen(
  backups: Pick<SettingsVm, 'backups' | 'backupsNote'>,
  h: RecoveryHandlers,
): HTMLElement {
  const button = (text: string, onClick: () => void, variant = '') =>
    el('button', {
      class: `c-button ${variant}`.trim(),
      text,
      attrs: { type: 'button' },
      on: { click: onClick },
    });
  return el(
    'div',
    { class: 'c-status', attrs: { role: 'alert' } },
    el('h2', { class: 'c-status__title', text: vi.recovery.title }),
    el('p', { text: vi.recovery.body }),
    el('h3', { class: 'c-status__heading', text: vi.recovery.pickBackup }),
    backups.backupsNote ? el('p', { class: 'c-empty', text: backups.backupsNote }) : null,
    el(
      'ul',
      { class: 'c-status__list' },
      ...backups.backups.map((b) =>
        el(
          'li',
          { class: 'c-status__row' },
          el('span', { text: b.label }),
          button(vi.settings.restoreBackup, () => h.restore(b.name, b.label), 'c-button--ghost'),
        ),
      ),
    ),
    el(
      'div',
      { class: 'c-status__actions' },
      h.importSave ? button(vi.recovery.importSave, h.importSave) : null,
      button(vi.recovery.startNew, h.startNew, 'c-button--warn'),
    ),
  );
}

/** Banner for a read-only second tab (§9.4). */
export function renderMultiTabBanner(): HTMLElement {
  return el(
    'div',
    { class: 'c-banner', attrs: { role: 'alert' } },
    el('strong', { text: vi.multiTab.title }),
    el('span', { text: vi.multiTab.body }),
    el('button', {
      class: 'c-button',
      text: vi.multiTab.reload,
      attrs: { type: 'button' },
      on: { click: () => globalThis.location.reload() },
    }),
  );
}

/** Persistent banner while a write is failing (§9.2); the store keeps retrying. */
export function renderSaveErrorBanner(): HTMLElement {
  return el(
    'div',
    { class: 'c-banner', attrs: { role: 'status' } },
    el('span', { text: vi.saveStatus.error }),
  );
}

/** §11.4: the manifest failed to load or validate; shows the validation message. */
export function renderManifestError(message: string): HTMLElement {
  return el(
    'div',
    { class: 'c-status', attrs: { role: 'alert' } },
    el('h2', { class: 'c-status__title', text: vi.desktop.manifestError }),
    el('pre', { class: 'c-status__detail', text: message }),
  );
}
