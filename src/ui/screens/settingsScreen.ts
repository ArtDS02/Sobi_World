// Minimal settings screen (R02): export / import / open save folder. Full screen in R11 (§10.1).
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface SettingsHandlers {
  exportSave(): void;
  importSave(): void;
  /** Null where the platform has no save folder (browser build). */
  openSaveFolder: (() => void) | null;
}

const button = (text: string, onClick: () => void) =>
  el('button', { class: 'c-button', text, attrs: { type: 'button' }, on: { click: onClick } });

export function renderSettingsScreen(h: SettingsHandlers): HTMLElement {
  return el(
    'section',
    { class: 'settings', data: { screen: 'settings' } },
    el('h2', { class: 'settings__title', text: vi.settings.title }),
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
