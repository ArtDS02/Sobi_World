// The hint over the world (spec §4): the name of the door under the pointer ("Vào Sobi Farm"), with its key when one
// acts. A closed door shows a padlock, its reason and conditions. Drawn from the prompt a scene reports and the current bindings.
import { keyLabel, type Control, type KeyBindings } from '../../core/settings/keys';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { WorldPrompt } from '../world/host';

export function renderWorldPrompt(prompt: WorldPrompt | null, keys: KeyBindings): HTMLElement | null {
  if (!prompt) return null;
  const code = prompt.control ? keys[prompt.control][0] : null;
  return el(
    'div',
    {
      class: `world-prompt${prompt.disabled ? ' is-closed' : ''}`,
      attrs: { role: 'status', 'aria-live': 'polite' },
      data: { prompt: prompt.control ?? (prompt.disabled ? 'closed' : 'door') },
    },
    code
      ? el('kbd', {
          class: 'world-prompt__key',
          text: keyLabel(code),
          attrs: { 'aria-label': vi.controls[prompt.control as Control] },
        })
      : prompt.disabled
        ? el('span', { class: 'world-prompt__lock', text: '🔒', attrs: { 'aria-hidden': 'true' } })
        : null,
    el(
      'div',
      { class: 'world-prompt__text' },
      el('b', { text: prompt.title }),
      ...prompt.lines.map((line) => el('span', { text: line })),
    ),
  );
}
