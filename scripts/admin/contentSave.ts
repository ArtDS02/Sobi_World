// "Nội dung game" on the dev API (decision 036): any file of the catalog (scripts/admin/contentCatalog.ts) can be
// rewritten — numbers, words, switches, lists, new rows — and is only kept when the game accepts it:
//   1. the file's own schema (content/schemas), with ids.generated.ts regenerated first when the file owns an id list;
//   2. a shipped id is never removed (saves hold them: ARCHITECTURE §8);
//   3. a row whose name lives in the string tables has a name in both languages (scripts/admin/i18nText.ts);
//   4. every content module of the game loads again with the new file (cross-file references, area manifests).
// Any failure restores every file touched, so a refused save leaves no trace.
import { readFileSync } from 'node:fs';
import { contentJson } from '../content/format';
import { ID_LISTS, IDS_FILE, idsText, listIn } from '../content/ids';
import { writeText } from './artFiles';
import { CONTENT_FILES, EDITABLE_FILES, TEXT_TABLES, type RowTexts } from './contentCatalog';
import { readContent, schemaProblems } from './contentFiles';
import { readRowTexts, restoreTables, snapshotTables, writeRowTexts } from './i18nText';

type Mod = Record<string, unknown>;
type Result = { status: number; body: unknown };

/** The modules that load content at import time: loading them again is the game's own cross-check. */
export const CONTENT_MODULES = [
  '/src/core/config/content.ts',
  '/src/areas/farm/logic/config/content.ts',
  '/src/areas/garden/logic/config/content.ts',
  '/src/areas/aquarium/logic/config/content.ts',
  '/src/areas/cloud/logic/config/content.ts',
  '/src/areas/adventure/logic/config/content.ts',
  '/src/areas/plaza/logic/config/content.ts',
  // Every Area module and the save codec: config tables built from content (breeds, odds, recipes…).
  '/src/app/saveCodec.ts',
];

const rowIds = (value: unknown, key: string): string[] =>
  (((value as Mod | null)?.[key] ?? []) as { id?: unknown }[]).map((r) => r.id).filter((id): id is string => typeof id === 'string');

/** GET /content: every editable file, and the names of the rows whose texts live in the string tables. */
export function readContentFiles(): { files: Record<string, unknown>; texts: Record<string, RowTexts>; pages: string[] } {
  const files = Object.fromEntries(EDITABLE_FILES.map((f) => [f.file, readContent(f.file)]));
  const texts = Object.fromEntries(
    Object.entries(TEXT_TABLES).map(([file, table]) => [file, readRowTexts(table, rowIds(files[file], table.rowsKey))]),
  );
  return { files, texts, pages: CONTENT_FILES.filter((f) => f.page).map((f) => f.file) };
}

/** Problems with the ids of an id-list file: a shipped id removed, a duplicate, a bad id. */
export function idProblems(file: string, value: unknown, shipped: readonly string[]): string[] {
  const list = ID_LISTS.find((l) => l.file === file);
  if (!list) return [];
  const ids = rowIds(value, list.key);
  const problems: string[] = [];
  const removed = shipped.filter((id) => !ids.includes(id));
  if (removed.length) problems.push(`Không được xoá id đã phát hành (save của người chơi còn giữ): ${removed.join(', ')}`);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) problems.push(`Trùng id ${dup}`);
  const bad = ids.find((id) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(id));
  if (bad) problems.push(`Id "${bad}" chỉ được dùng chữ, số và dấu _ (bắt đầu bằng chữ)`);
  return problems;
}

/** Rows of a string-table file that have no name in `texts` nor in the tables. */
export function missingNames(file: string, value: unknown, texts: RowTexts, current: RowTexts): string[] {
  const table = TEXT_TABLES[file];
  if (!table) return [];
  return rowIds(value, table.rowsKey)
    .filter((id) => !(texts[id]?.vi.trim() || current[id]?.vi) || !(texts[id]?.en.trim() || current[id]?.en))
    .map((id) => `${id}: cần tên tiếng Việt và tiếng Anh (ô “Tên hiển thị”)`);
}

export interface SaveDeps {
  load: (p: string) => Promise<Mod>;
  /** Drops Vite's cached modules so the next load reads the new files. */
  invalidate: () => void;
}

export async function saveContentFile(body: { file: string; value: unknown; texts?: RowTexts }, deps: SaveDeps): Promise<Result> {
  const def = EDITABLE_FILES.find((f) => f.file === body.file);
  if (!def) return { status: 400, body: { error: `File ${body.file} không sửa ở đây` } };
  const idsBefore = readFileSync(IDS_FILE, 'utf8');
  const list = ID_LISTS.find((l) => l.file === def.file);
  const texts = body.texts ?? {};
  const table = TEXT_TABLES[def.file];
  const before = readFileSync(`content/${def.file}`, 'utf8');
  const tables = table ? snapshotTables(table) : null;
  const refuse = (problems: string[]): Result => ({ status: 400, body: { error: problems.join('\n') } });
  const restore = () => {
    writeText(`content/${def.file}`, before);
    writeText(IDS_FILE, idsBefore);
    if (table && tables) restoreTables(table, tables);
    deps.invalidate();
  };

  const early = [
    ...idProblems(def.file, body.value, list ? listIn(idsBefore, list.name) : []),
    ...(table ? missingNames(def.file, body.value, texts, readRowTexts(table, rowIds(body.value, table.rowsKey))) : []),
  ];
  if (early.length) return refuse(early);

  try {
    writeText(`content/${def.file}`, contentJson(body.value));
    if (list) writeText(IDS_FILE, idsText(idsBefore));
    if (table) writeRowTexts(table, Object.fromEntries(Object.entries(texts).filter(([id]) => rowIds(body.value, table.rowsKey).includes(id))));
    deps.invalidate();
    const schema = await deps.load(def.schemaPath!);
    const problems = schemaProblems(schema[def.exportName!], body.value);
    if (problems.length) {
      restore();
      return refuse(problems);
    }
    for (const mod of CONTENT_MODULES) await deps.load(mod);
  } catch (e) {
    restore();
    return refuse([`Game không nạp được dữ liệu mới: ${e instanceof Error ? e.message : String(e)}`]);
  }
  return { status: 200, body: { ok: true, file: def.file } };
}
