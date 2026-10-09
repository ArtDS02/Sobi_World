// Keyboard controls of the world (spec §4): which controls are held, and a callback when one is pressed.
// Keys come from the player's bindings (core/settings), read at the moment of each key event, so a
// rebinding applies at once. Typing in a field and OS shortcuts (Ctrl/Alt/Meta) never count.
import { controlOf, pressedControls, type Control, type KeyBindings } from '../../core/settings/keys';

export interface ControlInput {
  /** Controls held down now. */
  held(): Set<Control>;
  /** Called once per key press (not while the key repeats). Returns the way to stop listening. */
  onPress(control: Control, fn: () => void): () => void;
  /** The control a key (KeyboardEvent.code) is bound to, if any. */
  controlOf(code: string): Control | null;
  /** Stops reading keys until the returned function is called (the key settings capture a key). */
  suspend(): () => void;
  /** Forgets every held key (the window lost focus; the key-up would never arrive). */
  releaseAll(): void;
  dispose(): void;
}

const typingTarget = (t: EventTarget | null): boolean =>
  typeof HTMLElement !== 'undefined' &&
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/** The document (or any event target with a window): tests pass a plain EventTarget. */
export type KeyTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'> & {
  defaultView?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> | null;
};

export function createControlInput(target: KeyTarget, keys: () => KeyBindings): ControlInput {
  const down = new Set<string>();
  const presses = new Map<Control, Set<() => void>>();
  let suspended = 0;

  const onKeyDown = (ev: Event) => {
    const e = ev as KeyboardEvent;
    if (suspended > 0 || typingTarget(e.target) || e.ctrlKey || e.altKey || e.metaKey) return;
    const before = pressedControls(keys(), down);
    down.add(e.code);
    if (e.repeat) return;
    const after = pressedControls(keys(), down);
    for (const control of after) {
      if (before.has(control)) continue;
      const listeners = presses.get(control);
      if (!listeners) continue;
      // The key was used by the game: no page scroll, no button re-click.
      e.preventDefault();
      for (const fn of [...listeners]) fn();
    }
  };
  const onKeyUp = (ev: Event) => void down.delete((ev as KeyboardEvent).code);
  const releaseAll = () => down.clear();

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.defaultView?.addEventListener('blur', releaseAll);

  return {
    held: () => pressedControls(keys(), down),
    controlOf: (code) => controlOf(keys(), code),
    onPress(control, fn) {
      const set = presses.get(control) ?? new Set();
      set.add(fn);
      presses.set(control, set);
      return () => void set.delete(fn);
    },
    suspend() {
      suspended += 1;
      releaseAll();
      let resumed = false;
      return () => {
        if (!resumed) suspended -= 1;
        resumed = true;
      };
    },
    releaseAll,
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.defaultView?.removeEventListener('blur', releaseAll);
      presses.clear();
    },
  };
}
