// A soft fade that covers the swap when the player moves between the plaza and an Area (GĐ14).
// Presentation only: the place has already changed when the veil starts; it just clears away over a moment.
import { el } from '../dom';

export interface PlaceVeil {
  /** Plays the fade once; calling it again restarts it. */
  flash(): void;
}

export function mountPlaceVeil(parent: HTMLElement): PlaceVeil {
  const veil = el('div', { class: 'place-veil', attrs: { 'aria-hidden': 'true' } });
  parent.append(veil);
  return {
    flash() {
      veil.classList.remove('is-playing');
      void veil.offsetWidth; // restart the animation
      veil.classList.add('is-playing');
    },
  };
}
