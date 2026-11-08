// Keyboard shortcuts of the dashboard (admin plan step 3.5): Ctrl+K search, Ctrl+S save, Esc close, ? list.
import { esc } from './labels';

export const SHORTCUTS: readonly (readonly [keys: string, what: string])[] = [
  ['Ctrl + K', 'Tìm nhanh trang hoặc tên trong nội dung game'],
  ['Ctrl + S', 'Lưu trang đang mở (nút "Lưu" của trang)'],
  ['Esc', 'Đóng hộp thoại, ngăn kéo hoặc tìm nhanh'],
  ['?', 'Hiện bảng phím tắt này'],
];

/** True while the viewer types in a field, where "?" is just a character. */
export const typing = (el: EventTarget | null): boolean => {
  const t = el instanceof HTMLElement ? el : null;
  return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
};

/** The enabled "save" control of the open page, if any. */
export function saveButton(root: ParentNode): HTMLButtonElement | null {
  for (const b of root.querySelectorAll<HTMLButtonElement>('[data-save], [data-act="save"], .js-save')) {
    if (!b.disabled && b.offsetParent !== null) return b;
  }
  return null;
}

/** Closes the top-most dialog or drawer; true when something closed. */
export function closeTopLayer(doc: Document): boolean {
  const close = [...doc.querySelectorAll<HTMLElement>('.modal-host [data-mclose], .drawer-host [data-close], .qs-host [data-qs-close], .guide-overlay [data-close]')].at(-1);
  if (!close) return false;
  close.click();
  return true;
}

export function showShortcuts(): void {
  if (document.querySelector('.shortcuts-host')) return;
  const host = document.createElement('div');
  host.className = 'modal-host shortcuts-host';
  host.innerHTML = `<div class="modal-backdrop" data-mclose></div><div class="modal" role="dialog" aria-modal="true" aria-label="Phím tắt">
    <header class="modal__head"><h2>⌨️ Phím tắt</h2><button type="button" class="icon-btn" data-mclose aria-label="Đóng">✕</button></header>
    <div class="modal__body"><table class="table">${SHORTCUTS.map(([k, w]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(w)}</td></tr>`).join('')}</table></div></div>`;
  document.body.append(host);
  host.querySelectorAll('[data-mclose]').forEach((b) => b.addEventListener('click', () => host.remove()));
}

export function installShortcuts(opts: { openSearch: () => void; root: ParentNode }): void {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (!document.querySelector('.qs-host')) opts.openSearch();
    } else if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault(); // never the browser's "save page"
      saveButton(opts.root)?.click();
    } else if (e.key === 'Escape') {
      if (closeTopLayer(document)) e.preventDefault();
    } else if (e.key === '?' && !mod && !typing(e.target)) {
      e.preventDefault();
      showShortcuts();
    }
  });
}
