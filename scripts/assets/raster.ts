// Minimal RGBA raster for placeholder art (pngjs only encodes/decodes; DECISIONS R04-1).
import { PNG } from 'pngjs';

export type Rgba = [number, number, number, number];

export class Raster {
  readonly data: Buffer;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = Buffer.alloc(width * height * 4);
  }

  private set(x: number, y: number, c: Rgba) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = c[3];
  }

  /** Fills where `inside(x + .5, y + .5)` within the bounding box. */
  private fill(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    c: Rgba,
    inside: (x: number, y: number) => boolean,
  ) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(this.height, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(this.width, Math.ceil(x1)); x++) {
        if (inside(x + 0.5, y + 0.5)) this.set(x, y, c);
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, c: Rgba) {
    this.fill(x, y, x + w, y + h, c, () => true);
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, c: Rgba) {
    this.fill(x, y, x + w, y + h, c, (px, py) => {
      const dx = Math.max(x + r - px, 0, px - (x + w - r));
      const dy = Math.max(y + r - py, 0, py - (y + h - r));
      return dx * dx + dy * dy <= r * r;
    });
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Rgba) {
    this.fill(
      cx - rx,
      cy - ry,
      cx + rx,
      cy + ry,
      c,
      (px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1,
    );
  }

  /** Vertical gradient over the whole canvas. */
  gradient(top: Rgba, bottom: Rgba) {
    for (let y = 0; y < this.height; y++) {
      const t = this.height === 1 ? 0 : y / (this.height - 1);
      const c = top.map((v, i) => Math.round(v + (bottom[i]! - v) * t)) as Rgba;
      this.rect(0, y, this.width, 1, c);
    }
  }

  toPng(): Buffer {
    const png = new PNG({ width: this.width, height: this.height });
    this.data.copy(png.data);
    return PNG.sync.write(png);
  }
}

/** Distinct, stable colour per id (hue from a string hash). */
export function colourFor(id: string, s = 0.55, l = 0.62): Rgba {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4), 255];
}

export const shade = (c: Rgba, k: number): Rgba => [
  Math.round(c[0] * k),
  Math.round(c[1] * k),
  Math.round(c[2] * k),
  c[3],
];
