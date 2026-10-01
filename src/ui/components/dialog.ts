// Modal dialog. Rendered once when opened, outside the per-tick re-render, so inputs keep state.
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface DialogHandle {
  close(): void;
  body: HTMLElement;
  footer: HTMLElement;
}

export function openDialog(host: HTMLElement, title: string): DialogHandle {
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
      { class: 'c-dialog__panel', attrs: { role: 'dialog', 'aria-modal': 'true' } },
      el('h2', { class: 'c-dialog__title', text: title }),
      body,
      footer,
      el('button', {
        class: 'c-button c-button--ghost',
        text: vi.action.cancel,
        attrs: { type: 'button' },
        on: { click: close },
      }),
    ),
  );
  document.addEventListener('keydown', onKey);
  host.replaceChildren(overlay);
  return { close, body, footer };
}
