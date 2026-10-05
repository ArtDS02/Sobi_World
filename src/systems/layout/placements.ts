// Placed objects of an Area's layout (ARCHITECTURE systems/layout): drawn back to front by layer,
// stable within a layer (file order).

export interface Layered {
  layer: number;
}

/** Placements back to front; `layer` keeps one layer only. */
export function placementsInOrder<P extends Layered>(placements: readonly P[], layer?: number): P[] {
  return placements
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => layer === undefined || p.layer === layer)
    .sort((a, b) => a.p.layer - b.p.layer || a.i - b.i)
    .map(({ p }) => p);
}
