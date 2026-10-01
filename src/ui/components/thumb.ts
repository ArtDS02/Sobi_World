// Lazy <img> thumbnail of a manifest asset (spec §11.4): the URL comes from the registry, never a
// file name in src/. `silhouette` draws an undiscovered entry as a dark shape (§8.15).
import { el } from '../dom';

export function thumb(url: string | null, alt: string, silhouette = false): HTMLElement {
  const cls = `c-thumb${silhouette ? ' is-silhouette' : ''}`;
  if (!url) return el('span', { class: `${cls} is-missing`, attrs: { 'aria-hidden': 'true' } });
  return el('img', {
    class: cls,
    attrs: { src: url, alt, loading: 'lazy', decoding: 'async', draggable: 'false' },
  });
}
