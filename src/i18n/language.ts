// Language choice (GĐ13). `vi` stays the one table every module imports; applying English copies the English
// strings over it in place, once, before the game modules load (app/main.ts). Changing language later reloads.
import { en } from './en';
import { setCurrentLanguage, type Language } from './locale';
import { vi } from './vi';

const original = structuredClone(vi) as unknown as Record<string, unknown>;

function overwrite(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const from = source[key];
    const into = target[key];
    if (Array.isArray(from)) target[key] = [...from];
    else if (from !== null && typeof from === 'object' && into !== null && typeof into === 'object') {
      overwrite(into as Record<string, unknown>, from as Record<string, unknown>);
    } else target[key] = from;
  }
}

/** Fills the shared string table with the chosen language. Safe to call again (tests, a second apply). */
export function applyLanguage(language: Language): void {
  overwrite(vi as unknown as Record<string, unknown>, language === 'en' ? (en as unknown as Record<string, unknown>) : original);
  setCurrentLanguage(language);
}
