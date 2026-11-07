// Automatic checks for rendered studio PNGs (plan §4.7) + old/new comparison sheets.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PNG } from 'pngjs';

export interface Img {
  width: number;
  height: number;
  data: Buffer;
}

export const readPng = (file: string): Img => PNG.sync.read(readFileSync(file));

export function writePng(file: string, img: Img): void {
  mkdirSync(dirname(file), { recursive: true });
  const png = new PNG({ width: img.width, height: img.height });
  img.data.copy(png.data);
  writeFileSync(file, PNG.sync.write(png));
}

export interface QaResult {
  errors: string[];
  warnings: string[];
  stats: { coverage: number; halo: number; touchesEdge: boolean };
}

/** Size, empty image, clipping at the canvas edge, light fringes on the anti-aliased edge. */
export function checkImage(
  img: Img,
  expect: { width: number; height: number; frameW: number; frameH: number },
): QaResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (img.width !== expect.width || img.height !== expect.height)
    errors.push(`size ${img.width}x${img.height}, expected ${expect.width}x${expect.height}`);
  let covered = 0;
  let edge = 0;
  let halo = 0;
  let touches = false;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const a = img.data[i + 3]!;
      if (a === 0) continue;
      covered++;
      const fx = x % expect.frameW;
      const fy = y % expect.frameH;
      if (fx === 0 || fy === 0 || fx === expect.frameW - 1 || fy === expect.frameH - 1)
        touches = true;
      if (a < 250) {
        edge++;
        const lum =
          (0.2126 * img.data[i]! + 0.7152 * img.data[i + 1]! + 0.0722 * img.data[i + 2]!) / 255;
        if (lum > 0.8) halo++;
      }
    }
  const coverage = covered / (img.width * img.height);
  if (covered === 0) errors.push('image is empty');
  if (touches) warnings.push('shape touches the frame edge (clipped?)');
  const haloRatio = edge ? halo / edge : 0;
  if (haloRatio > 0.05)
    warnings.push(`light halo on ${(haloRatio * 100).toFixed(1)}% of edge pixels`);
  return { errors, warnings, stats: { coverage, halo: haloRatio, touchesEdge: touches } };
}

/** Old file at a git ref (default: the pre-studio tag), or null. */
export function oldAsset(file: string, ref = 'pre-unity-studio'): Img | null {
  try {
    const buf = execFileSync('git', ['show', `${ref}:public/assets/${file}`], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return PNG.sync.read(buf);
  } catch {
    return null;
  }
}

function blank(w: number, h: number, bg: [number, number, number]): Img {
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const checker =
      ((Math.floor((i % w) / 16) + Math.floor(Math.floor(i / w) / 16)) & 1) === 0 ? 0 : 10;
    data[i * 4] = bg[0] - checker;
    data[i * 4 + 1] = bg[1] - checker;
    data[i * 4 + 2] = bg[2] - checker;
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

/** Alpha-composite src onto dst at (ox, oy), nearest-neighbour scaled by `scale`. */
export function blit(dst: Img, src: Img, ox: number, oy: number, scale = 1): void {
  const w = Math.round(src.width * scale);
  const h = Math.round(src.height * scale);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const sx = Math.min(src.width - 1, Math.floor(x / scale));
      const sy = Math.min(src.height - 1, Math.floor(y / scale));
      const si = (sy * src.width + sx) * 4;
      const di = (dy * dst.width + dx) * 4;
      const a = src.data[si + 3]! / 255;
      for (let c = 0; c < 3; c++)
        dst.data[di + c] = Math.round(src.data[si + c]! * a + dst.data[di + c]! * (1 - a));
    }
}

/** Side-by-side sheet: old (left) | new (right), same scale. */
export function compareSheet(oldImg: Img | null, newImg: Img, maxH = 520): Img {
  const srcH = Math.max(oldImg?.height ?? 0, newImg.height);
  const scale = Math.min(2, maxH / srcH);
  const ow = oldImg ? Math.round(oldImg.width * scale) : 0;
  const nw = Math.round(newImg.width * scale);
  const pad = 16;
  const out = blank(ow + nw + pad * 3, Math.round(srcH * scale) + pad * 2, [222, 232, 214]);
  if (oldImg) blit(out, oldImg, pad, pad, scale);
  blit(out, newImg, ow + pad * 2, pad, scale);
  return out;
}
