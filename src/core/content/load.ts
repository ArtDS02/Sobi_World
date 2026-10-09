// Content loading (ARCHITECTURE §8): every content file is validated against its schema when the game
// (or the admin dashboard, or a test) first imports it. A bad file stops the start with a readable
// error naming the file and the field — a development bug, never a player state.
import type { z } from 'zod';

export class ContentError extends Error {
  constructor(
    readonly file: string,
    readonly issues: readonly string[],
  ) {
    super(`content/${file}:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'ContentError';
  }
}

/** Readable lines of a zod error: `path.to.field: message`. */
export const issueLines = (error: z.ZodError): string[] =>
  error.issues.map((i) => `${i.path.join('.') || '(file)'}: ${i.message}`);

/** `raw` (the imported JSON of content/`file`) validated by `schema`; throws ContentError. */
export function loadContent<S extends z.ZodType>(file: string, schema: S, raw: unknown): z.output<S> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ContentError(file, issueLines(parsed.error));
  return parsed.data;
}
