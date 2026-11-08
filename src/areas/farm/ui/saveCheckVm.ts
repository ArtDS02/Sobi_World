// The lines of the "check my save" result (D1): one verdict, the save version, one line per Area slice.
import type { SaveInspection } from '../../../core/save/health';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { el } from '../../../ui/dom';

/** Plain data first (testable), DOM second. */
export function saveCheckText(found: SaveInspection): string[] {
  const S = vi.settings;
  const verdict = {
    healthy: S.checkHealthy,
    repairable: S.checkRepairable,
    corrupt: S.checkCorrupt,
    tooNew: S.checkTooNew,
    codeError: S.checkCodeError,
  }[found.state];
  return [
    verdict,
    ...(found.version === null ? [] : [t(S.checkVersion, { version: found.version })]),
    ...found.areas.map((a) => t(a.ok ? S.checkAreaOk : S.checkAreaBad, { name: a.id })),
  ];
}

export function saveCheckLines(found: SaveInspection): HTMLElement[] {
  const [verdict, ...rest] = saveCheckText(found);
  return [
    el('p', { class: found.state === 'healthy' ? 'settings__hint' : 'c-banner', attrs: { role: 'status' }, text: verdict ?? '' }),
    el('ul', { class: 'settings__credits' }, ...rest.map((line) => el('li', { text: line }))),
  ];
}
