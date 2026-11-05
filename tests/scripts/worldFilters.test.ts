import { describe, expect, it } from 'vitest';
import { cascade, facetOptions, matchesQuery, reconcile } from '../../tools/admin/worldFilters';

interface Row { id: string; zone: string; status: string }
const rows: Row[] = [
  { id: 'a1', zone: 'forest', status: 'published' },
  { id: 'a2', zone: 'forest', status: 'draft' },
  { id: 'b1', zone: 'mountain', status: 'published' },
  { id: 'c1', zone: 'ruins', status: 'disabled' },
];
const zone = { of: (r: Row) => r.zone, label: (v: string) => v.toUpperCase(), order: ['forest', 'mountain', 'ruins', 'coast'] };
const status = { of: (r: Row) => r.status, label: (v: string) => v, order: ['published', 'draft', 'disabled'] };

describe('worldFilters', () => {
  it('offers only values that exist, ordered, with counts', () => {
    expect(facetOptions(rows, zone)).toEqual([
      { value: 'forest', label: 'FOREST', count: 2 },
      { value: 'mountain', label: 'MOUNTAIN', count: 1 },
      { value: 'ruins', label: 'RUINS', count: 1 },
    ]);
  });

  it('narrows the child list by the parent choice', () => {
    const c = cascade(rows, zone, status, { a: 'forest', b: '' });
    expect(c.bFacets.map((f) => f.value)).toEqual(['published', 'draft']);
    expect(c.shown.map((r) => r.id)).toEqual(['a1', 'a2']);
  });

  it('resets a choice that is no longer valid', () => {
    const c = cascade(rows, zone, status, { a: 'ruins', b: 'published' });
    expect(c.b).toBe('');
    expect(c.a).toBe('ruins');
    expect(c.shown.map((r) => r.id)).toEqual(['c1']);
  });

  it('resets a value that vanished from the data', () => {
    expect(reconcile('coast', facetOptions(rows, zone))).toBe('');
    expect(reconcile('forest', facetOptions(rows, zone))).toBe('forest');
    expect(cascade(rows, zone, status, { a: 'coast', b: '' }).shown).toHaveLength(4);
  });

  it('searches names and ids case-insensitively', () => {
    expect(matchesQuery('  FOR', 'Forest edge', 'map_x')).toBe(true);
    expect(matchesQuery('zzz', 'Forest edge', 'map_x')).toBe(false);
    expect(matchesQuery('', 'anything')).toBe(true);
  });
});
