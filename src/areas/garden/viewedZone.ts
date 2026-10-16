// The field zone on screen (decision 028): presentation state, never saved. The UI's zone switcher sets it and the bulk
// buttons act on it; the scene follows it with a slide. -1 = not chosen yet (the UI picks the highest owned zone).
type Listener = (zone: number, from: number) => void;

let zone = -1;
const listeners = new Set<Listener>();

export const viewedZone = (): number => zone;

export function setViewedZone(next: number): void {
  if (next === zone) return;
  const from = zone;
  zone = next;
  for (const l of listeners) l(next, from);
}

/** Calls `l` on every change; returns the unsubscribe. */
export function onViewedZone(l: Listener): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}
