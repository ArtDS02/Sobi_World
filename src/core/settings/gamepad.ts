// Gamepad mapping (D6): which controls a pad state asks for, and the key changes between two polls. Pure: the
// Gamepad API is read in src/ui/world/gamepadInput.ts. Settings live in settings.json, never in the save.
import type { Control } from './keys';

/** The part of a `Gamepad` that matters: standard-mapping buttons and the two stick axes. */
export interface PadState {
  buttons: readonly boolean[];
  axes: readonly number[];
}

export const STICK_DEADZONE = 0.45;

/** Standard mapping: d-pad 12-15, stick on axes 0/1, A interact, X codex, Y bag, Start menu. */
export function padControls(pad: PadState): Set<Control> {
  const on = new Set<Control>();
  const b = (i: number) => pad.buttons[i] === true;
  const x = Number.isFinite(pad.axes[0]) ? pad.axes[0]! : 0;
  const y = Number.isFinite(pad.axes[1]) ? pad.axes[1]! : 0;
  if (b(12) || y < -STICK_DEADZONE) on.add('moveUp');
  if (b(13) || y > STICK_DEADZONE) on.add('moveDown');
  if (b(14) || x < -STICK_DEADZONE) on.add('moveLeft');
  if (b(15) || x > STICK_DEADZONE) on.add('moveRight');
  if (b(0)) on.add('interact');
  if (b(2)) on.add('codex');
  if (b(3)) on.add('inventory');
  if (b(9)) on.add('menu');
  return on;
}

/** Controls that went down / up between two polls (opposite directions held together cancel to neither). */
export function padChanges(prev: ReadonlySet<Control>, next: ReadonlySet<Control>): { down: Control[]; up: Control[] } {
  return { down: [...next].filter((c) => !prev.has(c)), up: [...prev].filter((c) => !next.has(c)) };
}
