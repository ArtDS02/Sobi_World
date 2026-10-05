// Pig name plates (U05): each plate wants to sit centred under its pig's feet; a plate that
// would overlap one already placed moves down a row, up to `maxShift` rows. Pure, O(n²) for the
// few dozen pigs a farm holds.
export interface PlateRequest {
  id: string;
  /** Centre x and top y the plate wants, in design pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatePlace {
  x: number; // centre
  y: number; // top
}

const overlaps = (a: PlateRequest, ay: number, b: PlateRequest, by: number) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w && ay < by + b.h && by < ay + a.h;

export function layoutNameplates(
  plates: readonly PlateRequest[],
  rowGap: number,
  maxShift: number,
): Map<string, PlatePlace> {
  const order = [...plates].sort((a, b) => a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1));
  const placed: { p: PlateRequest; y: number }[] = [];
  const out = new Map<string, PlatePlace>();
  for (const p of order) {
    let y = p.y;
    for (let k = 0; k <= maxShift; k += 1) {
      y = p.y + k * (p.h + rowGap);
      if (!placed.some((q) => overlaps(p, y, q.p, q.y))) break;
    }
    placed.push({ p, y });
    out.set(p.id, { x: p.x, y });
  }
  return out;
}
