import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREED_IDS, BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { careRates } from '../../src/areas/farm/logic/config/care';
import { ERRORS } from '../../src/core/config/errors';
import type { BreedId } from '../../src/areas/farm/logic/config/ids';
import { levelFromXp, troughCapacityForLevel } from '../../src/areas/farm/logic/config/levels';
import { RARITY_VALUES, rarityRank } from '../../src/core/config/rarity';
import { MUTATIONS } from '../../src/areas/farm/logic/config/breedingRules';
import { breedingOutcomes } from '../../src/areas/farm/logic/breedingOdds';
import { vi } from '../../src/i18n/vi';

const V1: BreedId[] = ['PIG_EARTH_PINK', 'PIG_STRIPED_MELON', 'PIG_SUPERMAN', 'PIG_MYTHICAL'];
const BREEDABLE = BREED_IDS.filter((b) => BREEDS[b].breedable);
const odds = (a: BreedId, b: BreedId) =>
  Object.fromEntries(breedingOutcomes(a, b)!.map((o) => [o.breed, o.weight]));

describe('breeding rules (§6.5 as rules, U00-1 D4)', () => {
  it('every breedable pair has outcomes summing to 100, and A+B equals B+A', () => {
    for (const a of BREEDABLE) {
      for (const b of BREEDABLE) {
        const out = breedingOutcomes(a, b)!;
        expect(
          out.reduce((s, o) => s + o.weight, 0),
          `${a}:${b}`,
        ).toBeCloseTo(100, 9);
        expect(out).toEqual(breedingOutcomes(b, a));
      }
    }
  });

  it('LEGENDARY parents cannot breed (D10)', () => {
    for (const b of BREED_IDS) expect(breedingOutcomes('PIG_MYTHICAL', b)).toBeUndefined();
    for (const b of BREED_IDS) expect(breedingOutcomes(b, 'PIG_PHOENIX')).toBeUndefined();
  });

  it('pink x pink: mostly pink, then family, rare results rarer still', () => {
    const o = odds('PIG_EARTH_PINK', 'PIG_EARTH_PINK');
    expect(o.PIG_EARTH_PINK).toBeGreaterThan(50);
    expect(o.PIG_WHITE).toBeGreaterThan(o.PIG_STRIPED_MELON! / 2);
    expect(o.PIG_TIGER).toBeUndefined(); // two tiers up: never (MU-1, one tier at most)
    expect(o.PIG_KOI).toBeUndefined(); // three tiers up: never
  });

  it('same species beats different species; rarity lowers the odds', () => {
    for (const a of BREEDABLE) {
      const o = odds(a, a);
      const best = Math.max(...Object.values(o));
      expect(o[a], a).toBe(best);
      for (const [child, w] of Object.entries(o)) {
        const up = rarityRank(BREEDS[child as BreedId].rarity) - rarityRank(BREEDS[a].rarity);
        expect(up, `${a} -> ${child} (${w})`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('mutations add their special result (white x black can give a panda)', () => {
    expect(odds('PIG_WHITE', 'PIG_BLACK').PIG_PANDA).toBeGreaterThan(
      odds('PIG_WHITE', 'PIG_WHITE').PIG_PANDA ?? 0,
    );
    expect(odds('PIG_KOI', 'PIG_DRAGONLING').PIG_MYTHICAL).toBeGreaterThan(0);
  });

  it('A3 mutations give their new species', () => {
    const cases: [BreedId, BreedId, BreedId][] = [
      ['PIG_BLACK', 'PIG_BOAR', 'PIG_BUFFALO'],
      ['PIG_SPOTTED', 'PIG_BROWN', 'PIG_DEER'],
      ['PIG_EARTH_PINK', 'PIG_STRIPED_MELON', 'PIG_PUMPKIN'],
      ['PIG_BEE', 'PIG_PUMPKIN', 'PIG_SUNFLOWER'],
      ['PIG_BOAR', 'PIG_SHEEP', 'PIG_HEDGEHOG'],
      ['PIG_PENGUIN', 'PIG_STRIPED_MELON', 'PIG_TURTLE'],
      ['PIG_SUPERMAN', 'PIG_PENGUIN', 'PIG_ROBOT'],
      ['PIG_SHEEP', 'PIG_SUPERMAN', 'PIG_UNICORN'],
    ];
    for (const [a, b, child] of cases) expect(odds(a, b)[child], child).toBeGreaterThan(0);
  });

  it('mutations reference breedable parents and no duplicate pair → result', () => {
    const keys = MUTATIONS.map((m) => [...m.parents].sort().join('+') + '>' + m.result);
    expect(new Set(keys).size).toBe(keys.length);
    for (const m of MUTATIONS) for (const p of m.parents) expect(BREEDS[p].breedable, p).toBe(true);
  });

  it('every species can be obtained: bought, or bred from some pair', () => {
    const bred = new Set(
      BREEDABLE.flatMap((a) =>
        BREEDABLE.flatMap((b) => breedingOutcomes(a, b)!.map((o) => o.breed)),
      ),
    );
    for (const id of BREED_IDS) expect(BREEDS[id].buyGold !== null || bred.has(id), id).toBe(true);
  });
});

describe('care budgets (§6.2, D16 → NH-1)', () => {
  // NH-1: budget = max(floor, growthSec * ratio); the table is the check, the formula the truth.
  const table: Partial<Record<BreedId, [number, number, number, number, number]>> = {
    PIG_EARTH_PINK: [7200, 0.013889, 18000, 0.005556, 12600],
    PIG_STRIPED_MELON: [7200, 0.013889, 18000, 0.005556, 12600],
    PIG_SUPERMAN: [14400, 0.006944, 28800, 0.003472, 20160],
    PIG_MYTHICAL: [43200, 0.002315, 86400, 0.001157, 60480],
  };

  it.each(V1)('%s follows the growthSec formula', (id) => {
    const b = BREEDS[id];
    const [hungerFull, hungerPerSec, cleanFull, cleanPerSec, sickAt] = table[id]!;
    expect(b.hungerFullSec).toBe(
      Math.max(BALANCE.CARE_HUNGER_MIN_SEC, b.growthSec * BALANCE.CARE_HUNGER_GROWTH_RATIO),
    );
    expect(b.cleanFullSec).toBe(
      Math.max(BALANCE.CARE_CLEAN_MIN_SEC, b.growthSec * BALANCE.CARE_CLEAN_GROWTH_RATIO),
    );
    expect(b.hungerFullSec).toBe(hungerFull);
    expect(b.cleanFullSec).toBe(cleanFull);
    const rates = careRates(id);
    expect(rates.hungerPerSec).toBeCloseTo(hungerPerSec, 6);
    expect(rates.cleanPerSec).toBeCloseTo(cleanPerSec, 6);
    expect(rates.sickRiskStartSec).toBeCloseTo(sickAt, 6);
  });

  it('no species gets hungry within 2 h or dirty within 5 h of a full meal / bath', () => {
    for (const id of BREED_IDS) {
      expect(BREEDS[id].hungerFullSec).toBeGreaterThanOrEqual(2 * 3600);
      expect(BREEDS[id].cleanFullSec).toBeGreaterThanOrEqual(5 * 3600);
    }
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

describe('species (U01)', () => {
  it('every species has its own artwork, owned from the start', () => {
    const arts = BREED_IDS.map((id) => BREEDS[id].artId);
    expect(new Set(arts).size).toBe(BREED_IDS.length);
  });

  it('rarer species are worth more and take longer', () => {
    for (const a of BREED_IDS) {
      for (const b of BREED_IDS) {
        if (rarityRank(BREEDS[a].rarity) >= rarityRank(BREEDS[b].rarity)) continue;
        expect(BREEDS[a].sellGold, `${a} < ${b}`).toBeLessThan(BREEDS[b].sellGold);
        expect(BREEDS[a].growthSec).toBeLessThan(BREEDS[b].growthSec);
      }
    }
  });

  it('every rarity has at least one species; only LEGENDARY cannot breed', () => {
    for (const r of RARITY_VALUES) {
      const of = BREED_IDS.filter((id) => BREEDS[id].rarity === r);
      expect(of.length, r).toBeGreaterThan(0);
      for (const id of of) expect(BREEDS[id].breedable).toBe(r !== 'LEGENDARY');
    }
  });

  it('shop species cost less than they sell for at full happiness', () => {
    for (const id of BREED_IDS) {
      const def = BREEDS[id];
      if (def.buyGold !== null) expect(def.buyGold, id).toBeLessThan(def.sellGold);
    }
  });
});

describe('errors ↔ i18n', () => {
  it('every error code has a Vietnamese string', () => {
    const strings: Record<string, string> = vi.error;
    for (const code of ERRORS) expect(strings[code], code).toBeTruthy();
  });
});
