// Readable difference between two content values (plan step 7.3): rows of id lists are matched by id (added / removed /
// changed fields), everything else by key or index. Pure; `label` turns an id into a name for the text.
export interface Change {
  kind: 'added' | 'removed' | 'changed';
  /** Where, as readable steps (row names instead of ids when `label` knows them). */
  path: string[];
  before?: unknown;
  after?: unknown;
}

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === 'object' && !Array.isArray(v);
const isRows = (v: Json): v is Record<string, Json>[] => Array.isArray(v) && v.length > 0 && v.every((r) => isObj(r) && typeof r.id === 'string');
const same = (a: Json, b: Json) => JSON.stringify(a) === JSON.stringify(b);

export function diffValues(before: Json, after: Json, label: (id: string) => string = (id) => id, path: string[] = []): Change[] {
  if (same(before, after)) return [];
  if (isRows(before) && isRows(after)) {
    const out: Change[] = [];
    const old = new Map(before.map((r) => [r.id as string, r]));
    const next = new Map(after.map((r) => [r.id as string, r]));
    for (const [id, row] of next) {
      const step = label(id);
      if (!old.has(id)) out.push({ kind: 'added', path: [...path, step], after: row });
      else out.push(...diffValues(old.get(id), row, label, [...path, step]));
    }
    for (const [id, row] of old) if (!next.has(id)) out.push({ kind: 'removed', path: [...path, label(id)], before: row });
    return out;
  }
  if (isObj(before) && isObj(after)) {
    const out: Change[] = [];
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (!(k in before)) out.push({ kind: 'added', path: [...path, k], after: after[k] });
      else if (!(k in after)) out.push({ kind: 'removed', path: [...path, k], before: before[k] });
      else out.push(...diffValues(before[k], after[k], label, [...path, k]));
    }
    return out;
  }
  if (Array.isArray(before) && Array.isArray(after) && before.length === after.length && !isRows(before)) {
    return before.flatMap((b, i) => diffValues(b, after[i], label, [...path, `[${i + 1}]`]));
  }
  return [{ kind: 'changed', path, before, after }];
}

const show = (v: Json): string => (typeof v === 'string' ? `"${v}"` : JSON.stringify(v) ?? 'không có');
const short = (s: string) => (s.length > 120 ? `${s.slice(0, 117)}…` : s);

/** One line per change, for the confirmation before a save. */
export function describeChanges(changes: readonly Change[]): string[] {
  return changes.map((c) => {
    const where = c.path.join(' › ') || '(toàn file)';
    if (c.kind === 'added') return `＋ ${where}${isObj(c.after) ? '' : `: ${short(show(c.after))}`}`;
    if (c.kind === 'removed') return `－ ${where}`;
    return `✎ ${where}: ${short(show(c.before))} → ${short(show(c.after))}`;
  });
}
