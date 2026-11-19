// Cracks drawn in code over a cracked boulder (the element gates `look: 'crack'`): dark jagged fissures with a lighter lip, a card that
// stands just in front of the stone's picture. The same lines every time (seeded), no new art.
import { hash2 } from './noise';
import { texture, type Card } from './textures';

let cached: Card | null = null;

export function crackCard(): Card {
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.lineCap = g.lineJoin = 'round';
  // A main fissure from the top to the bottom with a few branches: each walks down with a jitter.
  const walk = (x: number, y: number, dx: number, steps: number, seed: number, width: number) => {
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i += 1) {
      x += dx + (hash2(seed, i, 5) - 0.5) * 34;
      y += 12 + hash2(seed, i, 6) * 14;
      pts.push([x, y]);
    }
    for (const [col, w] of [['rgba(214,196,160,0.55)', width + 4], ['#2a2018', width]] as const) {
      g.strokeStyle = col;
      g.lineWidth = w;
      g.beginPath();
      pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
      g.stroke();
    }
    return pts;
  };
  const main = walk(120, 8, 2, 17, 1, 7);
  [[4, -26, 5, 2, 4], [9, 24, 6, 3, 4], [12, -20, 4, 4, 3]].forEach(([at, dx, steps, seed, w]) => {
    const [x, y] = main[at!]!;
    walk(x, y, dx!, steps!, seed!, w!);
  });
  cached = { tex: texture(c), aspect: 1 };
  return cached;
}

export function disposeCracks() {
  cached?.tex.dispose();
  cached = null;
}
