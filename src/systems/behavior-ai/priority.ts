// Behaviour priority (ARCHITECTURE systems/behavior-ai): an activity runs until it is done or a more
// urgent want out-ranks it; free time is a weighted pick. The species decides the order and weights.

/** 0 = most urgent. */
export const rankIn = <B extends string>(order: readonly B[], b: B): number => order.indexOf(b);

/** Whether `want` is more urgent than what the creature is doing now. */
export const outranks = <B extends string>(order: readonly B[], want: B, current: B): boolean =>
  rankIn(order, want) < rankIn(order, current);

/** Weighted pick: `roll` in [0, 1) over the weights, in entry order; the last entry on overflow. */
export function pickWeighted<K extends string>(entries: readonly (readonly [K, number])[], roll: number): K {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = roll * total;
  for (const [k, w] of entries) {
    if (r < w) return k;
    r -= w;
  }
  return entries[entries.length - 1]![0];
}
