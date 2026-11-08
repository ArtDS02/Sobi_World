// Export / import of one content file as JSON (plan 8.4). Export downloads the draft as it is; import reads a file, checks it
// against the game's own schema and only then replaces the draft (nothing is written to the game until the normal save).
import type { z } from 'zod';

export function downloadJson(name: string, value: unknown): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' }));
  a.download = name.replaceAll('/', '__').replaceAll('\\', '__');
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadText(name: string, text: string, type: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name.replaceAll('/', '__').replaceAll('\\', '__');
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** The one list of rows with unique ids a file keeps (the CSV works on it), or null when there is none or several. */
export function listKeyOf(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const keys = Object.entries(value as Record<string, unknown>)
    // Rows are matched by id, so the ids must be unique (a layout lists the same prop many times: no CSV there).
    .filter(([, v]) => Array.isArray(v) && v.length > 0 && v.every((r) => r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string') && new Set(v.map((r) => (r as { id: string }).id)).size === v.length)
    .map(([k]) => k);
  return keys.length === 1 ? keys[0]! : null;
}

export type ImportResult ={ ok: true; value: unknown } | { ok: false; error: string };

/** Parses text and checks it with the file's schema; the error names the first problems in Vietnamese. */
export function checkImport(text: string, schema: z.ZodType | null): ImportResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Không phải JSON hợp lệ: ${(e as Error).message}` };
  }
  if (!schema) return { ok: true, value };
  const r = schema.safeParse(value);
  if (r.success) return { ok: true, value };
  const first = r.error.issues.slice(0, 5).map((i) => `${i.path.join(' › ') || '(gốc)'}: ${i.message}`);
  return { ok: false, error: `Game từ chối file này:\n${first.join('\n')}` };
}

export function pickJsonFile(accept = 'application/json,.json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      void (f ? f.text() : Promise.resolve(null)).then(resolve);
    };
    input.click();
  });
}
