// What the ground is under a point of the plaza, from the layout's ground shapes (later shapes lie on top
// of earlier ones). Used for footstep dust: only dirt raises it. Pure.
import type { PlazaLayout } from '../../../../content/schemas/plaza/layout';

export type GroundKind = 'grass' | 'dirt' | 'stone' | 'sand' | 'water';

const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

export function groundKindAt(layout: PlazaLayout, x: number, y: number): GroundKind {
  const { width, height } = layout.designSize;
  let kind: GroundKind = 'grass';
  for (const s of layout.ground) {
    if (s.kind === 'ellipse') {
      const nx = (x - s.x * width) / ((s.width * width) / 2);
      const ny = (y - s.y * height) / ((s.height * height) / 2);
      if (nx * nx + ny * ny > 1) continue;
      kind = s.fill === 'water' || s.blocks ? 'water' : s.fill === 'stone' ? 'stone' : s.fill === 'sand' ? 'sand' : 'grass';
      continue;
    }
    for (let i = 1; i < s.points.length; i++) {
      const [ax, ay] = s.points[i - 1]!;
      const [bx, by] = s.points[i]!;
      if (distToSegment(x, y, ax * width, ay * height, bx * width, by * height) <= s.width / 2) {
        kind = 'dirt';
        break;
      }
    }
  }
  return kind;
}
