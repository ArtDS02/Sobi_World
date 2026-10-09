// The key settings section (spec §4): one row per control, two key slots each; pressing a slot waits for
// the next key. Drawn from the view the controller gives; the controller does the work.
import { CONTROLS, KEY_SLOTS, keyLabel } from '../../core/settings/keys';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { KeySettings } from '../world/keySettings';

export function renderKeySettings(ctl: KeySettings): HTMLElement {
  const view = ctl.view();
  const slotButton = (control: (typeof CONTROLS)[number], slot: number) => {
    const code = view.keys[control][slot];
    const waiting = view.listening?.control === control && view.listening.slot === slot;
    return el('button', {
      class: `c-button c-button--ghost keys__slot${waiting ? ' is-listening' : ''}`,
      text: waiting ? vi.keys.press : code ? keyLabel(code) : vi.keys.empty,
      attrs: {
        type: 'button',
        'aria-label': `${vi.controls[control]}: ${slot === 0 ? vi.keys.primary : vi.keys.secondary}`,
        'aria-pressed': String(waiting),
      },
      on: { click: () => (waiting ? ctl.cancel() : ctl.listen(control, slot)) },
    });
  };
  const clearButton = (control: (typeof CONTROLS)[number]) => {
    const slot = view.keys[control][1] !== null ? 1 : -1;
    return el('button', {
      class: 'c-button c-button--ghost keys__clear',
      text: vi.keys.clear,
      attrs: { type: 'button', ...(slot < 0 ? { disabled: 'true' } : {}) },
      on: { click: () => ctl.clear(control, slot) },
    });
  };
  return el(
    'section',
    { class: 'settings__section keys', data: { section: 'keys' } },
    el('h3', { class: 'settings__heading', text: vi.keys.title }),
    el('p', { class: 'settings__hint', text: vi.keys.hint }),
    el(
      'div',
      { class: 'keys__grid' },
      ...CONTROLS.flatMap((control) => [
        el('span', { class: 'settings__label', text: vi.controls[control] }),
        ...Array.from({ length: KEY_SLOTS }, (_, slot) => slotButton(control, slot)),
        clearButton(control),
      ]),
    ),
    view.listening ? el('p', { class: 'settings__hint', text: vi.keys.cancelHint }) : null,
    view.message ? el('p', { class: 'keys__message', text: view.message, attrs: { role: 'alert' } }) : null,
    view.saveError ? el('p', { class: 'keys__message', text: vi.keys.saveError, attrs: { role: 'alert' } }) : null,
    el('div', { class: 'settings__actions' }, el('button', {
      class: 'c-button c-button--ghost',
      text: vi.keys.reset,
      attrs: { type: 'button' },
      on: { click: () => ctl.reset() },
    })),
  );
}
