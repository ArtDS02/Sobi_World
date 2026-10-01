// Settings (spec §9.3, §10.4, §12): sound and motion toggles, export / import / open the save
// folder, backups with restore, credits and version.
import type { SettingKey } from '../../core/actions/setSetting';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { SettingsVm } from '../settingsVm';

export interface SettingsHandlers {
  exportSave(): void;
  importSave(): void;
  /** Null where the platform has no save folder (browser build). */
  openSaveFolder: (() => void) | null;
  /** Flips musicOn / sfxOn / reduceMotion in the save. */
  toggle(key: SettingKey, value: boolean): void;
  /** Restore one backup (after a confirmation). */
  restore(name: string, label: string): void;
}

const TOGGLES: [SettingKey, string][] = [
  ['musicOn', vi.settings.music],
  ['sfxOn', vi.settings.sfx],
  ['reduceMotion', vi.settings.reduceMotion],
];

const button = (text: string, onClick: () => void, variant = '') =>
  el('button', {
    class: `c-button ${variant}`.trim(),
    text,
    attrs: { type: 'button' },
    on: { click: onClick },
  });

const section = (title: string, ...children: (HTMLElement | null)[]) =>
  el(
    'section',
    { class: 'settings__section' },
    el('h3', { class: 'settings__heading', text: title }),
    ...children,
  );

function toggle(
  settings: SaveGame['settings'],
  key: SettingKey,
  label: string,
  h: SettingsHandlers,
) {
  const on = settings[key];
  return el(
    'div',
    { class: 'settings__toggle' },
    el('span', { class: 'settings__label', text: label }),
    el('button', {
      class: `c-button${on ? '' : ' c-button--ghost'}`,
      text: on ? vi.settings.on : vi.settings.off,
      attrs: { type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': label },
      on: { click: () => h.toggle(key, !on) },
    }),
  );
}

export function renderSettingsScreen(
  save: SaveGame,
  vm: SettingsVm,
  h: SettingsHandlers,
): HTMLElement {
  return el(
    'section',
    { class: 'settings', data: { screen: 'settings' } },
    el('h2', { class: 'settings__title', text: vi.settings.title }),
    section(
      vi.settings.sound,
      ...TOGGLES.map(([key, label]) => toggle(save.settings, key, label, h)),
    ),
    section(
      vi.settings.saveFile,
      el('p', { class: 'settings__hint', text: vm.lastExport }),
      el(
        'div',
        { class: 'settings__actions' },
        button(vi.settings.export, h.exportSave),
        button(vi.settings.import, h.importSave, 'c-button--ghost'),
        h.openSaveFolder
          ? button(vi.settings.openSaveFolder, h.openSaveFolder, 'c-button--ghost')
          : null,
      ),
      el('p', { class: 'settings__hint', text: vi.settings.saveFolderHint }),
    ),
    section(
      vi.settings.backups,
      vm.backupsNote ? el('p', { class: 'c-empty', text: vm.backupsNote }) : null,
      vm.backups.length > 0
        ? el(
            'ul',
            { class: 'settings__backups' },
            ...vm.backups.map((b) =>
              el(
                'li',
                { class: 'settings__backup' },
                el('span', { text: b.label }),
                button(
                  vi.settings.restoreBackup,
                  () => h.restore(b.name, b.label),
                  'c-button--ghost',
                ),
              ),
            ),
          )
        : null,
    ),
    section(
      vi.settings.credits,
      el('p', { class: 'settings__hint', text: vi.settings.about }),
      el('ul', { class: 'settings__credits' }, ...vm.credits.map((c) => el('li', { text: c }))),
      el('p', { class: 'settings__version', text: vm.version }),
    ),
  );
}
