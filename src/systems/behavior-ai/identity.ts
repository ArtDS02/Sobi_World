// Deterministic per-creature randomness (DECISIONS PL-1): rolls and personality traits derived from
// the creature id, so behaviour survives save / load without being stored and replays in tests.

/** FNV-1a 32-bit hash of a string. */
export function idHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic roll in [0, 1] for (id, step, salt). */
export const idRoll = (id: string, step: number, salt: number): number => (idHash(`${id}:${step}:${salt}`) % 10007) / 10006;

/** Traits 0..1 fixed per id (salt 100 + index, step 0). */
export function traitsOf<T extends string>(id: string, names: readonly T[]): Record<T, number> {
  const out = {} as Record<T, number>;
  names.forEach((t, i) => (out[t] = idRoll(id, 0, 100 + i)));
  return out;
}

/** A 0..1 trait as a multiplier around 1, at most ±spread. */
export const traitScale = (t: number, spread: number): number => 1 + spread * (2 * t - 1);
