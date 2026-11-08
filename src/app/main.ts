// Entry point. The game modules are imported dynamically so that a content file failing validation
// (ARCHITECTURE §8: a development bug, never a player state) shows a readable error screen instead of
// a blank window. The language is applied first (GĐ13): the string table and the texts of the content files are
// read while the game modules load.
import '../styles/main.scss';
import { setContentLocalizer } from '../core/content/load';
import { parseSettings } from '../core/settings/settings';
import contentTexts from '../../content/i18n/en.json';
import { localizeRaw, type ContentTexts } from '../i18n/contentText';
import { applyLanguage } from '../i18n/language';
import { readSettingsText } from '../platform/earlySettings';
import { installCrashHandlers } from '../ui/crashScreen';
import type { UninBridge } from '../platform/desktop/bridge';
import { renderStartupError } from '../ui/startupError';

async function applyChosenLanguage(): Promise<void> {
  const { language } = parseSettings(await readSettingsText());
  applyLanguage(language);
  document.documentElement.lang = language;
  if (language === 'en') setContentLocalizer((file, raw) => localizeRaw(file, raw, contentTexts as ContentTexts));
}

// A2: uncaught errors and rejected promises show a recoverable screen and go to the local error log.
installCrashHandlers(window, {
  report: (where, message) => {
    const bridge = (globalThis as { unin?: UninBridge }).unin;
    if (bridge) bridge.app.logError(where, message);
    else console.error(`[${where}] ${message}`);
  },
  reload: () => window.location.reload(),
});

const root = document.querySelector<HTMLDivElement>('#app');
if (root) {
  applyChosenLanguage()
    .then(() => import('./start'))
    .then((m) => m.start(root))
    .catch((e: unknown) => root.replaceChildren(renderStartupError(e)));
}
