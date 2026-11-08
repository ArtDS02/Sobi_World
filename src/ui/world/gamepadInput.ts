// Basic gamepad support (D6), renderer only: each poll turns the pad into the key events of the player's own bindings, so
// movement, interact, bag, Codex and menu work through the one ControlInput path. No pad, no Gamepad API: nothing happens.
import { padChanges, padControls } from '../../core/settings/gamepad';
import type { Control, KeyBindings } from '../../core/settings/keys';

export interface PadSource {
  /** `navigator.getGamepads` shape. */
  pads(): readonly (null | { buttons: readonly { pressed: boolean }[]; axes: readonly number[] })[];
  /** Calls `fn` once per frame until the returned stop is called. */
  every(fn: () => void): () => void;
}

export function createGamepadInput(target: EventTarget, keys: () => KeyBindings, source: PadSource): { dispose(): void } {
  let held = new Set<Control>();
  const fire = (type: 'keydown' | 'keyup', control: Control) => {
    const code = keys()[control][0] ?? keys()[control][1];
    if (code) target.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }));
  };
  const stop = source.every(() => {
    const pad = source.pads().find((p) => p !== null);
    const next = pad ? padControls({ buttons: pad.buttons.map((b) => b.pressed), axes: pad.axes }) : new Set<Control>();
    const { down, up } = padChanges(held, next);
    for (const c of up) fire('keyup', c);
    for (const c of down) fire('keydown', c);
    held = next;
  });
  return {
    dispose() {
      stop();
      for (const c of held) fire('keyup', c);
      held = new Set();
    },
  };
}

/** The browser's pad source, or null where there is no Gamepad API (tests, old shells). */
export function browserPads(): PadSource | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  return {
    pads: () => navigator.getGamepads(),
    every(fn) {
      let id = 0;
      const loop = () => {
        fn();
        id = requestAnimationFrame(loop);
      };
      id = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(id);
    },
  };
}
