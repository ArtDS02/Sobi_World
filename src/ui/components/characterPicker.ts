// The character section of the settings screen: Bi (boy) or So (girl), each with the picture the character
// walks with. The choice lives in settings.json (the settings store), so it applies to every Area.
import { CHARACTER_IDS, type CharacterId } from '../../core/settings/settings';
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface CharacterChoice {
  current(): CharacterId;
  choose(id: CharacterId): void;
  /** Url of the standing picture, or null when the art is missing. */
  preview(id: CharacterId): string | null;
  subscribe(fn: () => void): () => void;
}

export function renderCharacterPicker(choice: CharacterChoice): HTMLElement {
  const current = choice.current();
  return el(
    'section',
    { class: 'settings__section character-pick', data: { section: 'character' } },
    el('h3', { class: 'settings__heading', text: vi.character.title }),
    el('p', { class: 'settings__hint', text: vi.character.hint }),
    el(
      'div',
      { class: 'character-pick__row' },
      ...CHARACTER_IDS.map((id) => {
        const url = choice.preview(id);
        return el(
          'button',
          {
            class: `character-pick__card${id === current ? ' is-selected' : ''}`,
            attrs: { type: 'button', 'aria-pressed': String(id === current), 'data-character': id },
            on: { click: () => choice.choose(id) },
          },
          url ? el('img', { attrs: { src: url, alt: '', draggable: 'false' } }) : null,
          el('span', { text: vi.character[id] }),
        );
      }),
    ),
  );
}
