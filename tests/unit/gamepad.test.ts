// D6: gamepad mapping and its bridge to key events (no real pad: a fake source, a tiny KeyboardEvent).
import { beforeAll, describe, expect, it } from 'vitest';
import { padChanges, padControls, STICK_DEADZONE } from '../../src/core/settings/gamepad';
import { DEFAULT_KEYS } from '../../src/core/settings/keys';
import { createGamepadInput, type PadSource } from '../../src/ui/world/gamepadInput';

beforeAll(() => {
  if (typeof globalThis.KeyboardEvent === 'undefined') {
    class KE extends Event {
      code: string;
      constructor(type: string, init: { code?: string } & EventInit = {}) {
        super(type, init);
        this.code = init.code ?? '';
      }
    }
    (globalThis as unknown as { KeyboardEvent: unknown }).KeyboardEvent = KE;
  }
});

const pad = (pressed: number[] = [], axes: number[] = [0, 0]) => ({ buttons: Array.from({ length: 16 }, (_, i) => pressed.includes(i)), axes });

describe('padControls', () => {
  it('maps d-pad, stick, A / X / Y / Start', () => {
    expect([...padControls(pad([12, 15, 0]))].sort()).toEqual(['interact', 'moveRight', 'moveUp']);
    expect([...padControls(pad([2, 3, 9]))].sort()).toEqual(['codex', 'inventory', 'menu']);
    expect([...padControls(pad([], [-0.9, 0.9]))].sort()).toEqual(['moveDown', 'moveLeft']);
  });
  it('the stick deadzone and broken axes do nothing', () => {
    expect(padControls(pad([], [STICK_DEADZONE, -STICK_DEADZONE])).size).toBe(0);
    expect(padControls({ buttons: [], axes: [NaN, undefined as unknown as number] }).size).toBe(0);
  });
  it('padChanges reports only what changed', () => {
    expect(padChanges(new Set(['moveUp', 'interact']), new Set(['moveUp', 'menu']))).toEqual({ down: ['menu'], up: ['interact'] });
  });
});

describe('createGamepadInput', () => {
  it('sends the key of the player binding on press and release, and releases on dispose', () => {
    const target = new EventTarget();
    const seen: string[] = [];
    for (const t of ['keydown', 'keyup']) target.addEventListener(t, (e) => seen.push(`${e.type}:${(e as KeyboardEvent).code}`));
    let state: ReturnType<typeof pad> | null = null;
    let tick = () => {};
    const source: PadSource = {
      pads: () => [state ? { buttons: state.buttons.map((pressed) => ({ pressed })), axes: state.axes } : null],
      every: (fn) => ((tick = fn), () => (tick = () => {})),
    };
    const rebound = { ...DEFAULT_KEYS, interact: ['KeyF', null] as const };
    const input = createGamepadInput(target, () => rebound, source);
    tick();
    expect(seen).toEqual([]); // no pad
    state = pad([0]);
    tick();
    tick(); // held: no repeat
    state = pad();
    tick();
    expect(seen).toEqual(['keydown:KeyF', 'keyup:KeyF']);
    state = pad([14]);
    tick();
    input.dispose();
    expect(seen.slice(-2)).toEqual(['keydown:KeyA', 'keyup:KeyA']);
  });
});
