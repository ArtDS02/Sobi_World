// Settings screen: sound toggles (R10, §12) and export / import / open save folder (R02).
// Full screen in R11 (§10.1).
import type { SettingKey } from '../../core/actions/setSetting';
import type { SaveGame } from '../../core/types';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface SettingsHandlers {
  exportSave(): void;
  importSave(): void;
  /** Null where the platform has no save folder (browser build). */
  openSaveFolder: (() => void) | null;
  /** Flips musicOn / sfxOn in the save. */
  toggle(key: SettingKey, value: boolean): void;
}

const TOGGLES: [SettingKey, string][] = [
  ['musicOn', vi.settings.music],
  ['sfxOn', vi.settings.sfx],
];

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

const button = (text: string, onClick: () => void) =>
  el('button', { class: 'c-button', text, attrs: { type: 'button' }, on: { click: onClick } });

export function renderSettingsScreen(save: SaveGame, h: SettingsHandlers): HTMLElement {
  return el(
    'section',
    { class: 'settings', data: { screen: 'settings' } },
    el('h2', { class: 'settings__title', text: vi.settings.title }),
    el(
      'div',
      { class: 'settings__toggles' },
      ...TOGGLES.map(([key, label]) => toggle(save.settings, key, label, h)),
    ),
    el(
      'div',
      { class: 'settings__actions' },
      button(vi.settings.export, h.exportSave),
      button(vi.settings.import, h.importSave),
      h.openSaveFolder ? button(vi.settings.openSaveFolder, h.openSaveFolder) : null,
    ),
    el('p', { class: 'settings__hint', text: vi.settings.saveFolderHint }),
  );
}
