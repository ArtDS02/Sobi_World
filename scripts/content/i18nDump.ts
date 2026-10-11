// Lists the translatable texts of content/*.json that `content/i18n/en.json` has no entry for (or all with --all).
// Usage: npx tsx scripts/content/i18nDump.ts [--all]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { translatableTexts, type ContentTexts } from '../../src/i18n/contentText';

const root = join(import.meta.dirname, '..', '..', 'content');
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== 'schemas' && name !== 'i18n') walk(full);
    } else if (name.endsWith('.json')) files.push(relative(root, full).split(sep).join('/'));
  }
};
walk(root);
const all = process.argv.includes('--all');
const readTable = (): ContentTexts => {
  try {
    return JSON.parse(readFileSync(join(root, 'i18n', 'en.json'), 'utf8')) as ContentTexts;
  } catch {
    return {};
  }
};
const table = readTable();
for (const file of files.sort()) {
  const texts = translatableTexts(file, JSON.parse(readFileSync(join(root, file), 'utf8')));
  for (const [path, text] of texts) if (all || !table[file]?.[path]) console.log(`${file}\t${path}\t${text}`);
}
