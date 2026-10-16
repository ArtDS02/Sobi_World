// The size of what is actually painted on a texture (its non-transparent box), measured once per texture key. Art is cut
// onto fixed canvases, so two pictures on the same canvas can be drawn at very different sizes; scenes use this to fit
// the drawing, not the canvas, into a slot.
import type * as Phaser from 'phaser';

const ALPHA_MIN = 20;
const cache = new Map<string, { width: number; height: number }>();

/** Width and height (texture px) of the painted part of texture `key`; the whole frame if it cannot be read. */
export function opaqueSize(scene: Phaser.Scene, key: string): { width: number; height: number } {
  const hit = cache.get(key);
  if (hit) return hit;
  const frame = scene.textures.getFrame(key);
  const whole = { width: frame?.width ?? 1, height: frame?.height ?? 1 };
  const source = frame?.source.image as CanvasImageSource | undefined;
  if (!frame || !source) return whole;
  const canvas = document.createElement('canvas');
  canvas.width = frame.cutWidth;
  canvas.height = frame.cutHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return whole;
  ctx.drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! <= ALPHA_MIN) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const size = x1 < 0 ? whole : { width: x1 - x0 + 1, height: y1 - y0 + 1 };
  cache.set(key, size);
  return size;
}
