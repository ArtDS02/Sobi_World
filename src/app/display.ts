// The display settings of GĐ13 (text size, colors, language) wired to the settings store: <html> attributes for the
// stylesheet, and the choice object the settings screen uses.
import type { SettingsStore } from '../core/settings/settings';
import type { DisplayChoice } from '../ui/components/displaySettings';

export function createDisplay(settings: SettingsStore, flushSave: () => Promise<void>, reload: () => void): DisplayChoice {
  const show = () => {
    const prefs = settings.getSnapshot().settings;
    document.documentElement.dataset.textSize = prefs.textSize;
    document.documentElement.dataset.colorMode = prefs.colorMode;
  };
  show();
  settings.subscribe(show);
  return {
    current: () => settings.getSnapshot().settings,
    choose: (key, value) => {
      const changedLanguage = key === 'language' && value !== settings.getSnapshot().settings.language;
      const saved = settings.setDisplay(key, value);
      // The string table is filled once at the start, so a new language needs a fresh start (the save is flushed first).
      if (changedLanguage) void Promise.all([saved, flushSave()]).then(reload);
    },
    saveFailed: () => settings.getSnapshot().saveError,
    subscribe: (fn) => settings.subscribe(fn),
  };
}
