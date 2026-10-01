// ui_* icons for DOM buttons and labels (spec §11.1 DOM layer, R12A). The URL comes from the asset
// registry (never a file name here); mountApp sets the source once. Decorative: alt="".
import { UI_ICON, type UiIcon } from '../../core/config/assetIds';
import { el } from '../dom';

let source: ((id: string) => string | null) | null = null;

/** Called by mountApp with the registry's url lookup; null (DOM tests) renders no icons. */
export function setIconSource(resolve: ((id: string) => string | null) | null) {
  source = resolve;
}

export function icon(name: UiIcon | undefined): HTMLElement | null {
  const url = name && source ? source(UI_ICON[name]) : null;
  if (!url) return null;
  return el('img', {
    class: 'c-icon',
    attrs: { src: url, alt: '', 'aria-hidden': 'true', draggable: 'false' },
  });
}
