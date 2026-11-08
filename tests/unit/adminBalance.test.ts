import { describe, expect, it } from 'vitest';
import { columns, isOutlier, numbersOf, zScore } from '../../tools/admin/balance';

describe('balance table (plan 8.6)', () => {
  it('flattens nested numbers and ignores text, arrays and NaN', () => {
    expect(numbersOf({ id: 'a', hp: 5, stats: { atk: 2, def: NaN }, tags: [1], n: 'x' })).toEqual({ hp: 5, 'stats.atk': 2 });
  });
  it('needs three values and some spread to make a column; outliers are ≥ 2σ away', () => {
    const rows = [{ hp: 10, f: 1 }, { hp: 11, f: 1 }, { hp: 9, f: 1 }, { hp: 10, f: 1 }, { hp: 10, f: 1 }, { hp: 10, f: 1 }, { hp: 60, f: 1 }];
    const cols = columns(rows);
    expect(cols.map((c) => c.key)).toEqual(['hp']); // f is flat
    const hp = cols[0]!;
    expect(isOutlier(60, hp)).toBe(true);
    expect(isOutlier(10, hp)).toBe(false);
    expect(zScore(5, { key: 'x', mean: 5, std: 0 })).toBe(0);
    expect(columns([{ a: 1 }, { a: 2 }])).toEqual([]);
  });
});
