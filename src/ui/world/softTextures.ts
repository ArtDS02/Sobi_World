// Three tiny generated textures the world scenes share: a soft ellipse (shadows), a soft round glow (lamps,
// the portal) and a hard dot (droplets, sparkles, dust). Drawn once into the texture manager; no files.
import type * as Phaser from 'phaser';

export const SOFT_SHADOW = 'soft_shadow';
export const SOFT_GLOW = 'soft_glow';
export const DOT = 'soft_dot';

const SIZE = 128;

function radial(scene: Phaser.Scene, key: string, stops: [number, string][], squash = 1) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, SIZE, SIZE)!;
  const ctx = tex.getContext();
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.scale(1, squash);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, SIZE / 2);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(-SIZE / 2, -SIZE / (2 * squash), SIZE, SIZE / squash);
  ctx.restore();
  tex.refresh();
}

export function ensureSoftTextures(scene: Phaser.Scene) {
  radial(scene, SOFT_SHADOW, [[0, 'rgba(0,0,0,0.9)'], [0.6, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
  radial(scene, SOFT_GLOW, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
  if (!scene.textures.exists(DOT)) {
    const tex = scene.textures.createCanvas(DOT, 4, 4)!;
    const ctx = tex.getContext();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 4, 4);
    tex.refresh();
  }
}
