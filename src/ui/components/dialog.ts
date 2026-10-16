// Modal dialog. Rendered once when opened, outside the per-tick re-render, so inputs keep state. A wooden title strip,
// a round close button in the corner (and Esc, and a click outside), a body that alone scrolls and the action bar
// that stays at the bottom (decision 035).
import type { UiIcon } from '../../core/config/assetIds';
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import { icon } from './icon';

export interface DialogHandle {
  close(): void;
  body: HTMLElement;
  footer: HTMLElement;
}

/**
 * `closeLabel`: text of the closing button (default "Hủy"; e.g. "Vào nông trại" for a notice).
 * `iconName`: picture in the title badge.
 */
export function openDialog(
  host: HTMLElement,
  title: string,
  closeLabel: string = vi.action.cancel,
  iconName?: UiIcon,
): DialogHandle {
  const body = el('div', { class: 'c-dialog__body' });
  const footer = el('div', { class: 'c-dialog__footer' });
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
  const overlay = el(
    'div',
    {
      class: 'c-dialog',
      on: { click: (e) => e.target === overlay && close() },
    },
    el(
      'div',
      { class: 'c-dialog__panel', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } },
      el('button', {
        class: 'c-dialog__close',
        text: '✕',
        attrs: { type: 'button', 'aria-label': vi.action.close, title: vi.action.close },
        on: { click: close },
      }),
      el(
        'h2',
        { class: 'c-dialog__title' },
        el('span', { class: 'c-dialog__badge' }, icon(iconName) ?? '🐷'),
        title,
      ),
      body,
      // Cancel and the confirm slot side by side.
      el(
        'div',
        { class: 'c-dialog__bar' },
        el('button', {
          class: 'c-button c-button--ghost',
          text: closeLabel,
          attrs: { type: 'button' },
          on: { click: close },
        }),
        footer,
      ),
    ),
  );
  document.addEventListener('keydown', onKey);
  host.replaceChildren(overlay);
  overlay.querySelector<HTMLElement>('.c-dialog__bar button')?.focus({ preventScroll: true }); // keyboard users land inside (§10.4)
  return { close, body, footer };
}

/** Yes / cancel confirmation with a warning line; `onConfirm` runs, then the dialog closes. */
export function openConfirmDialog(
  host: HTMLElement,
  title: string,
  warning: string,
  onConfirm: () => Promise<unknown>,
) {
  const d = openDialog(host, title);
  d.body.append(el('p', { class: 'c-dialog__warn', text: warning }));
  d.footer.append(
    el('button', {
      class: 'c-button',
      text: vi.action.confirm,
      attrs: { type: 'button' },
      on: { click: () => void onConfirm().finally(d.close) },
    }),
  );
  return d;
}
