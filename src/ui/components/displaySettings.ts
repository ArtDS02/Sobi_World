// The accessibility and language sections of the settings screen (GĐ13): text size, easy-to-see colors,
// screen shake and language. The choices live in settings.json (core/settings) and apply to every Area.
import { COLOR_MODES, LANGUAGE_IDS, TEXT_SIZES, type DisplayPrefs } from '../../core/settings/settings';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface DisplayChoice {
  current(): DisplayPrefs;
  choose<K extends keyof DisplayPrefs>(key: K, value: DisplayPrefs[K]): void;
  /** The last write of settings.json failed (the change still holds until the game closes). */
  saveFailed(): boolean;
  subscribe(fn: () => void): () => void;
}

function options<T extends string>(
  label: string,
  ids: readonly T[],
  names: Record<T, string>,
  current: T,
  pick: (id: T) => void,
  key: string,
): HTMLElement {
  return el(
    'div',
    { class: 'settings__toggle', data: { setting: key } },
    el('span', { class: 'settings__label', text: label }),
    el(
      'div',
      { class: 'settings__choices', attrs: { role: 'radiogroup', 'aria-label': label } },
      ...ids.map((id) =>
        el('button', {
          class: `c-button${id === current ? '' : ' c-button--ghost'}`,
          text: names[id],
          attrs: { type: 'button', role: 'radio', 'aria-checked': String(id === current), 'data-value': id },
          on: { click: () => pick(id) },
        }),
      ),
    ),
  );
}

export function renderDisplaySettings(choice: DisplayChoice): HTMLElement[] {
  const prefs = choice.current();
  const s = vi.settings;
  const access = el(
    'section',
    { class: 'settings__section', data: { section: 'access' } },
    el('h3', { class: 'settings__heading', text: s.access }),
    options(s.textSize, TEXT_SIZES, s.textSizes, prefs.textSize, (v) => choice.choose('textSize', v), 'textSize'),
    options(s.colorMode, COLOR_MODES, s.colorModes, prefs.colorMode, (v) => choice.choose('colorMode', v), 'colorMode'),
    el(
      'div',
      { class: 'settings__toggle', data: { setting: 'screenShake' } },
      el('span', { class: 'settings__label', text: s.screenShake }),
      el('button', {
        class: `c-button${prefs.screenShake ? '' : ' c-button--ghost'}`,
        text: prefs.screenShake ? s.on : s.off,
        attrs: { type: 'button', role: 'switch', 'aria-checked': String(prefs.screenShake), 'aria-label': s.screenShake },
        on: { click: () => choice.choose('screenShake', !prefs.screenShake) },
      }),
    ),
    el('p', { class: 'settings__hint', text: s.shakeHint }),
    choice.saveFailed() ? el('p', { class: 'settings__hint settings__hint--error', text: s.settingsSaveError }) : null,
  );
  const language = el(
    'section',
    { class: 'settings__section', data: { section: 'language' } },
    el('h3', { class: 'settings__heading', text: s.language }),
    options(s.language, LANGUAGE_IDS, s.languages, prefs.language, (v) => choice.choose('language', v), 'language'),
    el('p', { class: 'settings__hint', text: s.languageHint }),
  );
  return [access, language];
}
