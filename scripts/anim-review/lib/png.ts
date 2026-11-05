// PNG helpers on pngjs: decode, encode, and a pixel diff between two same-size pictures.
import { PNG } from 'pngjs';

export const decode = (buf: Buffer): PNG => PNG.sync.read(buf);
export const encode = (png: PNG): Buffer => PNG.sync.write(png);

export interface DiffResult {
  /** Pixels whose colour differs by more than the threshold (sum of channel differences). */
  changed: number;
  total: number;
  fraction: number;
  image: PNG;
}

/** Compare two pictures; the result image shows differences in red over a dimmed copy of `b`. Sizes must match. */
export function diff(a: PNG, b: PNG, threshold = 24): DiffResult {
  if (a.width !== b.width || a.height !== b.height) throw new Error(`size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  const image = new PNG({ width: a.width, height: a.height });
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i]! - b.data[i]!) + Math.abs(a.data[i + 1]! - b.data[i + 1]!) + Math.abs(a.data[i + 2]! - b.data[i + 2]!);
    const hit = d > threshold;
    if (hit) changed += 1;
    image.data[i] = hit ? 255 : b.data[i]! * 0.35;
    image.data[i + 1] = hit ? 40 : b.data[i + 1]! * 0.35;
    image.data[i + 2] = hit ? 40 : b.data[i + 2]! * 0.35;
    image.data[i + 3] = 255;
  }
  const total = a.width * a.height;
  return { changed, total, fraction: changed / total, image };
}
