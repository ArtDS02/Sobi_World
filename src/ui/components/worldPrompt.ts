// The key hint over the world (spec §4): "[E] Vào Sobi Farm" near a door or a thing. A closed door shows
// its reason and conditions with no key. Drawn from the prompt a scene reports and the current bindings.
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
      data: { prompt: prompt.control ?? 'closed' },
    },
    code
      ? el('kbd', {
          class: 'world-prompt__key',
          text: keyLabel(code),
          attrs: { 'aria-label': vi.controls[prompt.control as Control] },
        })
      : el('span', { class: 'world-prompt__lock', text: '🔒', attrs: { 'aria-hidden': 'true' } }),
    el(
      'div',
      { class: 'world-prompt__text' },
      el('b', { text: prompt.title }),
      ...prompt.lines.map((line) => el('span', { text: line })),
    ),
  );
}
