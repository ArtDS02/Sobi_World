// Ids that were renamed after release (decision 048, no third-party IP). A save written under an old id keeps working:
// every string value and object key naming a retired id is rewritten to its replacement before validation.
// Pure, idempotent and version-free (a renamed id never reappears), so it runs on every load.

export const RETIRED_IDS: Readonly<Record<string, string>> = {
  PIG_THOR: 'PIG_STORM',
  PIG_SUPERMAN: 'PIG_HERO',
  PIG_BATTLEBOT: 'PIG_WARBOT',
};

const RETIRED_RE = new RegExp(`\\b(${Object.keys(RETIRED_IDS).join('|')})\\b`, 'g');

const swap = (s: string): string => s.replace(RETIRED_RE, (id) => RETIRED_IDS[id] ?? id);

/** Deep copy of `value` with every retired id (in strings and in object keys) replaced by its successor. */
export function renameRetiredIds<T>(value: T): T {
  if (typeof value === 'string') return swap(value) as T;
  if (Array.isArray(value)) return value.map((v) => renameRetiredIds(v)) as T;
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[swap(k)] = renameRetiredIds(v);
    return out as T;
  }
  return value;
}
