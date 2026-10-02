import { describe, expect, it } from 'vitest';
import { BREED_IDS, BREEDS, FAMILY_VALUES } from '../../src/core/config/breeds';
import { BREED_ID_VALUES, type BreedId } from '../../src/core/config/ids';
import { SPECIES_ROWS } from '../../src/core/config/speciesTable';
import { breedingOutcomes } from '../../src/core/engine/breedingOdds';
import { buyPig } from '../../src/core/actions/buyPig';
import { shopPigs } from '../../src/ui/actionsVm';
import { ctx } from './actionKit';
import { makeState } from './stateFactory';

/** Runs `fn` with one species retired, restoring it afterwards. */
function retired<T>(id: BreedId, fn: () => T): T {
  BREEDS[id].enabled = false;
  try {
    return fn();
  } finally {
    BREEDS[id].enabled = true;
  }
}

describe('species table (A7-1)', () => {
  it('has exactly one row per id of BREED_ID_VALUES', () => {
    const ids = SPECIES_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...BREED_ID_VALUES].sort());
    expect(BREED_IDS).toEqual(ids);
  });

  it('every family is a known one and every species is enabled by default', () => {
    for (const id of BREED_IDS) {
      expect(FAMILY_VALUES, id).toContain(BREEDS[id].family);
      expect(BREEDS[id].enabled, id).toBe(true);
    }
  });

  it('a retired species is never bred, even from its own pair or mutation', () => {
    retired('PIG_PANDA', () => {
      for (const a of BREED_IDS.filter((b) => BREEDS[b].breedable)) {
        expect(breedingOutcomes(a, 'PIG_WHITE')?.some((o) => o.breed === 'PIG_PANDA')).toBeFalsy();
      }
      expect(breedingOutcomes('PIG_WHITE', 'PIG_BLACK')!.reduce((s, o) => s + o.weight, 0)).toBeCloseTo(100);
    });
  });

  it('a retired species is not sold', () => {
    const state = makeState();
    retired('PIG_EARTH_PINK', () => {
      expect(shopPigs(state, 0).some((p) => p.breed === 'PIG_EARTH_PINK')).toBe(false);
      const r = buyPig(state, { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx());
      expect(r.ok).toBe(false);
    });
  });
});
