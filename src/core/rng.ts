// Injected randomness. Core never creates a non-deterministic rng; the runtime one lives in src/store.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
}

/** Deterministic 32-bit PRNG used for tests and for clock-derived order generation (§8.14). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Seeded rng for tests. */
export const seededRng = (seed: number): Rng => mulberry32(seed);

/** Rng that replays fixed values in order (cycling), for edge-case tests like rng.next() = 0. */
export function sequenceRng(values: readonly number[]): Rng {
  let i = 0;
  return {
    next() {
      const v = values[i % values.length] ?? 0;
      i += 1;
      return v;
    },
  };
}

/** Stable seed for an order slot (DECISIONS Q3). */
export function orderSeed(windowIndex: number, slot: number): number {
  return ((windowIndex * 0x9e3779b1) ^ ((slot + 1) * 0x85ebca6b)) >>> 0;
}

/** Uniform pick from a non-empty list. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick from empty list');
  return items[Math.floor(rng.next() * items.length)] as T;
}
