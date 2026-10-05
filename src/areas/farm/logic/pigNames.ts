// Default pig names (DECISIONS Q8): unused pool name, else the smallest free numeric suffix.
import { PIG_NAME_POOL } from './config/names';
import { pick, type Rng } from '../../../core/rng';
import type { Pig } from './types';

export function pickPigName(rng: Rng, living: readonly Pick<Pig, 'name'>[]): string {
  const taken = new Set(living.map((p) => p.name));
  const unused = PIG_NAME_POOL.filter((n) => !taken.has(n));
  if (unused.length > 0) return pick(rng, unused);
  const base = pick(rng, PIG_NAME_POOL);
  let k = 2;
  while (taken.has(`${base} ${k}`)) k += 1;
  return `${base} ${k}`;
}
