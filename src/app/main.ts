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
import { renderStartupError } from '../ui/startupError';

async function applyChosenLanguage(): Promise<void> {
  const { language } = parseSettings(await readSettingsText());
  applyLanguage(language);
  if (language === 'en') setContentLocalizer((file, raw) => localizeRaw(file, raw, contentTexts as ContentTexts));
}

const root = document.querySelector<HTMLDivElement>('#app');
if (root) {
  applyChosenLanguage()
    .then(() => import('./start'))
    .then((m) => m.start(root))
    .catch((e: unknown) => root.replaceChildren(renderStartupError(e)));
}
