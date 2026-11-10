// Settings (spec §9.3, §10.4, §12): sound and motion toggles, export / import / open the save
// folder, backups with restore, credits and version.
import { EFFECTS_VALUES, type SettingKey } from '../../logic/actions/setSetting';
import type { FarmGame } from '../../logic/types';
import { vi } from '../../../../i18n/vi';
import { renderDisplaySettings, type DisplayChoice } from '../../../../ui/components/displaySettings';
import { renderKeySettings } from '../../../../ui/components/keySettingsView';
import { el } from '../../../../ui/dom';
import type { KeySettings } from '../../../../ui/world/keySettings';
import type { SettingsVm } from '../settingsVm';

export interface SettingsHandlers {
  exportSave(): void;
  importSave(): void;
  /** Null where the platform has no save folder (browser build). */
  openSaveFolder: (() => void) | null;
  /** Photo album (D9): saves a PNG of the stage; null where the platform cannot. */
  takePhoto: (() => void) | null;
  /** Flips musicOn / sfxOn / reduceMotion in the save. */
  toggle(key: SettingKey, value: boolean): void;
  /** Effects intensity (decision 057, B8). */
  setEffects(value: EffectsValue): void;
  /** Restore one backup (after a confirmation). */
  restore(name: string, label: string): void;
  /** D1: reads the save like loading does and shows what it found. */
  checkSave(): void;
  /** Start a new farm (after two confirmations, PG-4). */
  reset(): void;
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
  settings: FarmGame['settings'],
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

type EffectsValue = (typeof EFFECTS_VALUES)[number];

/** Off / Light / Full: one radio group, the arrow keys move inside it like any radio group. */
function effectsChoice(current: EffectsValue, h: SettingsHandlers): HTMLElement[] {
  const s = vi.settings;
  const group = el(
    'div',
    { class: 'settings__choices', attrs: { role: 'radiogroup', 'aria-label': s.effects, 'aria-describedby': 'settings-effects-hint' } },
    ...EFFECTS_VALUES.map((id) =>
      el('button', {
        class: `c-button${id === current ? '' : ' c-button--ghost'}`,
        text: s.effectsModes[id],
        attrs: { type: 'button', role: 'radio', 'aria-checked': String(id === current), tabindex: id === current ? '0' : '-1', 'data-value': id },
        on: { click: () => id !== current && h.setEffects(id) },
      }),
    ),
  );
  group.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = EFFECTS_VALUES[(EFFECTS_VALUES.indexOf(current) + step + EFFECTS_VALUES.length) % EFFECTS_VALUES.length]!;
    h.setEffects(next);
  });
  return [
    el('div', { class: 'settings__toggle', data: { setting: 'effects' } }, el('span', { class: 'settings__label', text: s.effects }), group),
    el('p', { class: 'settings__hint', text: s.effectsHint, attrs: { id: 'settings-effects-hint' } }),
  ];
}

export function renderSettingsScreen(
  save: FarmGame,
  vm: SettingsVm,
  h: SettingsHandlers,
  keys?: KeySettings,
  display?: DisplayChoice,
): HTMLElement {
  return el(
    'section',
    { class: 'settings', data: { screen: 'settings' } },
    section(
      vi.settings.sound,
      ...TOGGLES.map(([key, label]) => toggle(save.settings, key, label, h)),
      ...effectsChoice(save.settings.effects, h),
    ),
    ...(display ? renderDisplaySettings(display) : []),
    keys ? renderKeySettings(keys) : null,
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
    h.takePhoto
      ? section(vi.settings.album, el('p', { class: 'settings__hint', text: vi.settings.albumHint }), el('div', { class: 'settings__actions' }, button(vi.settings.takePhoto, h.takePhoto)))
      : null,
    section(
      vi.settings.backups,
      vm.backupsNote ? el('p', { class: 'c-empty', text: vm.backupsNote }) : null,
      vm.backupWarning ? el('p', { class: 'c-banner', attrs: { role: 'status' }, text: vm.backupWarning }) : null,
      el('p', { class: 'settings__hint', text: vi.settings.checkSaveHint }),
      el('div', { class: 'settings__actions' }, button(vi.settings.checkSave, h.checkSave, 'c-button--ghost')),
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
      vi.settings.reset,
      el('p', { class: 'settings__hint', text: vi.settings.resetHint }),
      el(
        'div',
        { class: 'settings__actions' },
        button(vi.settings.reset, h.reset, 'c-button--danger'),
      ),
    ),
    section(
      vi.settings.credits,
      el('p', { class: 'settings__hint', text: vi.settings.about }),
      el('ul', { class: 'settings__credits' }, ...vm.credits.map((c) => el('li', { text: c }))),
      el('p', { class: 'settings__version', text: vm.version }),
    ),
  );
}
