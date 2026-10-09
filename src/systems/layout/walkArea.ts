// Walk area geometry (ARCHITECTURE systems/layout): creatures move in the ellipse inscribed in the
// layout's walk area (normalised rect of the design frame). Pure, design pixels.

export interface Size {
  width: number;
  height: number;
}
/** A rect in fractions of the design size. */
export interface NormRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}
export interface Point {
  x: number;
  y: number;
}

export function walkEllipse(design: Size, area: NormRect): Ellipse {
  return {
    cx: (area.x + area.width / 2) * design.width,
    cy: (area.y + area.height / 2) * design.height,
    rx: (area.width / 2) * design.width,
    ry: (area.height / 2) * design.height,
  };
}

/** Point of the ellipse for unit square coordinates (u, v), area-uniform. */
export function ellipsePoint(e: Ellipse, u: number, v: number): Point {
  const r = Math.sqrt(u);
  const t = v * Math.PI * 2;
  return { x: e.cx + Math.cos(t) * r * e.rx, y: e.cy + Math.sin(t) * r * e.ry };
}

export const insideEllipse = (e: Ellipse, p: Point): boolean =>
  Math.hypot((p.x - e.cx) / e.rx, (p.y - e.cy) / e.ry) <= 1 + 1e-6;

/** `p` moved onto the ellipse when outside (unchanged when inside). */
export function clampToEllipse(e: Ellipse, p: Point): Point {
  const nx = (p.x - e.cx) / e.rx;
  const ny = (p.y - e.cy) / e.ry;
  const d = Math.hypot(nx, ny);
  return d <= 1 ? p : { x: e.cx + (nx / d) * e.rx, y: e.cy + (ny / d) * e.ry };
}

/**
 * Gentle push between creatures closer than `gap`: each one of a pair moves half the overlap away, at
 * most `maxStep`. Coincident ones split along an angle from `hash` of their ids.
 */
export function separation(
  items: readonly ({ id: string } & Point)[],
  gap: number,
  maxStep: number,
  hash: (text: string) => number,
): Map<string, { dx: number; dy: number }> {
  const out = new Map<string, { dx: number; dy: number }>();
  const add = (id: string, dx: number, dy: number) => {
    const o = out.get(id) ?? { dx: 0, dy: 0 };
    out.set(id, { dx: o.dx + dx, dy: o.dy + dy });
  };
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!;
      const b = items[j]!;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= gap) continue;
      if (d < 1e-6) {
        const t = (hash(`${a.id}|${b.id}`) % 360) * (Math.PI / 180);
        dx = Math.cos(t);
        dy = Math.sin(t);
      } else {
        dx /= d;
        dy /= d;
      }
      const step = Math.min(maxStep, (gap - d) / 2);
      add(a.id, -dx * step, -dy * step);
      add(b.id, dx * step, dy * step);
    }
  }
  return out;
}
