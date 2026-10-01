import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../src/core/config/balance';
import { BREED_ART } from '../../src/core/config/breedArt';
import { BREEDING_MATRIX, breedingOutcomes, matrixKey } from '../../src/core/config/breedingMatrix';
import { BREED_IDS, BREEDS } from '../../src/core/config/breeds';
import { careRates } from '../../src/core/config/care';
import { ERRORS } from '../../src/core/config/errors';
import type { BreedId } from '../../src/core/config/ids';
import { levelFromXp, troughCapacityForLevel } from '../../src/core/config/levels';
import { SKINS } from '../../src/core/config/skins';
import { vi } from '../../src/i18n/vi';

const NON_MYTHICAL = BREED_IDS.filter((b) => b !== 'PIG_MYTHICAL');

describe('breeding matrix (§6.5)', () => {
  it('every entry sums to 100', () => {
    for (const [key, outcomes] of Object.entries(BREEDING_MATRIX)) {
      expect(outcomes.reduce((s, o) => s + o.weight, 0), key).toBe(100);
    }
  });

  it('A+B is the same entry as B+A and covers every non-MYTHICAL pair (D9)', () => {
    for (const a of NON_MYTHICAL) {
      for (const b of NON_MYTHICAL) {
        expect(matrixKey(a, b)).toBe(matrixKey(b, a));
        expect(breedingOutcomes(a, b)).toBeDefined();
        expect(breedingOutcomes(a, b)).toBe(breedingOutcomes(b, a));
      }
    }
  });

  it('has no MYTHICAL parent entry (D10)', () => {
    for (const b of BREED_IDS) expect(breedingOutcomes('PIG_MYTHICAL', b)).toBeUndefined();
  });
});

describe('care budgets (§6.2, D16)', () => {
  // Check table from §6.2; the source of truth is the formula on growthSec.
  const table: Record<BreedId, [number, number, number, number, number]> = {
    PIG_EARTH_PINK: [2400, 0.041667, 5400, 0.018519, 3780],
    PIG_STRIPED_MELON: [4800, 0.020833, 10800, 0.009259, 7560],
    PIG_SUPERMAN: [9600, 0.010417, 21600, 0.00463, 15120],
    PIG_MYTHICAL: [28800, 0.003472, 64800, 0.001543, 45360],
  };

  it.each(BREED_IDS)('%s follows the growthSec formula', (id) => {
    const b = BREEDS[id];
    const [hungerFull, hungerPerSec, cleanFull, cleanPerSec, sickAt] = table[id];
    expect(b.hungerFullSec).toBe(b.growthSec / 3);
    expect(b.cleanFullSec).toBe(b.growthSec * 0.75);
    expect(b.hungerFullSec).toBe(hungerFull);
    expect(b.cleanFullSec).toBe(cleanFull);
    const rates = careRates(id);
    expect(rates.hungerPerSec).toBeCloseTo(hungerPerSec, 6);
    expect(rates.cleanPerSec).toBeCloseTo(cleanPerSec, 6);
    expect(rates.sickRiskStartSec).toBeCloseTo(sickAt, 6);
  });
});

describe('levels (§6.4)', () => {
  it('derives level from xp thresholds', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(5700)).toBe(10);
    expect(levelFromXp(999999)).toBe(BALANCE.MAX_LEVEL);
  });

  it('trough capacity grows 10 per level, max 110 (DECISIONS Q6)', () => {
    expect(troughCapacityForLevel(1)).toBe(BALANCE.START_TROUGH_CAPACITY);
    expect(troughCapacityForLevel(BALANCE.MAX_LEVEL)).toBe(110);
  });
});

describe('art mapping (§6.6)', () => {
  it('every breed default skin exists and is a breed default', () => {
    for (const id of BREED_IDS) {
      const skin = SKINS[BREED_ART[id].defaultSkin];
      expect(skin, id).toBeDefined();
      expect(skin?.isBreedDefault).toBe(true);
    }
  });
});

describe('errors ↔ i18n', () => {
  it('every error code has a Vietnamese string', () => {
    const strings: Record<string, string> = vi.error;
    for (const code of ERRORS) expect(strings[code], code).toBeTruthy();
  });
});
