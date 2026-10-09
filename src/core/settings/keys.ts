// Key bindings (spec §4): each control has up to two keys (KeyboardEvent.code values, so the layout of
// the keyboard does not matter). Rebinding refuses a key that another control already uses. Pure.

export const CONTROLS = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'interact',
  'inventory',
  'codex',
  'menu',
] as const;
export type Control = (typeof CONTROLS)[number];

/** Primary and secondary key of a control; null = empty slot. */
export type KeySlots = readonly [string | null, string | null];
export type KeyBindings = Readonly<Record<Control, KeySlots>>;

export const KEY_SLOTS = 2;

/** Spec §4: WASD / arrows to move, E interact, I bag, C Codex, Esc menu. */
export const DEFAULT_KEYS: KeyBindings = {
  moveUp: ['KeyW', 'ArrowUp'],
  moveDown: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  interact: ['KeyE', null],
  inventory: ['KeyI', null],
  codex: ['KeyC', null],
  menu: ['Escape', null],
};

/** Keys that cannot be given to a control: they belong to the browser or the OS shell. */
export const RESERVED_KEYS: readonly string[] = ['F5', 'F11', 'F12', 'Tab', 'MetaLeft', 'MetaRight', 'ContextMenu'];

export type RebindError = 'KEY_RESERVED' | 'KEY_TAKEN' | 'KEY_INVALID';
export type RebindResult =
  | { ok: true; keys: KeyBindings }
  | { ok: false; error: RebindError; /** The control already using the key (KEY_TAKEN). */ with?: Control };

/** The control that uses `code`, if any (optionally ignoring one slot, the one being rebound). */
export function controlOf(
  keys: KeyBindings,
  code: string,
  except?: { control: Control; slot: number },
): Control | null {
  for (const c of CONTROLS) {
    for (let slot = 0; slot < KEY_SLOTS; slot++) {
      if (except && except.control === c && except.slot === slot) continue;
      if (keys[c][slot] === code) return c;
    }
  }
  return null;
}

function withSlot(keys: KeyBindings, control: Control, slot: number, code: string | null): KeyBindings {
  const next: [string | null, string | null] = [keys[control][0], keys[control][1]];
  next[slot] = code;
  return { ...keys, [control]: next };
}

/** Puts `code` in a slot of a control. The only way to change bindings, so conflicts cannot get in. */
export function rebind(keys: KeyBindings, control: Control, slot: number, code: string): RebindResult {
  if (!Number.isInteger(slot) || slot < 0 || slot >= KEY_SLOTS || code.length === 0) {
    return { ok: false, error: 'KEY_INVALID' };
  }
  if (RESERVED_KEYS.includes(code)) return { ok: false, error: 'KEY_RESERVED' };
  const owner = controlOf(keys, code, { control, slot });
  if (owner) return { ok: false, error: 'KEY_TAKEN', with: owner };
  return { ok: true, keys: withSlot(keys, control, slot, code) };
}

/** Empties a slot; refused when it would leave the control with no key at all. */
export function clearSlot(keys: KeyBindings, control: Control, slot: number): RebindResult {
  if (!Number.isInteger(slot) || slot < 0 || slot >= KEY_SLOTS) return { ok: false, error: 'KEY_INVALID' };
  const other = keys[control][slot === 0 ? 1 : 0];
  if (other === null) return { ok: false, error: 'KEY_INVALID' };
  return { ok: true, keys: withSlot(keys, control, slot, null) };
}

/** Every control has a key and no key is shared or reserved (the invariant `rebind` keeps). */
export function validKeys(keys: KeyBindings): boolean {
  const seen = new Set<string>();
  for (const c of CONTROLS) {
    if (keys[c][0] === null && keys[c][1] === null) return false;
    for (const code of keys[c]) {
      if (code === null) continue;
      if (seen.has(code) || RESERVED_KEYS.includes(code)) return false;
      seen.add(code);
    }
  }
  return true;
}

/** Controls pressed by the keys that are down (`codes` = KeyboardEvent.code values). */
export function pressedControls(keys: KeyBindings, codes: ReadonlySet<string>): Set<Control> {
  const out = new Set<Control>();
  for (const c of CONTROLS) if (keys[c].some((k) => k !== null && codes.has(k))) out.add(c);
  return out;
}

/** Short label of a key for hints and the settings screen ("KeyE" → "E", "ArrowUp" → "↑"). */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  const names: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Escape: 'Esc',
  };
  return names[code] ?? code;
}
