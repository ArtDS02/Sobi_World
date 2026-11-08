import { describe, expect, it } from 'vitest';
import { describeChanges, diffValues } from '../../tools/admin/diff';

describe('content diff (plan 7.3)', () => {
  const before = { items: [{ id: 'a', price: 10, name: 'A' }, { id: 'b', price: 5 }], rate: 0.5, tags: ['x', 'y'] };
  it('matches rows by id: added, removed, changed field, with names', () => {
    const after = { items: [{ id: 'a', price: 12, name: 'A' }, { id: 'c', price: 1 }], rate: 0.5, tags: ['x', 'z'] };
    const names: Record<string, string> = { a: 'Cỏ', b: 'Nước', c: 'Sữa' };
    const lines = describeChanges(diffValues(before, after, (id) => names[id] ?? id));
    expect(lines).toEqual(['✎ items › Cỏ › price: 10 → 12', '＋ items › Sữa', '－ items › Nước', '✎ tags › [2]: "y" → "z"']);
  });
  it('no change gives no lines; a new key and a removed key show', () => {
    expect(diffValues(before, structuredClone(before))).toEqual([]);
    expect(describeChanges(diffValues({ a: 1 }, { b: 2 }))).toEqual(['－ a', '＋ b: 2']);
  });
  it('arrays of different length are one change', () => {
    expect(describeChanges(diffValues({ t: [1] }, { t: [1, 2] }))).toEqual(['✎ t: [1] → [1,2]']);
  });
});
