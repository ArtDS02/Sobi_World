// Quality (spec §6, §7; GAME_BALANCE §2.5): the tier of care a creature got, from its average mood
// over its life; bond can lift it one tier. Separate from rarity. Pure: the bond roll is injected.
import { QUALITY_VALUES, type Quality } from '../../../content/schemas/vocab';
import { CONTENT } from '../../core/config/content';
import type { Rng } from '../../core/rng';

export { QUALITY_VALUES, type Quality };

export interface QualityRules {
  minMood: Readonly<Record<Exclude<Quality, 'NORMAL'>, number>>;
  priceFactor: Readonly<Record<Quality, number>>;
  bond: { minHearts: number; upgradeChance: number };
}

/** Tier of an average mood (0-100). */
export function qualityFromMood(avgMood: number, rules: QualityRules): Quality {
  for (const q of ['PERFECT', 'EXCELLENT', 'GREAT', 'GOOD'] as const) {
    if (avgMood >= rules.minMood[q]) return q;
  }
  return 'NORMAL';
}

/** One tier higher (capped) when bond has enough hearts and the roll succeeds. */
export function withBond(q: Quality, hearts: number, rng: Rng, rules: QualityRules): Quality {
  if (hearts < rules.bond.minHearts || q === 'PERFECT') return q;
  return rng.next() < rules.bond.upgradeChance ? QUALITY_VALUES[QUALITY_VALUES.indexOf(q) + 1]! : q;
}

/** Running average mood: `avg` over `samples` samples, plus one sample of `mood`. */
export const addMoodSample = (avg: number, samples: number, mood: number): { avg: number; samples: number } => ({
  avg: (avg * samples + mood) / (samples + 1),
  samples: samples + 1,
});

/** The shipped tiers (content/shared/quality.json). */
export const QUALITY_RULES: QualityRules = CONTENT.quality;
