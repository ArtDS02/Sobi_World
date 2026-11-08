// D5: the pair score and the best-partner choice (pure).
import { describe, expect, it } from 'vitest';
import { bestPartner, scorePair } from '../../src/areas/farm/logic/pairSuggest';
import { BREED_IDS } from '../../src/areas/farm/logic/config/breeds';
import { breedingOutcomes } from '../../src/areas/farm/logic/breedingOdds';
import { makePig } from './pigFactory';

const breed = BREED_IDS[0]!;

describe('pair suggestion (D5)', () => {
  it('a pair whose children are all new scores higher than the same pair when the Codex has them', () => {
    const a = makePig({ breed });
    const b = makePig({ breed });
    const kids = (breedingOutcomes(breed, breed) ?? []).map((o) => o.breed);
    const none = scorePair(a, b, new Set());
    const all = scorePair(a, b, new Set(kids));
    expect(none.newChance).toBeCloseTo(1, 6);
    expect(all.newChance).toBe(0);
    expect(none.score).toBeGreaterThan(all.score);
  });

  it('shared ancestors lower the score and are counted', () => {
    const ancestor = { name: 'Cụ', breed, gender: 'FEMALE' as const, generation: 1 };
    const kin = (name: string) => makePig({ breed, lineage: { mother: ancestor, father: { ...ancestor, name: `${name}-cha`, gender: 'MALE' as const } } });
    const unrelated = makePig({ breed });
    const related = scorePair(kin('x'), kin('y'), new Set());
    const clean = scorePair(kin('x'), unrelated, new Set());
    expect(related.sharedAncestors).toBeGreaterThan(0);
    expect(related.score).toBeLessThan(clean.score);
  });

  it('bestPartner picks the highest score, never recommends when there is only one partner', () => {
    const self = makePig({ breed });
    const ancestor = { name: 'Cụ', breed, gender: 'FEMALE' as const, generation: 1 };
    const withKin = makePig({ breed, lineage: { mother: ancestor } });
    const selfKin = makePig({ breed, lineage: { mother: ancestor } });
    const stranger = makePig({ breed });
    expect(bestPartner(selfKin, [withKin, stranger], new Set())).toBe(1);
    expect(bestPartner(self, [stranger], new Set())).toBe(-1);
    expect(bestPartner(self, [], new Set())).toBe(-1);
  });
});
