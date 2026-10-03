// Small modal forms and confirmations of the admin dashboard (DECISIONS AD-1). Dangerous actions
// (reset, delete) go through confirmDanger, which can require typing a word to enable the button.
import { esc } from './labels';

export interface ModalOptions {
  title: string;
  body: string; // form fields markup
  submit: string;
  danger?: boolean;
  /** Wide dialog (image grids). */
  wide?: boolean;
  /** Return an error text to keep the modal open, or nothing to close it. */
  onSubmit: (form: HTMLFormElement) => Promise<string | void> | string | void;
  onOpen?: (form: HTMLFormElement) => void;
}

export function openModal(o: ModalOptions): () => void {
  const host = document.createElement('div');
  host.className = 'modal-host';
  host.innerHTML = `<div class="modal-backdrop" data-mclose></div>
    <form class="modal${o.wide ? ' modal--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}">
      <header class="modal__head"><h2>${esc(o.title)}</h2><button type="button" class="icon-btn" data-mclose aria-label="Đóng">✕</button></header>
      <div class="modal__body">${o.body}</div>
      <p class="modal__error" hidden></p>
      <footer class="modal__foot">
        <button type="button" class="btn" data-mclose>Huỷ</button>
        <button type="submit" class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}">${esc(o.submit)}</button>
      </footer>
    </form>`;
  document.body.append(host);
  const form = host.querySelector('form')!;
  const close = () => {
    host.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);
  host.querySelectorAll('[data-mclose]').forEach((b) => b.addEventListener('click', close));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>('[type=submit]')!;
    btn.disabled = true;
    const err = form.querySelector<HTMLElement>('.modal__error')!;
    try {
      const msg = await o.onSubmit(form);
      if (msg) {
        err.textContent = msg;
        err.hidden = false;
      } else close();
    } catch (x) {
      err.textContent = (x as Error).message;
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
  o.onOpen?.(form);
  form.querySelector<HTMLElement>('input, select, textarea')?.focus();
  return close;
}

/** Confirmation for a destructive action; `typeToConfirm` must be typed before the button works. */
export function confirmDanger(title: string, text: string, action: string, run: () => Promise<void> | void, typeToConfirm?: string) {
  openModal({
    title,
    danger: true,
    submit: action,
    body: `<p class="danger-text">⚠ ${esc(text)}</p>
      ${typeToConfirm ? `<label class="field"><span>Gõ <b>${esc(typeToConfirm)}</b> để xác nhận</span><input name="confirm" autocomplete="off" /></label>` : ''}`,
    onSubmit: async (f) => {
      if (typeToConfirm && String(new FormData(f).get('confirm')).trim() !== typeToConfirm) return `Gõ đúng "${typeToConfirm}" để tiếp tục`;
      await run();
    },
  });
}
