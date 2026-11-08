// CSV export / import of one list of a content file (plan 8.4). Only flat fields travel (numbers, text, true / false, and
// nested numbers as `a.b`); arrays and objects stay as they are in the file. Import changes the cells of rows that exist
// (matched by `id`) and appends rows of new ids; the game's schema still decides before anything is saved.
type Row = Record<string, unknown>;

const flat = (row: Row, prefix = ''): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[`${prefix}${k}`] = v;
    else if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flat(v as Row, `${prefix}${k}.`));
  }
  return out;
};

const quote = (v: string | number | boolean): string => {
  const s = String(v);
  return /[",\n\r]/.test(s) || s !== s.trim() ? `"${s.replaceAll('"', '""')}"` : s;
};

/** Columns: `id` first, then every flat key seen, in first-seen order. */
export function csvColumns(rows: readonly Row[]): string[] {
  const cols = new Set<string>(['id']);
  for (const r of rows) for (const k of Object.keys(flat(r))) cols.add(k);
  return [...cols];
}

export function toCsv(rows: readonly Row[]): string {
  const cols = csvColumns(rows);
  const lines = rows.map((r) => {
    const f = flat(r);
    return cols.map((c) => (c in f ? quote(f[c]!) : '')).join(',');
  });
  return `${[cols.map(quote).join(','), ...lines].join('\n')}\n`;
}

/** RFC-4180-style parser (quotes, doubled quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
}

const setPath = (row: Row, path: string, value: unknown) => {
  const keys = path.split('.');
  let node = row;
  for (const k of keys.slice(0, -1)) {
    if (!node[k] || typeof node[k] !== 'object') node[k] = {};
    node = node[k] as Row;
  }
  node[keys.at(-1)!] = value;
};

/** A cell as the type the field already has (number stays number, boolean stays boolean); new fields: number-looking becomes a number. */
function typed(cell: string, old: unknown): unknown {
  if (typeof old === 'number') return cell.trim() === '' ? old : Number(cell);
  if (typeof old === 'boolean') return cell.trim().toLowerCase() === 'true';
  if (typeof old === 'string') return cell;
  return cell.trim() !== '' && Number.isFinite(Number(cell)) ? Number(cell) : cell === 'true' ? true : cell === 'false' ? false : cell;
}

export interface CsvResult {
  rows: Row[];
  changed: number;
  added: number;
  /** Problems that stop the import (no id column, a bad number…). */
  errors: string[];
}

export function applyCsv(current: readonly Row[], text: string): CsvResult {
  const table = parseCsv(text);
  const head = table[0];
  if (!head || !head.includes('id')) return { rows: [...current], changed: 0, added: 0, errors: ['File CSV cần một cột "id".'] };
  const idAt = head.indexOf('id');
  const rows = current.map((r) => structuredClone(r) as Row);
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  const errors: string[] = [];
  let changed = 0;
  let added = 0;
  table.slice(1).forEach((cells, n) => {
    const id = cells[idAt] ?? '';
    if (!id) return void errors.push(`Dòng ${n + 2}: thiếu id.`);
    const existing = byId.get(id);
    const row: Row = existing ?? { id };
    let touched = false;
    head.forEach((col, i) => {
      if (col === 'id') return;
      const cell = cells[i] ?? '';
      const old = col.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Row)[k] : undefined), row);
      if (cell === '') return; // an empty cell never changes a field (and never creates one)
      const next = typed(cell, old);
      if (typeof next === 'number' && !Number.isFinite(next)) return void errors.push(`Dòng ${n + 2}, cột ${col}: "${cell}" không phải số.`);
      if (next !== old) {
        setPath(row, col, next);
        touched = true;
      }
    });
    if (existing) changed += touched ? 1 : 0;
    else {
      rows.push(row);
      byId.set(id, row);
      added += 1;
    }
  });
  return { rows, changed, added, errors };
}
