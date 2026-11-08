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

export type ImportResult = { ok: true; value: unknown } | { ok: false; error: string };

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

export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      void (f ? f.text() : Promise.resolve(null)).then(resolve);
    };
    input.click();
  });
}
