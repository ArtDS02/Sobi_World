// Dev-only asset gallery (art standard §7.4): every manifest id with its images and status, all
// resolved through the registry. Imported dynamically behind import.meta.env.DEV.
import type { AssetRegistry } from '../core/assets/registry';
import { vi } from '../i18n/vi';
import { el } from './dom';

function tile(registry: AssetRegistry, id: string): HTMLElement {
  const entry = registry.resolve(id)!;
  const images = Object.keys(entry.files)
    .map((key) => ({ key, url: registry.url(id, key) }))
    .filter((f): f is { key: string; url: string } => f.url !== null);
  return el(
    'figure',
    { class: `c-gallery__tile is-${entry.status}` },
    el(
      'div',
      { class: 'c-gallery__images' },
      ...images.map(({ key, url }) =>
        url.endsWith('.json')
          ? null
          : /\.(mp3|ogg)$/.test(url)
            ? el('audio', { attrs: { src: url, controls: '', preload: 'none' } })
            : el('img', { attrs: { src: url, alt: `${id} ${key}`, title: key, loading: 'lazy' } }),
      ),
    ),
    el('figcaption', { text: `${id} · ${entry.section} · ${entry.status}` }),
  );
}

export function openAssetGallery(host: HTMLElement, registry: AssetRegistry): void {
  const overlay = el(
    'div',
    { class: 'c-gallery' },
    el('button', {
      class: 'c-button c-gallery__close',
      text: vi.action.close,
      attrs: { type: 'button' },
      on: { click: () => overlay.remove() },
    }),
    el('div', { class: 'c-gallery__grid' }, ...registry.entries().map((e) => tile(registry, e.id))),
  );
  host.append(overlay);
}
