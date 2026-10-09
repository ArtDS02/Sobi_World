// Browser adapter for settings.json (spec §4): one localStorage key. A failed write rejects, so the
// settings store can show it.
import type { SettingsStorage } from '../../core/settings/port';

export const SETTINGS_KEY = 'sobiworld.settings';

export interface SettingsKeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createLocalSettings(local: SettingsKeyValue = globalThis.localStorage): SettingsStorage {
  return {
    load: () => Promise.resolve(local.getItem(SETTINGS_KEY)),
    save: (json) =>
      new Promise<void>((resolve, reject) => {
        try {
          local.setItem(SETTINGS_KEY, json);
          resolve();
        } catch (e) {
          reject(e instanceof Error ? e : new Error('settings write failed'));
        }
      }),
  };
}
