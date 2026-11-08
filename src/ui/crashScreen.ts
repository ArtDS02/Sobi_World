// Global crash screen (A2): `window.onerror` / `unhandledrejection` land here. Plain DOM and the string table
// only, so it works even when a game module is what broke. The overlay offers "reload" and "keep playing".
import { errorText } from '../core/world/errorGate';
import { vi } from '../i18n/vi';

export interface CrashHandlerOptions {
  /** Where the error is logged (desktop: the main process error log). Must not throw. */
  report: (where: string, message: string) => void;
  /** Reload the page (injected so tests need no real navigation). */
  reload: () => void;
}

export { errorText };

/** Builds the overlay element; exported for tests. */
export function renderCrashScreen(doc: Document, detail: string, reload: () => void, dismiss: () => void): HTMLElement {
  const box = doc.createElement('div');
  box.setAttribute('role', 'alertdialog');
  box.dataset.crashScreen = '1';
  box.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(40,25,20,.72);font-family:inherit;';
  const card = doc.createElement('div');
  card.style.cssText =
    'max-width:34rem;margin:1rem;padding:1.5rem;border-radius:1rem;background:#fff7f0;color:#4a2c20;box-shadow:0 8px 32px rgba(0,0,0,.4);';
  const title = doc.createElement('h2');
  title.textContent = vi.app.crashTitle;
  const body = doc.createElement('p');
  body.textContent = vi.app.crashBody;
  const pre = doc.createElement('pre');
  pre.textContent = detail.split('\n').slice(0, 4).join('\n');
  pre.style.cssText = 'max-height:6rem;overflow:auto;font-size:.75rem;white-space:pre-wrap;';
  const row = doc.createElement('div');
  row.style.cssText = 'display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem;';
  const keep = doc.createElement('button');
  keep.textContent = vi.app.crashKeep;
  keep.addEventListener('click', dismiss);
  const again = doc.createElement('button');
  again.textContent = vi.app.crashReload;
  again.addEventListener('click', reload);
  row.append(keep, again);
  card.append(title, body, pre, row);
  box.append(card);
  return box;
}

/** Installs the global handlers; returns a function that removes them. */
export function installCrashHandlers(win: Window, { report, reload }: CrashHandlerOptions): () => void {
  let shown: HTMLElement | null = null;
  const handle = (where: string, error: unknown) => {
    const detail = errorText(error);
    try {
      report(where, detail);
    } catch {
      /* logging is best effort */
    }
    if (shown?.isConnected) return; // one screen at a time
    shown = renderCrashScreen(win.document, detail, reload, () => shown?.remove());
    win.document.body.append(shown);
  };
  const onError = (e: ErrorEvent) => handle('window.onerror', e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => handle('unhandledrejection', e.reason);
  win.addEventListener('error', onError);
  win.addEventListener('unhandledrejection', onRejection);
  return () => {
    win.removeEventListener('error', onError);
    win.removeEventListener('unhandledrejection', onRejection);
    shown?.remove();
  };
}
