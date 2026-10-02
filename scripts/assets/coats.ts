// Coat patterns painted onto a reference cut (U07, backend "R+tint+coat"): the cut keeps the
// reference's outline, eyes and painted shading; a coat only changes body colour per pixel, scaled
// by each pixel's own lightness, so the cel shading survives. Body = pixels that were pink-ish in
// the reference (same weight as the recolour in cut-reference).
export interface Img {
  w: number;
  h: number;
  d: Buffer;
}
type Rgb = [number, number, number];

const lum = (c: Rgb) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** How much a reference pixel belongs to the pink body (0 outline / eyes … 1 body). */
export function bodyWeight([r, g]: Rgb): number {
  const d = r - g;
  return Math.max(0, Math.min(1, (d - 10) / 35, (105 - d) / 30));
}

/** `target` shaded by the pixel's own lightness relative to the pink mid tone. */
const shade = (target: Rgb, ref: Rgb, bright: number): Rgb => {
  const f = (lum(ref) / 200) * bright;
  return [target[0] * f, target[1] * f, target[2] * f];
};

export interface CoatCtx {
  orig: Img; // the reference crop
  out: Img; // the cut-out being written (alpha already set)
  bbox: { x: number; y: number; w: number; h: number };
}

type Paint = (
  u: number,
  v: number,
  ref: Rgb,
  x: number,
  y: number,
) => { color: Rgb; t: number; skin?: boolean } | null;

/** Runs `paint` on every opaque body pixel; u, v in [0, 1] across the character's box. */
function eachBody(c: CoatCtx, paint: Paint) {
  const { orig, out, bbox } = c;
  for (let y = bbox.y; y < bbox.y + bbox.h; y++) {
    for (let x = bbox.x; x < bbox.x + bbox.w; x++) {
      const i = (y * out.w + x) * 4;
      if (out.d[i + 3]! === 0) continue;
      const ref: Rgb = [orig.d[i]!, orig.d[i + 1]!, orig.d[i + 2]!];
      const lightSkin = lum(ref) > 150 && ref[0] - ref[1] >= 12; // pale face, not eye highlights
      const base = bodyWeight(ref);
      if (base <= 0 && !lightSkin) continue;
      const p = paint((x - bbox.x) / bbox.w, (y - bbox.y) / bbox.h, ref, x, y);
      if (!p) continue;
      const w = p.skin && lightSkin ? 1 : base;
      const next = mix([out.d[i]!, out.d[i + 1]!, out.d[i + 2]!], p.color, p.t * w);
      out.d[i] = clamp(next[0]);
      out.d[i + 1] = clamp(next[1]);
      out.d[i + 2] = clamp(next[2]);
    }
  }
}

/** Smooth value noise for organic patches. */
function noise(seed: number) {
  const h = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  return (u: number, v: number, scale: number) => {
    const x = u * scale,
      y = v * scale;
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const fx = x - x0,
      fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx),
      sy = fy * fy * (3 - 2 * fy);
    const a = h(x0, y0) + (h(x0 + 1, y0) - h(x0, y0)) * sx;
    const b = h(x0, y0 + 1) + (h(x0 + 1, y0 + 1) - h(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

const sm = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
/** Soft belly line: lower near the middle of the body, rising toward chest and rump. */
const belly = (u: number, v: number) =>
  sm(0, 0.05, v - (0.6 + 0.1 * (1 - ((u - 0.38) / 0.4) ** 2)));
/** Inside an ellipse with a soft rim (1 inside, 0 outside). */
const blob = (u: number, v: number, cu: number, cv: number, ru: number, rv: number) =>
  1 - sm(0.8, 1.1, Math.hypot((u - cu) / ru, (v - cv) / rv));

/** Dark red devil coat → teal dragon scales; light pinks (snout, blush) keep their colour. */
export const toTeal = (r: number, g: number, b: number): Rgb => {
  const l = lum([r, g, b]);
  const red = sm(10, 40, r - Math.max(g, b)) * (1 - sm(115, 140, l));
  const teal = shade([96, 200, 166], [l, l, l], 2.1);
  return mix([r, g, b], teal, red);
};

export const COATS: Record<string, (c: CoatCtx) => void> = {
  /** Orange coat, short black stripes over back and brow, cream belly. */
  tiger: (c) =>
    eachBody(c, (u, v, ref) => {
      const cream = shade([255, 244, 226], ref, 1.25);
      const orange = shade([242, 150, 70], ref, 1.25);
      const b = belly(u, v);
      const stripe = sm(0.86, 0.93, Math.abs(Math.sin(u * Math.PI * 9 + Math.sin(v * 6) * 0.8)));
      const onBack = 1 - sm(0.42, 0.55, v);
      const base = mix(orange, cream, b);
      return { color: mix(base, [52, 34, 30], stripe * onBack * 0.9), t: 1 };
    }),
  /** White coat; black ear flaps, legs and eye patches (eye spots measured on the plain pig). */
  panda: (c) =>
    eachBody(c, (u, v, ref) => {
      const black = shade([46, 42, 46], ref, 1.1);
      const white = shade([250, 248, 244], ref, 1.22);
      const k = Math.max(
        blob(u, v, 0.68, 0.38, 0.075, 0.1), // near eye
        blob(u, v, 0.4, 0.33, 0.12, 0.17), // near ear flap
        blob(u, v, 0.88, 0.08, 0.08, 0.1), // far ear
        sm(0.76, 0.82, v), // legs
      );
      return { color: mix(white, black, k), t: 1, skin: k > 0.05 }; // snout, blush stay pink
    }),
  /** Navy back and head top, white belly and face front. */
  penguin: (c) =>
    eachBody(c, (u, v, ref) => {
      const white = shade([250, 250, 248], ref, 1.22);
      const navy = shade([52, 66, 96], ref, 1.1);
      const k = Math.max(belly(u, v - 0.04), blob(u, v, 0.86, 0.6, 0.13, 0.2));
      return { color: mix(navy, white, k), t: 1 };
    }),
  /** White coat with orange-red koi patches. */
  koi: (c) => {
    const n = noise(11);
    eachBody(c, (u, v, ref) => {
      const k = n(u, v, 4);
      const red = shade([232, 86, 58], ref, 1.25);
      const white = shade([252, 250, 246], ref, 1.22);
      const patch = sm(0.52, 0.58, k) * (1 - sm(0.7, 0.8, v)); // legs and belly stay white
      return { color: mix(white, red, patch), t: 1 };
    });
  },
  /** Night-indigo coat with small pale stars. */
  galaxy: (c) => {
    const n = noise(3);
    eachBody(c, (u, v, ref) => {
      if (n(u, v, 40) > 0.93) return { color: [255, 243, 176], t: 1 };
      const tone: Rgb = n(u, v, 2.5) > 0.5 ? [72, 64, 150] : [52, 50, 116];
      return { color: shade(tone, ref, 1.2), t: 1 };
    });
  },
  /** Grey-brown coat, a dark bristly mane along the spine, lighter muzzle line. */
  boar: (c) => {
    const { out, bbox } = c;
    const top = new Map<number, number>();
    for (let x = bbox.x; x < bbox.x + bbox.w; x++)
      for (let y = bbox.y; y < bbox.y + bbox.h; y++)
        if (out.d[(y * out.w + x) * 4 + 3]! > 128) {
          top.set(x, y);
          break;
        }
    eachBody(c, (u, v, ref, x, y) => {
      const jag = bbox.h * (0.07 + 0.05 * Math.abs(Math.sin(x * 0.35)));
      const along = sm(0.06, 0.14, u) * (1 - sm(0.6, 0.68, u));
      const mane = along * (1 - sm(jag * 0.8, jag, y - (top.get(x) ?? 0)));
      const coat = mix(
        shade([120, 92, 74], ref, 1.2),
        shade([160, 134, 112], ref, 1.25),
        belly(u, v),
      );
      return { color: mix(coat, shade([58, 42, 34], ref, 1.1), mane), t: 1 };
    });
  },
  /** Pastel bubblegum-lilac coat with a few tiny freckles (axolotl). */
  axolotl: (c) => {
    const n = noise(7);
    eachBody(c, (u, v, ref) => {
      const base = shade([255, 168, 204], ref, 1.18);
      const freckle = n(u, v, 30) > 0.9 && v < 0.7 ? 0.35 : 0;
      return { color: mix(base, [214, 110, 150], freckle), t: 0.9 };
    });
  },
  /** Flame coat: deep red on the back, orange flanks, golden belly (phoenix). */
  phoenix: (c) =>
    eachBody(c, (u, v, ref) => {
      const red = shade([232, 82, 54], ref, 1.25);
      const orange = shade([246, 150, 58], ref, 1.25);
      const gold = shade([255, 214, 96], ref, 1.25);
      const top = mix(red, orange, sm(0.2, 0.55, v));
      return { color: mix(top, gold, belly(u, v)), t: 1 };
    }),
  /** Slate-grey water buffalo hide, lighter grey belly. */
  buffalo: (c) =>
    eachBody(c, (u, v, ref) => {
      const slate = shade([118, 126, 140], ref, 1.2);
      const pale = shade([178, 182, 190], ref, 1.25);
      return { color: mix(slate, pale, belly(u, v)), t: 1 };
    }),
  /** Fawn coat with cream belly and white spots along the back (sika deer). */
  deer: (c) => {
    const n = noise(5);
    eachBody(c, (u, v, ref) => {
      const fawn = shade([206, 138, 82], ref, 1.25);
      const cream = shade([252, 236, 210], ref, 1.25);
      const onBack = (1 - sm(0.45, 0.58, v)) * (1 - sm(0.55, 0.62, u));
      const spot = sm(0.72, 0.78, n(u, v, 16)) * onBack;
      return { color: mix(mix(fawn, cream, belly(u, v)), [255, 250, 240], spot), t: 1 };
    });
  },
  /** Warm cream-tan skin under the quills (hedgehog). */
  hedgehog: (c) =>
    eachBody(c, (u, v, ref) => {
      const tan = shade([236, 204, 168], ref, 1.22);
      return { color: mix(tan, shade([250, 230, 206], ref, 1.25), belly(u, v)), t: 1 };
    }),
  /** Soft olive-green skin, paler belly (turtle). */
  turtle: (c) =>
    eachBody(c, (u, v, ref) => {
      const green = shade([150, 196, 120], ref, 1.22);
      const pale = shade([214, 228, 170], ref, 1.25);
      return { color: mix(green, pale, belly(u, v)), t: 1 };
    }),
};
