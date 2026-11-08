// Pair suggestions (D5): how promising a pair is for the player's breeding, from what is already known. Pure and
// deterministic. A pair scores for children the Codex does not have yet and for rarity, and loses for shared
// ancestors (inbreeding). The shown hint is the highest-scoring partner of a pig.
import { flattenAncestors } from '../../../systems/breeding';
import { breedingOutcomes } from './breedingOdds';
import { BREEDS } from './config/breeds';
import { rarityRank } from '../../../core/config/rarity';
import type { Pig } from './types';

export interface PairScore {
  score: number;
  /** Chance (0–1) that the litter holds at least one species the Codex lacks. */
  newChance: number;
  /** Ancestors the two share (names + species + generation). */
  sharedAncestors: number;
}

const ancestorKeys = (p: Pick<Pig, 'lineage'>): Set<string> =>
  new Set(p.lineage ? flattenAncestors(p.lineage).map((a) => `${a.name}|${a.breed}|${a.generation}`) : []);

export function scorePair(a: Pick<Pig, 'breed' | 'lineage'>, b: Pick<Pig, 'breed' | 'lineage'>, discovered: ReadonlySet<string>): PairScore {
  const outcomes = breedingOutcomes(a.breed, b.breed) ?? [];
  let newChance = 0;
  let value = 0;
  for (const o of outcomes) {
    const p = o.weight / 100;
    const isNew = !discovered.has(o.breed);
    if (isNew) newChance += p;
    // A new species is worth much more than a known one; among known ones higher rarity is worth more.
    value += p * (isNew ? 5 : 0.5 + rarityRank(BREEDS[o.breed].rarity) * 0.25);
  }
  const mine = ancestorKeys(a);
  const sharedAncestors = [...ancestorKeys(b)].filter((k) => mine.has(k)).length;
  return { score: value - sharedAncestors * 1.5, newChance: Math.min(1, newChance), sharedAncestors };
}

/** Index of the best partner (first on a tie) among `partners`, or -1 when there is none or nothing beats a plain litter. */
export function bestPartner(self: Pick<Pig, 'breed' | 'lineage'>, partners: readonly Pick<Pig, 'breed' | 'lineage'>[], discovered: ReadonlySet<string>): number {
  let best = -1;
  let top = -Infinity;
  partners.forEach((p, i) => {
    const s = scorePair(self, p, discovered).score;
    if (s > top + 1e-9) {
      top = s;
      best = i;
    }
  });
  return partners.length > 1 ? best : -1; // with a single partner there is nothing to recommend
}
