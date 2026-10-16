// The cloud tier on screen (decision 023, 028): presentation state, never saved. The scene sets it (its tier bar changes
// tiers); the bulk buttons act on it. -1 = the scene has not drawn yet (the buttons then use the highest owned tier).
let tier = -1;
const listeners = new Set<() => void>();

export const viewedTier = (): number => tier;

export function setViewedTier(next: number): void {
  if (next === tier) return;
  tier = next;
  for (const l of listeners) l();
}

/** Calls `l` on every change; returns the unsubscribe. */
export function onViewedTier(l: () => void): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}
