// Node has no DOM here: a tiny fake document stands in for it.
import { describe, expect, it, vi as spy } from 'vitest';
import { installCrashHandlers } from '../../src/ui/crashScreen';

class FakeEl {
  children: FakeEl[] = [];
  style = { cssText: '' };
  dataset: Record<string, string> = {};
  textContent = '';
  isConnected = false;
  listeners = new Map<string, () => void>();
  attrs: Record<string, string> = {};
  parent: FakeEl | null = null;
  constructor(public tag: string) {}
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  addEventListener(t: string, fn: () => void) { this.listeners.set(t, fn); }
  append(...kids: FakeEl[]) { for (const k of kids) { k.parent = this; this.children.push(k); } }
  remove() { this.isConnected = false; }
  click() { this.listeners.get('click')?.(); }
}
function fakeWin() {
  const body = new FakeEl('body');
  const handlers = new Map<string, (e: unknown) => void>();
  const win = {
    document: { createElement: (t: string) => new FakeEl(t), body },
    addEventListener: (t: string, fn: (e: unknown) => void) => handlers.set(t, fn),
    removeEventListener: (t: string) => handlers.delete(t),
  };
  // `append` on body marks the screen as connected, like a real DOM would.
  body.append = (...kids: FakeEl[]) => { for (const k of kids) { k.isConnected = true; body.children.push(k); } };
  return { win: win as unknown as Window, body, fire: (t: string, e: unknown) => handlers.get(t)?.(e), handlers };
}
const buttons = (screen: FakeEl) => screen.children[0]!.children[3]!.children;

describe('global crash handlers (A2)', () => {
  it('shows one dismissible screen, logs every error, reload is injected', () => {
    const { win, body, fire } = fakeWin();
    const report = spy.fn();
    const reload = spy.fn();
    installCrashHandlers(win, { report, reload });
    fire('error', { error: new Error('first'), message: 'first' });
    fire('unhandledrejection', { reason: 'second' });
    expect(body.children).toHaveLength(1);
    expect(report.mock.calls.map((c) => c[0])).toEqual(['window.onerror', 'unhandledrejection']);
    const [keep, again] = buttons(body.children[0]!);
    again!.click();
    expect(reload).toHaveBeenCalledTimes(1);
    keep!.click();
    expect(body.children[0]!.isConnected).toBe(false);
    fire('error', { error: new Error('third'), message: 'third' }); // a new screen after dismissal
    expect(body.children).toHaveLength(2);
  });

  it('a throwing report does not stop the screen; uninstall removes the listeners', () => {
    const { win, body, fire, handlers } = fakeWin();
    const off = installCrashHandlers(win, { report: () => { throw new Error('log broken'); }, reload: () => {} });
    fire('error', { error: new Error('x'), message: 'x' });
    expect(body.children).toHaveLength(1);
    off();
    expect(handlers.size).toBe(0);
  });
});
