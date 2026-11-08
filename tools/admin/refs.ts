// "Dùng ở đâu" and the data check (plan 8.5 / 8.7): which content rows mention an id, and which mentions point to nothing.
// Pure over the content files as the API returns them.
export type Files = Record<string, unknown>;
export interface Usage {
  file: string;
  /** Readable path inside the file, e.g. `recipes › recipe_pig_feed › inputs[1]`. */
  path: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** Keys whose values name pictures / sounds in the asset manifest, not content rows. */
const ASSET_KEYS = new Set(['art', 'artId', 'icon', 'asset', 'image', 'sound', 'sfx', 'bg', 'sprite', 'texture', 'tile', 'music', 'frames', 'thumb', 'fallback']);

/** Every `id` of a row, with where it lives. */
export function rowIds(files: Files): Map<string, { file: string; list: string }> {
  const out = new Map<string, { file: string; list: string }>();
  for (const [file, doc] of Object.entries(files)) {
    if (!isObj(doc)) continue;
    for (const [list, rows] of Object.entries(doc)) {
      if (!Array.isArray(rows)) continue;
      for (const r of rows) if (isObj(r) && typeof r.id === 'string' && !out.has(r.id)) out.set(r.id, { file, list });
    }
  }
  return out;
}

function walk(v: unknown, path: string[], visit: (s: string, path: string[], key: string) => void, key = '') {
  if (typeof v === 'string') return visit(v, path, key);
  if (Array.isArray(v)) {
    return v.forEach((x, i) => {
      // A row of an id list is named by its id; anything else by its position.
      const step = isObj(x) && typeof x.id === 'string' ? [...path, x.id] : [...path.slice(0, -1), `${path.at(-1) ?? ''}[${i + 1}]`];
      walk(x, step, visit, key);
    });
  }
  if (isObj(v)) {
    const own = typeof v.id === 'string' ? v.id : null;
    for (const [k, x] of Object.entries(v)) {
      if (k === 'id' && own !== null) continue; // a row's own id is not a use of it
      walk(x, [...path, k], visit, k);
    }
  }
}

/** Where `id` is mentioned, in any file (not the row's own id field). */
export function usages(files: Files, id: string): Usage[] {
  const out: Usage[] = [];
  for (const [file, doc] of Object.entries(files)) {
    walk(doc, [], (s, path) => {
      if (s === id) out.push({ file, path: path.join(' › ') });
    });
  }
  return out;
}

/** Id-looking prefixes: the part before the first `_` of row ids, when at least three rows share it. */
export function knownPrefixes(ids: Iterable<string>): Set<string> {
  const n = new Map<string, number>();
  for (const id of ids) {
    const p = id.split('_')[0]!;
    if (id.includes('_')) n.set(p, (n.get(p) ?? 0) + 1);
  }
  return new Set([...n].filter(([, c]) => c >= 3).map(([p]) => p));
}

export interface Broken extends Usage {
  value: string;
}

/** Strings shaped like an id of a known kind that no row has (a typo, a deleted row). Asset keys are skipped. */
export function brokenRefs(files: Files, extraKnown: ReadonlySet<string> = new Set()): Broken[] {
  const ids = rowIds(files);
  const prefixes = knownPrefixes(ids.keys());
  const out: Broken[] = [];
  for (const [file, doc] of Object.entries(files)) {
    walk(doc, [], (s, path, key) => {
      if (ASSET_KEYS.has(key) || !/^[a-z]+(_[a-z0-9]+)+$/.test(s)) return;
      if (prefixes.has(s.split('_')[0]!) && !ids.has(s) && !extraKnown.has(s)) out.push({ file, path: path.join(' › '), value: s });
    });
  }
  return out;
}
