// Player settings (ARCHITECTURE core/settings): key bindings, kept in settings.json apart from the
// save. A damaged or hand-edited file never stops the game: whatever is wrong falls back to defaults.
import { z } from 'zod';
import { CONTROLS, DEFAULT_KEYS, KEY_SLOTS, validKeys, type Control, type KeyBindings, type KeySlots } from './keys';
import type { SettingsStorage } from './port';

export const SETTINGS_VERSION = 1;

/** The two characters the player can walk as: Bi (boy) and So (girl). */
export const CHARACTER_IDS = ['so', 'bi'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];
export const DEFAULT_CHARACTER: CharacterId = 'so';

export interface GameSettings {
  version: typeof SETTINGS_VERSION;
  keys: KeyBindings;
  character: CharacterId;
}

export const defaultGameSettings = (): GameSettings => ({ version: SETTINGS_VERSION, keys: DEFAULT_KEYS, character: DEFAULT_CHARACTER });

const slot = z.string().min(1).max(40).nullable();
const fileSchema = z.object({
  version: z.number().int().optional(),
  keys: z.record(z.string(), z.tuple([slot, slot])).optional(),
  character: z.enum(CHARACTER_IDS).optional(),
});

/**
 * Settings from the file's text. Unknown controls are ignored, a missing control keeps its default, and
 * bindings that clash (or leave a control without a key) are replaced by the defaults as a whole.
 */
export function parseSettings(text: string | null): GameSettings {
  if (text === null) return defaultGameSettings();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return defaultGameSettings();
  }
  const file = fileSchema.safeParse(raw);
  if (!file.success) return defaultGameSettings();
  const keys = { ...DEFAULT_KEYS } as Record<Control, KeySlots>;
  for (const c of CONTROLS) {
    const slots = file.data.keys?.[c];
    if (slots && slots.length === KEY_SLOTS) keys[c] = slots;
  }
  const character = file.data.character ?? DEFAULT_CHARACTER;
  return validKeys(keys) ? { version: SETTINGS_VERSION, keys, character } : { ...defaultGameSettings(), character };
}

export const serializeSettings = (s: GameSettings): string => `${JSON.stringify(s, null, 2)}\n`;

export interface SettingsSnapshot {
  settings: GameSettings;
  /** The last write failed; the change stays in memory and the next change writes again. */
  saveError: boolean;
}

/** Settings in memory with the file behind them. */
export function createSettingsStore(storage: SettingsStorage) {
  let snap: SettingsSnapshot = { settings: defaultGameSettings(), saveError: false };
  const subscribers = new Set<(s: SettingsSnapshot) => void>();
  const set = (next: SettingsSnapshot) => {
    snap = next;
    for (const fn of subscribers) fn(snap);
  };
  let queue: Promise<void> = Promise.resolve();

  /** Serialized writes; a failure is reported through `saveError`, never swallowed. */
  const persist = (settings: GameSettings): Promise<void> => {
    queue = queue.then(() =>
      storage.save(serializeSettings(settings)).then(
        () => {
          if (snap.saveError) set({ ...snap, saveError: false });
        },
        () => set({ ...snap, saveError: true }),
      ),
    );
    return queue;
  };

  return {
    getSnapshot: () => snap,
    subscribe(fn: (s: SettingsSnapshot) => void): () => void {
      subscribers.add(fn);
      return () => void subscribers.delete(fn);
    },
    /** Reads the file; a read failure leaves the defaults (the next change writes a fresh file). */
    async init(): Promise<void> {
      const text = await storage.load().catch(() => null);
      set({ settings: parseSettings(text), saveError: false });
    },
    /** Takes new key bindings (already checked by `rebind`) and writes them. */
    setKeys(keys: KeyBindings): Promise<void> {
      if (!validKeys(keys)) return Promise.resolve();
      const settings = { ...snap.settings, keys };
      set({ ...snap, settings });
      return persist(settings);
    },
    /** The character the player walks as (kept in settings.json, not in the world save). */
    setCharacter(character: CharacterId): Promise<void> {
      if (snap.settings.character === character) return Promise.resolve();
      const settings = { ...snap.settings, character };
      set({ ...snap, settings });
      return persist(settings);
    },
    resetKeys(): Promise<void> {
      const settings = { ...snap.settings, keys: DEFAULT_KEYS };
      set({ ...snap, settings });
      return persist(settings);
    },
  };
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;
