// Row names that live in the game's string tables (decision 036): an item's name and description (`vi.shop[id]`,
// `vi.shop[id_desc]`), a decoration's or an achievement's name. The dashboard edits them beside the content row;
// this writes the entry lines of one block of src/i18n/vi.ts and of the English part file, in their own format
// (`    KEY: "text",`). Pure string functions, unit-tested; the English table has vi's shape, so both are written.
import { readFileSync } from 'node:fs';
import { writeText } from './artFiles';
import type { RowTexts, TextTable } from './contentCatalog';

const VI_FILE = 'src/i18n/vi.ts';

/** Line range [open, close] of the top-level `  <block>: {` … `  },` of a string table. */
function blockRange(lines: readonly string[], block: string): [number, number] {
  const open = lines.indexOf(`  ${block}: {`);
  if (open < 0) throw new Error(`string table: block ${block} not found`);
  const close = lines.findIndex((l, i) => i > open && l === '  },');
  if (close < 0) throw new Error(`string table: block ${block} not closed`);
  return [open, close];
}

const KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const entryRe = (key: string) => new RegExp(`^    ${key}: (".*"),$`);

/** The texts of `keys` in a block (absent key = undefined). */
export function readEntries(text: string, block: string, keys: readonly string[]): Record<string, string | undefined> {
  const lines = text.split('\n');
  const [open, close] = blockRange(lines, block);
  const body = lines.slice(open + 1, close);
  return Object.fromEntries(
    keys.map((k) => {
      const hit = KEY.test(k) ? body.map((l) => entryRe(k).exec(l)).find(Boolean) : undefined;
      return [k, hit ? (JSON.parse(hit[1]!) as string) : undefined];
    }),
  );
}

/** `text` with each entry of `values` set in `block` (replaced in place, or appended before the block closes). */
export function writeEntries(text: string, block: string, values: Record<string, string>): string {
  const lines = text.split('\n');
  const [open, close] = blockRange(lines, block);
  const added: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (!KEY.test(key)) throw new Error(`string table: ${key} is not a valid key`);
    const line = `    ${key}: ${JSON.stringify(value)},`;
    const at = lines.findIndex((l, i) => i > open && i < close && entryRe(key).test(l));
    if (at >= 0) lines[at] = line;
    else added.push(line);
  }
  lines.splice(close, 0, ...added);
  return lines.join('\n');
}

/** Row texts → the entries of one table language (`vi` or `en`). */
export function entriesOf(texts: RowTexts, table: TextTable, lang: 'vi' | 'en'): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, t] of Object.entries(texts)) {
    const name = (lang === 'vi' ? t.vi : t.en).trim();
    if (!name) throw new Error(`${id}: thiếu tên ${lang === 'vi' ? 'tiếng Việt' : 'tiếng Anh'}`);
    out[id] = name;
    if (table.desc) out[`${id}_desc`] = ((lang === 'vi' ? t.viDesc : t.enDesc) ?? '').trim();
  }
  return out;
}

/** The current texts of `ids` in both tables (what the dashboard shows beside each row). */
export function readRowTexts(table: TextTable, ids: readonly string[]): RowTexts {
  const keys = ids.flatMap((id) => (table.desc ? [id, `${id}_desc`] : [id]));
  const vi = readEntries(readFileSync(VI_FILE, 'utf8'), table.block, keys);
  const en = readEntries(readFileSync(table.enFile, 'utf8'), table.block, keys);
  return Object.fromEntries(
    ids.map((id) => [
      id,
      { vi: vi[id] ?? '', en: en[id] ?? '', ...(table.desc ? { viDesc: vi[`${id}_desc`] ?? '', enDesc: en[`${id}_desc`] ?? '' } : {}) },
    ]),
  );
}

/** Both files' text before a write, to restore when a later step fails. */
export const snapshotTables = (table: TextTable) => ({ vi: readFileSync(VI_FILE, 'utf8'), en: readFileSync(table.enFile, 'utf8') });

export function restoreTables(table: TextTable, snap: { vi: string; en: string }) {
  writeText(VI_FILE, snap.vi);
  writeText(table.enFile, snap.en);
}

/** Writes the row texts into vi.ts and the English part file. */
export function writeRowTexts(table: TextTable, texts: RowTexts) {
  if (Object.keys(texts).length === 0) return;
  const snap = snapshotTables(table);
  writeText(VI_FILE, writeEntries(snap.vi, table.block, entriesOf(texts, table, 'vi')));
  writeText(table.enFile, writeEntries(snap.en, table.block, entriesOf(texts, table, 'en')));
}
