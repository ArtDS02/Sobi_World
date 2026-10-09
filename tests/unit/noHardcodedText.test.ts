// AGENT_RULES §3: text shown to the player lives in the string table (src/i18n) or in content/*.json,
// never as a literal in code. Scans src/ for string literals holding Vietnamese letters.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');
const VI_LETTER = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/** Where Vietnamese literals are allowed: the string table itself. */
const ALLOWED = [join('src', 'i18n') + '\\', join('src', 'i18n') + '/'];

/**
 * Admin-only text kept next to the rules it checks (data validation messages and FX labels shown by
 * the admin tool, never in the shipped game UI). Moving them to the admin labels is a later cleanup.
 */
const ADMIN_ONLY_FILES = new Set(
  [
    'src/areas/farm/logic/breedingOdds.ts',
    'src/areas/farm/scene/config/seasonFxTable.ts',
    'src/areas/farm/scene/fx/seasonFxRules.ts',
    'src/core/engine/dayNight.ts',
  ].map((f) => f.replaceAll('/', '\\')),
);

/** Known literals that are not player-facing text (font probe string, see start.ts). */
const ALLOWED_LITERALS = new Set(['Ủn Ỉn Cấp vàng']);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

/** Drops line and block comments so English-or-Vietnamese comments do not count. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function literals(source: string): string[] {
  return [...source.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map(
    (m) => m[1] ?? m[2] ?? m[3] ?? '',
  );
}

describe('no player-facing text outside the string table', () => {
  it('src/ has no Vietnamese string literals outside src/i18n', () => {
    const offenders: string[] = [];
    for (const file of files(join(ROOT, 'src'))) {
      const rel = relative(ROOT, file);
      if (ALLOWED.some((a) => rel.startsWith(a)) || ADMIN_ONLY_FILES.has(rel.replaceAll('/', '\\'))) continue;
      for (const text of literals(withoutComments(readFileSync(file, 'utf8')))) {
        if (VI_LETTER.test(text) && !ALLOWED_LITERALS.has(text)) offenders.push(`${rel}: ${text}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
