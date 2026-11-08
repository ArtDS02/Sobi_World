import { describe, expect, it } from 'vitest';
import { brokenRefs, knownPrefixes, rowIds, usages } from '../../tools/admin/refs';

const files = {
  'a/items.json': { items: [{ id: 'item_a' }, { id: 'item_b' }, { id: 'item_c' }] },
  'a/recipes.json': {
    recipes: [
      { id: 'recipe_x', inputs: [{ item: 'item_a' }, { item: 'item_gone' }], art: 'item_not_an_id_art' },
      { id: 'recipe_y', output: 'item_b', note: 'plain text' },
      { id: 'recipe_z' },
    ],
  },
};

describe('refs (plan 8.5 / 8.7)', () => {
  it('indexes row ids and finds uses without counting the row own id', () => {
    expect([...rowIds(files).keys()]).toContain('recipe_x');
    expect(usages(files, 'item_a')).toEqual([{ file: 'a/recipes.json', path: 'recipes › recipe_x › inputs[1] › item' }]);
    expect(usages(files, 'item_c')).toEqual([]);
    expect(usages(files, 'recipe_x')).toEqual([]);
  });
  it('known prefixes need three rows', () => {
    expect([...knownPrefixes(['item_a', 'item_b', 'item_c', 'recipe_x', 'recipe_y'])]).toEqual(['item']);
  });
  it('broken references: id-shaped strings of a known kind with no row; asset keys skipped', () => {
    expect(brokenRefs(files).map((b) => b.value)).toEqual(['item_gone']);
    expect(brokenRefs(files, new Set(['item_gone']))).toEqual([]);
  });
});
