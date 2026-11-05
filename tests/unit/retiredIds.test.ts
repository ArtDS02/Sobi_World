import { describe, expect, it } from 'vitest';
import { RETIRED_IDS, renameRetiredIds } from '../../src/core/save/retiredIds';

describe('retired ids (decision 048)', () => {
  it('rewrites retired ids in values, keys and nested data', () => {
    const old = {
      pigs: [{ breed: 'PIG_THOR' }, { breed: 'PIG_SUPERMAN' }, { breed: 'PIG_BATTLEBOT' }, { breed: 'PIG_PIGLET' }],
      collection: { seen: { 'breed:PIG_THOR': 3 }, PIG_SUPERMAN: true },
      team: ['PIG_BATTLEBOT'],
    };
    expect(renameRetiredIds(old)).toEqual({
      pigs: [{ breed: 'PIG_STORM' }, { breed: 'PIG_HERO' }, { breed: 'PIG_WARBOT' }, { breed: 'PIG_PIGLET' }],
      collection: { seen: { 'breed:PIG_STORM': 3 }, PIG_HERO: true },
      team: ['PIG_WARBOT'],
    });
  });

  it('is idempotent and never maps to another retired id', () => {
    const once = renameRetiredIds({ a: 'PIG_THOR' });
    expect(renameRetiredIds(once)).toEqual(once);
    for (const next of Object.values(RETIRED_IDS)) expect(RETIRED_IDS[next]).toBeUndefined();
  });

  it('leaves unrelated ids and numbers alone', () => {
    const v = { n: 4, ok: true, nothing: null, id: 'PIG_THORNY_X', list: [1, 'PIG_ROBOT'] };
    expect(renameRetiredIds(v)).toEqual(v);
  });
});
