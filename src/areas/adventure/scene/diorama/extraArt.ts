// More pictures for the diorama (G0, round 3), made in code from what exists: the sunlit leaf clumps of a tree picture (its bright
// inner parts, cut from the picture itself, for a front crown layer that moves on its own), reeds for the banks, and a bird.
import * as THREE from 'three';
import { rng } from './noise';
import { texture, type Card } from './textures';

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!] as const;
};

/**
 * The bright, inner leaf clumps of a card (away from its outline, in its upper three quarters), on transparent: laid a little in
 * front of the tree and swaying more, they make the crown read as layers of leaves.
 */
export function leafLayer(card: Card): Card {
  const src = card.tex.image as HTMLCanvasElement;
  const w = src.width;
  const h = src.height;
  const [c, g] = canvas(w, h);
  const [, mg] = canvas(w, h);
  // Inside of the outline: the blurred alpha stays high only well within the shape.
  mg.filter = `blur(${Math.max(2, Math.round(w * 0.035))}px)`;
  mg.drawImage(src, 0, 0);
  const inner = mg.getImageData(0, 0, w, h).data;
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, w, h);
  const px = img.data;
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      const o = (y * w + x) * 4;
      const lum = (px[o]! * 0.3 + px[o + 1]! * 0.59 + px[o + 2]! * 0.11) / 255;
      const deep = Math.min(1, Math.max(0, (inner[o + 3]! / 255 - 0.82) / 0.12));
      const high = Math.min(1, Math.max(0, (lum - 0.5) / 0.12));
      const top = y < h * 0.78 ? 1 : 0;
      px[o + 3] = Math.round(px[o + 3]! * deep * high * top);
    }
  g.putImageData(img, 0, 0);
  return { tex: texture(c), aspect: card.aspect };
}

/** A clump of reeds: thin dark blades, a few brown heads. */
export function reedCard(seed: number): Card {
  const [c, g] = canvas(96, 160);
  const r = rng(seed);
  for (let i = 0; i < 9; i += 1) {
    const x = 22 + r() * 52;
    const lean = (r() - 0.5) * 22;
    const top = 20 + r() * 50;
    g.strokeStyle = ['#4d7a2e', '#5f8f35', '#6e9c3c', '#3f6a28'][i % 4]!;
    g.lineWidth = 3 + r() * 2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, 160);
    g.quadraticCurveTo(x + lean * 0.4, (160 + top) / 2, x + lean, top);
    g.stroke();
    if (i % 3 === 0) {
      g.fillStyle = '#7a4a26';
      g.beginPath();
      g.ellipse(x + lean, top + 8, 4, 11, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  return { tex: texture(c), aspect: 96 / 160 };
}

/** A small bird seen from above, wings spread (flapping is a squash of the picture). */
export function birdTexture(): THREE.Texture {
  const [c, g] = canvas(64, 32);
  g.fillStyle = '#2b2f36';
  g.beginPath();
  g.moveTo(32, 18);
  g.quadraticCurveTo(18, 4, 2, 10);
  g.quadraticCurveTo(18, 10, 30, 22);
  g.lineTo(34, 22);
  g.quadraticCurveTo(46, 10, 62, 10);
  g.quadraticCurveTo(46, 4, 32, 18);
  g.fill();
  return texture(c);
}

const softened = new WeakMap<THREE.Texture, Card>();
/**
 * A picture cut off by its own frame (a log running out of the picture) with those edges dissolved: alpha fades over `top` / `right`
 * (shares of the picture) so the cut melts into the foliage round it instead of showing as a straight edge.
 */
export function softEdges(card: Card, edges: { top?: number; right?: number }): Card {
  const have = softened.get(card.tex);
  if (have) return have;
  const src = card.tex.image as HTMLCanvasElement;
  const [c, g] = canvas(src.width, src.height);
  g.drawImage(src, 0, 0);
  // Erase more and more towards the edge: nothing at the start of the band, all of it at the edge.
  g.globalCompositeOperation = 'destination-out';
  const band = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = grad;
    g.fillRect(rx, ry, rw, rh);
  };
  const [tw, th] = [src.width, src.height];
  if (edges.top) band(0, th * edges.top, 0, 0, 0, 0, tw, th * edges.top);
  if (edges.right) band(tw * (1 - edges.right), 0, tw, 0, tw * (1 - edges.right), 0, tw * edges.right, th);
  const out: Card = { tex: texture(c), aspect: card.aspect, normal: card.normal };
  softened.set(card.tex, out);
  return out;
}
