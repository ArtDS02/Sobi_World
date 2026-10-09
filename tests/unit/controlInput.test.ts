// Keyboard controls of the world and the key settings screen's capture (GĐ3). The tests use a plain
// EventTarget as the "document": no DOM is needed for what is under test.
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_KEYS, type KeyBindings } from '../../src/core/settings/keys';
import { createSettingsStore } from '../../src/core/settings/settings';
import { createControlInput } from '../../src/ui/world/controlInput';
import { createKeySettings } from '../../src/ui/world/keySettings';

let doc: EventTarget;
let keys: KeyBindings;

function key(type: 'keydown' | 'keyup', code: string, extra: Record<string, unknown> = {}) {
  const e = Object.assign(new Event(type, { cancelable: true }), { code, repeat: false, ctrlKey: false, altKey: false, metaKey: false }, extra);
  doc.dispatchEvent(e);
  return e;
}

beforeEach(() => {
  doc = new EventTarget();
  keys = DEFAULT_KEYS;
});

describe('createControlInput', () => {
  it('holds the controls of the keys down, WASD and arrows alike', () => {
    const input = createControlInput(doc, () => keys);
    key('keydown', 'KeyW');
    key('keydown', 'ArrowRight');
    expect([...input.held()].sort()).toEqual(['moveRight', 'moveUp']);
    key('keyup', 'KeyW');
    expect([...input.held()]).toEqual(['moveRight']);
    input.dispose();
  });

  it('fires a press once, not on key repeat, and takes the key from the page', () => {
    const input = createControlInput(doc, () => keys);
    let n = 0;
    input.onPress('interact', () => n++);
    const first = key('keydown', 'KeyE');
    key('keydown', 'KeyE', { repeat: true });
    expect(n).toBe(1);
    expect(first.defaultPrevented).toBe(true);
    key('keyup', 'KeyE');
    key('keydown', 'KeyE');
    expect(n).toBe(2);
    input.dispose();
  });

  it('follows a rebinding at once', () => {
    const input = createControlInput(doc, () => keys);
    let n = 0;
    input.onPress('interact', () => n++);
    keys = { ...DEFAULT_KEYS, interact: ['KeyF', null] };
    key('keydown', 'KeyE');
    expect(n).toBe(0);
    key('keydown', 'KeyF');
    expect(n).toBe(1);
    input.dispose();
  });

  it('ignores OS shortcuts (Ctrl / Alt / Meta)', () => {
    const input = createControlInput(doc, () => keys);
    let n = 0;
    input.onPress('inventory', () => n++);
    key('keydown', 'KeyI', { ctrlKey: true });
    expect(n).toBe(0);
    expect(input.held().size).toBe(0);
    input.dispose();
  });

  it('suspend stops reading until resumed and forgets held keys', () => {
    const input = createControlInput(doc, () => keys);
    key('keydown', 'KeyW');
    const resume = input.suspend();
    expect(input.held().size).toBe(0);
    key('keydown', 'KeyS');
    expect(input.held().size).toBe(0);
    resume();
    key('keydown', 'KeyD');
    expect([...input.held()]).toEqual(['moveRight']);
    input.dispose();
  });

  it('names the control of a key', () => {
    const input = createControlInput(doc, () => keys);
    expect(input.controlOf('Escape')).toBe('menu');
    expect(input.controlOf('KeyZ')).toBeNull();
    input.dispose();
  });
});

describe('key settings capture', () => {
  async function setup() {
    let text: string | null = null;
    const store = createSettingsStore({
      load: () => Promise.resolve(text),
      save: (j) => {
        text = j;
        return Promise.resolve();
      },
    });
    await store.init();
    const input = createControlInput(doc, () => store.getSnapshot().settings.keys);
    const ks = createKeySettings(store, input, doc);
    return { store, input, ks, saved: () => text };
  }

  it('the next key becomes the binding and is written to settings.json', async () => {
    const { store, ks, saved } = await setup();
    ks.listen('interact', 0);
    expect(ks.view().listening).toEqual({ control: 'interact', slot: 0 });
    key('keydown', 'KeyF');
    await store.setKeys(store.getSnapshot().settings.keys); // flush the write queue
    expect(store.getSnapshot().settings.keys.interact).toEqual(['KeyF', null]);
    expect(ks.view().listening).toBeNull();
    expect(JSON.parse(saved()!).keys.interact).toEqual(['KeyF', null]);
  });

  it('a clash is refused with the name of the other control; Esc cancels', async () => {
    const { store, ks } = await setup();
    ks.listen('interact', 0);
    key('keydown', 'KeyI');
    expect(ks.view().message).toContain('Túi đồ');
    expect(store.getSnapshot().settings.keys.interact).toEqual(['KeyE', null]);
    ks.listen('interact', 0);
    key('keydown', 'Escape');
    expect(ks.view().listening).toBeNull();
    expect(ks.view().message).toBeNull();
  });

  it('the game does not react to the key being captured, and listens again afterwards', async () => {
    const { input, ks } = await setup();
    let n = 0;
    input.onPress('inventory', () => n++);
    ks.listen('interact', 1);
    key('keydown', 'KeyI'); // refused (taken) and swallowed
    expect(n).toBe(0);
    key('keydown', 'KeyI');
    expect(n).toBe(1);
  });

  it('removing the second key and resetting to the defaults', async () => {
    const { store, ks } = await setup();
    ks.clear('moveUp', 1);
    expect(store.getSnapshot().settings.keys.moveUp).toEqual(['KeyW', null]);
    ks.reset();
    expect(store.getSnapshot().settings.keys).toEqual(DEFAULT_KEYS);
  });
});
