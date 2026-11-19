// Pictures for the diorama prototype (G0): the kit's painted art as standing cards (its painted ground shadow removed, since the
// diorama casts real shadows, and cropped to what is drawn so the foot sits on the ground), and a few small textures drawn in code
// (grass tufts, planks, a soft blob, a glow). Browser only.
import * as THREE from 'three';
import { rng } from './noise';

export interface Card {
  tex: THREE.Texture;
  /** Width / height of the drawn part. */
  aspect: number;
  /** A rounded normal map for the card (its silhouette puffed up like a cushion), so light shades it as a volume. */
  normal?: THREE.Texture;
}

const loaded = new Map<string, Promise<Card>>();

const img = (url: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => fail(new Error(`cannot load ${url}`));
    i.src = url;
  });

/**
 * True for a pixel of a painted ground shadow in the bottom part of a picture: the kit paints it as an opaque flat grey ellipse (and
 * soft grey edges), while trunks, roots and outlines are brown or dark.
 */
const isPaintedShadow = (r: number, g: number, b: number, a: number, yShare: number) => {
  if (yShare < 0.6) return false;
  const max = Math.max(r, g, b);
  const sat = max - Math.min(r, g, b);
  return (sat < 16 && max >= 105 && max <= 215) || (a < 235 && sat < 40);
};

export function texture(canvas: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A kit picture as a card: painted shadow taken out, cropped to its drawn pixels. */
export function loadCard(url: string, keepShadow = false): Promise<Card> {
  const key = `${url}|${keepShadow}`;
  let p = loaded.get(key);
  if (!p) {
    p = img(url).then((i) => {
      const c = document.createElement('canvas');
      c.width = i.naturalWidth;
      c.height = i.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(i, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      let x0 = c.width;
      let y0 = c.height;
      let x1 = 0;
      let y1 = 0;
      for (let y = 0; y < c.height; y += 1)
        for (let x = 0; x < c.width; x += 1) {
          const o = (y * c.width + x) * 4;
          if (!keepShadow && px[o + 3]! > 0 && isPaintedShadow(px[o]!, px[o + 1]!, px[o + 2]!, px[o + 3]!, y / c.height)) px[o + 3] = 0;
          if (px[o + 3]! > 40) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      ctx.putImageData(data, 0, 0);
      const w = Math.max(1, x1 - x0 + 1);
      const h = Math.max(1, y1 - y0 + 1);
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      out.getContext('2d')!.drawImage(c, x0, y0, w, h, 0, 0, w, h);
      const t = texture(out);
      t.generateMipmaps = true;
      return { tex: t, aspect: w / h, normal: puffyNormals(out) };
    });
    loaded.set(key, p);
  }
  return p;
}

/** A plain repeating texture (ground). */
export async function loadTiling(url: string): Promise<THREE.Texture> {
  const t = texture((await toCanvas(url)) as HTMLCanvasElement);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

async function toCanvas(url: string): Promise<HTMLCanvasElement> {
  const i = await img(url);
  const c = document.createElement('canvas');
  c.width = i.naturalWidth;
  c.height = i.naturalHeight;
  c.getContext('2d')!.drawImage(i, 0, 0);
  return c;
}

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
};

/** A tuft of grass blades (`flowers` adds a few petals), drawn upright on a transparent card. */
export function tuftCard(seed: number, flowers: boolean): Card {
  const [c, g] = canvas(128, 128);
  const r = rng(seed);
  const greens = ['#7fbf4a', '#93cf55', '#a8dc62', '#6fae42', '#bce874'];
  for (let i = 0; i < 11; i += 1) {
    const x = 34 + r() * 60;
    const lean = (r() - 0.5) * 46;
    const h = 52 + r() * 62;
    g.fillStyle = greens[Math.floor(r() * greens.length)]!;
    g.beginPath();
    g.moveTo(x - 5, 128);
    g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h);
    g.quadraticCurveTo(x + lean * 0.3 + 3, 128 - h * 0.55, x + 5, 128);
    g.fill();
  }
  if (flowers)
    for (let i = 0; i < 3; i += 1) {
      const x = 40 + r() * 50;
      const y = 40 + r() * 40;
      g.fillStyle = ['#fff4f8', '#ffd84a', '#ff9ec4'][i % 3]!;
      for (let k = 0; k < 5; k += 1) {
        g.beginPath();
        g.arc(x + Math.cos((k / 5) * Math.PI * 2) * 5, y + Math.sin((k / 5) * Math.PI * 2) * 5, 4.2, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#f2a516';
      g.beginPath();
      g.arc(x, y, 3, 0, Math.PI * 2);
      g.fill();
    }
  return { tex: texture(c), aspect: 1 };
}

/** Wooden planks running across a deck. */
export function plankTexture(): THREE.Texture {
  const [c, g] = canvas(128, 128);
  const r = rng(7);
  for (let i = 0; i < 8; i += 1) {
    const tone = 130 + Math.floor(r() * 40);
    g.fillStyle = `rgb(${tone},${Math.floor(tone * 0.68)},${Math.floor(tone * 0.42)})`;
    g.fillRect(i * 16, 0, 15, 128);
    g.fillStyle = 'rgba(60,35,20,0.55)';
    g.fillRect(i * 16 + 15, 0, 1, 128);
    g.fillStyle = 'rgba(70,40,20,0.8)';
    g.fillRect(i * 16 + 6, 18 + r() * 10, 3, 3);
    g.fillRect(i * 16 + 6, 98 + r() * 10, 3, 3);
  }
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A soft round blob, white in the middle (contact shadows, glows). */
export function blobTexture(): THREE.Texture {
  const [c, g] = canvas(64, 64);
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return texture(c, false);
}

/** A leaf shape (falling leaves). */
export function leafTexture(): THREE.Texture {
  const [c, g] = canvas(32, 32);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(16, 2);
  g.quadraticCurveTo(30, 14, 16, 30);
  g.quadraticCurveTo(2, 14, 16, 2);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.beginPath();
  g.moveTo(16, 4);
  g.lineTo(16, 28);
  g.stroke();
  return texture(c, false);
}

/**
 * The normal map of a picture seen as a soft cushion: its silhouette blurred into a height (plus a little of its own shading for the
 * clumps of leaves), the slope of that height turned into normals. A lit card then has a bright side and a shaded side.
 */
export function puffyNormals(src: HTMLCanvasElement): THREE.Texture {
  const w = src.width;
  const h = src.height;
  const blurPx = Math.max(3, Math.round(Math.min(w, h) * 0.07));
  const [c, g] = canvas(w, h);
  g.filter = `blur(${blurPx}px)`;
  g.drawImage(src, 0, 0);
  const soft = g.getImageData(0, 0, w, h).data;
  const own = src.getContext('2d')!.getImageData(0, 0, w, h).data;
  const height = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const lum = (own[i * 4]! + own[i * 4 + 1]! + own[i * 4 + 2]!) / 765;
    height[i] = Math.sqrt(soft[i * 4 + 3]! / 255) + (own[i * 4 + 3]! > 0 ? lum * 0.18 : 0);
  }
  const out = g.createImageData(w, h);
  const at = (x: number, y: number) => height[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]!;
  const k = Math.max(w, h) * 0.035;
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * k;
      // Canvas rows go down; the texture's v goes up.
      const dy = (at(x, y - 1) - at(x, y + 1)) * k;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * w + x) * 4;
      out.data[o] = Math.round((-dx / len) * 127.5 + 127.5);
      out.data[o + 1] = Math.round((-dy / len) * 127.5 + 127.5);
      out.data[o + 2] = Math.round((1 / len) * 127.5 + 127.5);
      out.data[o + 3] = 255;
    }
  g.filter = 'none';
  g.putImageData(out, 0, 0);
  const t = texture(c, false);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

