import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkImport } from '../../tools/admin/contentIo';

const schema = z.object({ rows: z.array(z.object({ id: z.string(), n: z.number().min(0) })) });

describe('content import check (plan 8.4)', () => {
  it('accepts a valid file and returns its value', () => {
    expect(checkImport('{"rows":[{"id":"a","n":1}]}', schema)).toEqual({ ok: true, value: { rows: [{ id: 'a', n: 1 }] } });
  });
  it('refuses bad JSON and schema violations with a readable reason', () => {
    expect(checkImport('{nope', schema)).toMatchObject({ ok: false });
    const r = checkImport('{"rows":[{"id":"a","n":-1}]}', schema);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain('rows › 0 › n');
  });
  it('no schema: only JSON validity counts', () => {
    expect(checkImport('[1]', null)).toEqual({ ok: true, value: [1] });
  });
});
