// The particle atlas of the 3D layer (decision 059), painted by code on a canvas: 16 white shapes in a 4 × 4 grid (colour comes from
// the particle). A particle with a shape — a lick of flame, a puff, a streak, a drop, a leaf — reads at a glance where a soft dot did
// not. Every shape is original and drawn from primitives; nothing is loaded.
import * as THREE from 'three';
import { rng } from './effectParts';

/** Frames of the atlas, row by row. */
export const F = { soft: 0, flame: 1, smoke: 2, streak: 3, drop: 4, foam: 5, leaf: 6, shard: 7, star: 8, feather: 9, ember: 10, ring: 11, petal: 12, flake: 13, bubble: 14, disc: 15 } as const;
export type Frame = (typeof F)[keyof typeof F];

const CELL = 128;
const GRID = 4;
type Ctx = CanvasRenderingContext2D;

const radial = (g: Ctx, r: number, stops: readonly (readonly [number, number])[]) => {
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  for (const [at, a] of stops) gr.addColorStop(at, `rgba(255,255,255,${a})`);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, r, 0, 6.2832);
  g.fill();
};
/** Overlapping soft blobs: the body of a puff or of foam. */
const blobs = (g: Ctx, n: number, spread: number, r0: number, r1: number, a: number, seed: number) => {
  const rand = rng(seed);
  for (let i = 0; i < n; i++) {
    const ang = rand() * 6.2832;
    const d = Math.sqrt(rand()) * spread;
    g.save();
    g.translate(Math.cos(ang) * d, Math.sin(ang) * d);
    radial(g, r0 + rand() * (r1 - r0), [[0, a], [0.55, a * 0.6], [1, 0]]);
    g.restore();
  }
};
const path = (g: Ctx, pts: readonly (readonly [number, number])[], alpha = 1) => {
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  g.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.closePath();
  g.fill();
};

const DRAW: Record<Frame, (g: Ctx) => void> = {
  [F.soft]: (g) => radial(g, 60, [[0, 1], [0.3, 0.6], [0.65, 0.16], [1, 0]]),
  // A lick of flame: a teardrop pointing up, bright at the foot, with a side tongue.
  [F.flame]: (g) => {
    const lick = (sx: number, top: number, a: number) => {
      const gr = g.createLinearGradient(0, 50, 0, top);
      gr.addColorStop(0, `rgba(255,255,255,${a})`);
      gr.addColorStop(0.6, `rgba(255,255,255,${a * 0.7})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, 52);
      g.bezierCurveTo(-44 * sx, 40, -34 * sx, -6, -6 * sx, top);
      g.bezierCurveTo(8 * sx, -20, 40 * sx, 6, 30 * sx, 34);
      g.bezierCurveTo(24 * sx, 48, 10 * sx, 54, 0, 52);
      g.fill();
    };
    lick(1, -58, 0.95);
    g.save();
    g.translate(14, 12);
    g.scale(0.55, 0.6);
    lick(-1, -58, 0.7);
    g.restore();
  },
  [F.smoke]: (g) => blobs(g, 16, 26, 16, 30, 0.34, 11),
  // A spark streak along x: a hot head on the right and a thin tail.
  [F.streak]: (g) => {
    const gr = g.createLinearGradient(-60, 0, 58, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.7, 'rgba(255,255,255,.75)');
    gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-60, 0);
    g.quadraticCurveTo(20, -9, 58, 0);
    g.quadraticCurveTo(20, 9, -60, 0);
    g.fill();
    g.save();
    g.translate(46, 0);
    radial(g, 13, [[0, 1], [1, 0]]);
    g.restore();
  },
  // A drop of water: round below, a point above, a highlight.
  [F.drop]: (g) => {
    g.fillStyle = 'rgba(255,255,255,.82)';
    g.beginPath();
    g.moveTo(0, -54);
    g.bezierCurveTo(8, -26, 36, -4, 36, 18);
    g.arc(0, 18, 36, 0, Math.PI);
    g.bezierCurveTo(-36, -4, -8, -26, 0, -54);
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.save();
    g.translate(4, 22);
    radial(g, 22, [[0, 0.55], [1, 0]]);
    g.restore();
    g.globalCompositeOperation = 'source-over';
    g.save();
    g.translate(-13, 6);
    radial(g, 11, [[0, 1], [0.6, 0.8], [1, 0]]);
    g.restore();
  },
  [F.foam]: (g) => {
    const rand = rng(23);
    for (let i = 0; i < 22; i++) {
      const a = rand() * 6.2832;
      const d = Math.sqrt(rand()) * 40;
      g.save();
      g.translate(Math.cos(a) * d, Math.sin(a) * d);
      radial(g, 7 + rand() * 12, [[0, 0.95], [0.7, 0.8], [1, 0]]);
      g.restore();
    }
  },
  [F.leaf]: (g) => {
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath();
    g.moveTo(-56, 0);
    g.bezierCurveTo(-20, -40, 30, -30, 58, 0);
    g.bezierCurveTo(30, 30, -20, 40, -56, 0);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.28)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-50, 0);
    g.lineTo(52, 0);
    g.stroke();
  },
  [F.shard]: (g) => {
    path(g, [[-40, 30], [-18, -46], [34, -28], [48, 22], [6, 48]], 0.95);
    path(g, [[-18, -46], [34, -28], [4, 0]], 0.6);
    g.globalCompositeOperation = 'destination-out';
    path(g, [[4, 0], [48, 22], [6, 48]], 0.3);
    g.globalCompositeOperation = 'source-over';
  },
  // A four-point glint with a soft heart.
  [F.star]: (g) => {
    for (let i = 0; i < 4; i++) {
      g.rotate(Math.PI / 2);
      const len = i % 2 === 0 ? 60 : 38;
      const gr = g.createLinearGradient(0, 0, 0, -len);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(-6, 0);
      g.lineTo(0, -len);
      g.lineTo(6, 0);
      g.fill();
    }
    radial(g, 26, [[0, 1], [0.4, 0.5], [1, 0]]);
  },
  // A feather along x: a curved vane with barbs cut in, a bright shaft.
  [F.feather]: (g) => {
    const gr = g.createLinearGradient(-58, 0, 58, 0);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,.55)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-58, 2);
    g.bezierCurveTo(-30, -30, 26, -30, 60, -6);
    g.bezierCurveTo(30, 24, -24, 26, -58, 2);
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.strokeStyle = 'rgba(0,0,0,.75)';
    g.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) {
      const x = -30 + i * 15;
      g.beginPath();
      g.moveTo(x, -1);
      g.lineTo(x + 16, i % 2 ? -24 : 22);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(255,255,255,1)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-58, 2);
    g.quadraticCurveTo(0, -6, 58, -5);
    g.stroke();
  },
  [F.ember]: (g) => {
    path(g, [[-22, 6], [-6, -24], [24, -10], [16, 22], [-8, 24]], 1);
    radial(g, 44, [[0, 0.5], [1, 0]]);
  },
  [F.ring]: (g) => {
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 7;
    g.beginPath();
    g.arc(0, 0, 48, 0, 6.2832);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.3)';
    g.lineWidth = 16;
    g.stroke();
  },
  [F.petal]: (g) => {
    const gr = g.createLinearGradient(-50, 0, 54, 0);
    gr.addColorStop(0, 'rgba(255,255,255,.6)');
    gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-54, 0);
    g.bezierCurveTo(-30, -42, 40, -40, 56, -4);
    g.bezierCurveTo(50, 4, 50, 4, 56, 12);
    g.bezierCurveTo(36, 42, -30, 40, -54, 0);
    g.fill();
  },
  // A six-armed snow crystal.
  [F.flake]: (g) => {
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      g.rotate(Math.PI / 3);
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -54);
      g.stroke();
      g.lineWidth = 4;
      for (const y of [-24, -40]) {
        g.beginPath();
        g.moveTo(-12, y - 10);
        g.lineTo(0, y);
        g.lineTo(12, y - 10);
        g.stroke();
      }
    }
    radial(g, 16, [[0, 1], [1, 0]]);
  },
  // A bubble: a thin shell, a brighter rim below, two highlights.
  [F.bubble]: (g) => {
    radial(g, 54, [[0, 0.06], [0.7, 0.14], [0.9, 0.62], [0.97, 0.9], [1, 0]]);
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(0, 0, 40, Math.PI * 1.1, Math.PI * 1.45);
    g.stroke();
    g.save();
    g.translate(20, 24);
    radial(g, 8, [[0, 0.9], [1, 0]]);
    g.restore();
  },
  [F.disc]: (g) => radial(g, 56, [[0, 1], [0.8, 1], [1, 0]]),
};

let tex: THREE.CanvasTexture | null = null;
/** The shared atlas texture (white shapes with alpha, mipmapped). */
export function atlas(): THREE.CanvasTexture {
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = c.height = CELL * GRID;
  const g = c.getContext('2d')!;
  for (const f of Object.values(F)) {
    g.save();
    g.beginPath();
    g.rect((f % GRID) * CELL, Math.floor(f / GRID) * CELL, CELL, CELL);
    g.clip();
    g.translate((f % GRID) * CELL + CELL / 2, Math.floor(f / GRID) * CELL + CELL / 2);
    DRAW[f](g);
    g.restore();
  }
  tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
export const ATLAS_GRID = GRID;
