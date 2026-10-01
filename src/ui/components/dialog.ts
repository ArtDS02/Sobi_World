// Modal dialog. Rendered once when opened, outside the per-tick re-render, so inputs keep state.
import { vi } from '../../i18n/vi';
import { el } from '../dom';

export interface DialogHandle {
  close(): void;
  body: HTMLElement;
  footer: HTMLElement;
}

/** `closeLabel`: text of the closing button (default "Hủy"; e.g. "Vào nông trại" for a notice). */
export function openDialog(
  host: HTMLElement,
  title: string,
  closeLabel: string = vi.action.cancel,
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
      { class: 'c-dialog__panel', attrs: { role: 'dialog', 'aria-modal': 'true' } },
      el('h2', { class: 'c-dialog__title', text: title }),
      body,
      footer,
      el('button', {
        class: 'c-button c-button--ghost',
        text: closeLabel,
        attrs: { type: 'button' },
        on: { click: close },
      }),
    ),
  );
  document.addEventListener('keydown', onKey);
  host.replaceChildren(overlay);
  overlay.querySelector<HTMLElement>('button')?.focus(); // keyboard users land inside (§10.4)
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
