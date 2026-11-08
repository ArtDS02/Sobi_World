// Content coverage (plan step 8.0): every JSON file under content/ and whether the admin can edit it (the catalog of
// "Nội dung game", or a page of its own). Prints the table; exits 1 when a file can only be edited by hand.
// Usage: npx tsx scripts/admin/contentCoverage.ts
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { CONTENT_FILES, EDITABLE_FILES } from './contentCatalog';

/** Files with their own admin page (not in the catalog list form). */
export const OWN_PAGE: Record<string, string> = {
  'farm/species.json': '#/pigs',
  'farm/breeding.json': '#/breeding',
  'farm/layout.json': '#/layout',
  'plaza/layout.json': '#/layout',
  'farm/season-fx.json': '#/seasons',
  'shared/daynight.json': '#/daynight',
  'shared/shop.json': '#/products',
  'adventure/maps.json': '#/adventure-world',
  'adventure/battle_fx.json': '#/battle-lab',
};
/** Generated or tool-owned: not meant for hand editing. */
const SKIP = [/^schemas\//, /^i18n\//, /^anim\//, /ids\.generated/];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.json')) out.push(relative('content', p).split(sep).join('/'));
  }
  return out;
}

const editable = new Set([...EDITABLE_FILES.map((f) => f.file), ...CONTENT_FILES.map((f) => f.file)]);
const rows = walk('content').filter((f) => !SKIP.some((re) => re.test(f))).sort();
const missing: string[] = [];
for (const f of rows) {
  const how = editable.has(f) ? 'catalog' : OWN_PAGE[f] ? `page ${OWN_PAGE[f]}` : 'NONE';
  if (how === 'NONE') missing.push(f);
  console.log(`${how.padEnd(26)} ${f}`);
}
console.log(`\n${rows.length} files, ${missing.length} only editable by hand${missing.length ? ': ' + missing.join(', ') : ''}`);
if (missing.length) process.exit(1);
