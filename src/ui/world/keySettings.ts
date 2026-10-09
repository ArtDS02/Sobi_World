// Changing the keys in the settings screen (spec §4): press a slot, press the new key. The game's own key
// handling pauses while a key is being captured, a clash or a reserved key is refused with a message, and
// the result goes to settings.json through the settings store.
import {
  clearSlot,
  rebind,
  type Control,
  type KeyBindings,
  type RebindResult,
} from '../../core/settings/keys';
import type { SettingsStore } from '../../core/settings/settings';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import type { ControlInput } from './controlInput';

export interface KeySettingsView {
  keys: KeyBindings;
  /** The slot waiting for a key. */
  listening: { control: Control; slot: number } | null;
  /** Why the last key was refused. */
  message: string | null;
  /** settings.json could not be written. */
  saveError: boolean;
}

export interface KeySettings {
  view(): KeySettingsView;
  subscribe(fn: () => void): () => void;
  listen(control: Control, slot: number): void;
  cancel(): void;
  clear(control: Control, slot: number): void;
  reset(): void;
}

const refusal = (r: Extract<RebindResult, { ok: false }>): string =>
  r.error === 'KEY_TAKEN' && r.with
    ? t(vi.keys.taken, { control: vi.controls[r.with] })
    : r.error === 'KEY_RESERVED'
      ? vi.keys.reserved
      : vi.keys.invalid;

export function createKeySettings(
  settings: SettingsStore,
  input: ControlInput,
  doc: Pick<Document, 'addEventListener' | 'removeEventListener'> = document,
): KeySettings {
  const subscribers = new Set<() => void>();
  let listening: KeySettingsView['listening'] = null;
  let message: string | null = null;
  let stop: (() => void) | null = null;
  const notify = () => subscribers.forEach((fn) => fn());
  settings.subscribe(notify);

  const done = () => {
    stop?.();
    stop = null;
    listening = null;
  };

  const apply = (r: RebindResult) => {
    if (r.ok) {
      message = null;
      void settings.setKeys(r.keys);
    } else {
      message = refusal(r);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (!listening) return;
    // The key is for the setting, not for the game or the page (capture phase, before anything else).
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code === 'Escape') {
      message = null;
      done();
      return notify();
    }
    if (['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'].includes(e.code)) return;
    const { control, slot } = listening;
    done();
    apply(rebind(settings.getSnapshot().settings.keys, control, slot, e.code));
    notify();
  };

  return {
    view: () => ({
      keys: settings.getSnapshot().settings.keys,
      listening,
      message,
      saveError: settings.getSnapshot().saveError,
    }),
    subscribe(fn) {
      subscribers.add(fn);
      return () => void subscribers.delete(fn);
    },
    listen(control, slot) {
      done();
      message = null;
      listening = { control, slot };
      const resume = input.suspend();
      doc.addEventListener('keydown', onKey as EventListener, true);
      stop = () => {
        doc.removeEventListener('keydown', onKey as EventListener, true);
        resume();
      };
      notify();
    },
    cancel() {
      done();
      notify();
    },
    clear(control, slot) {
      done();
      apply(clearSlot(settings.getSnapshot().settings.keys, control, slot));
      notify();
    },
    reset() {
      done();
      message = null;
      void settings.resetKeys();
      notify();
    },
  };
}
