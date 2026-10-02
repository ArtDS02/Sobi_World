// Sleep / wake frames from a pig's own accepted idle (DECISIONS PS-1): the same pixels, only the
// eyes change — closed lids for `_sleep`, heavy half lids for `_wake`. Identity, palette, outline
// and costume therefore match the idle exactly. Eye boxes come from scripts/assets/eyes.ts or,
// when a species has none there, from the auto detector below.
import type { PNG } from 'pngjs';

export type Box = readonly [number, number, number, number]; // x0, y0, x1, y1 (inclusive)

/**
 * `mask`: the dark pupil (+ enclosed highlights) is the eye. `oval`: the whole box ellipse.
 * `patch`: the eye sits in a dark marking that must stay (panda): only its highlights go, and the
 * lids are drawn in a light ink.
 */
export interface EyeSpec {
  box: Box;
  mode: 'mask' | 'oval' | 'patch';
}

export interface EyeGeometry {
  hole: Set<number>; // pixel indices of the eye
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  light?: boolean; // lids in light ink (patch mode)
}

const lum = (d: Buffer, k: number) => 0.299 * d[k]! + 0.587 * d[k + 1]! + 0.114 * d[k + 2]!;
const solid = (d: Buffer, k: number) => d[k + 3]! > 200;

/** Connected components of `pred` (4-neighbour) with their bounding boxes. */
function components(p: PNG, pred: (i: number) => boolean) {
  const W = p.width,
    H = p.height,
    seen = new Uint8Array(W * H),
    out: { px: number[]; x0: number; y0: number; x1: number; y1: number }[] = [];
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || !pred(i)) continue;
    const stack = [i],
      px: number[] = [];
    seen[i] = 1;
    let x0 = W,
      y0 = H,
      x1 = 0,
      y1 = 0;
    while (stack.length) {
      const j = stack.pop()!;
      px.push(j);
      const x = j % W,
        y = (j / W) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const n of [j - 1, j + 1, j - W, j + W]) {
        if (n < 0 || n >= W * H || Math.abs((n % W) - x) > 1) continue;
        if (!seen[n] && pred(n)) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    out.push({ px, x0, y0, x1, y1 });
  }
  return out;
}

/** Dark, compact, highlight-bearing blobs in the head area: the eyes of the reference style. */
export function detectEyes(p: PNG): EyeSpec[] {
  const d = p.data;
  return components(p, (i) => solid(d, i * 4) && lum(d, i * 4) < 60)
    .filter((c) => c.px.length > 60)
    .map((c) => {
      let hi = 0;
      for (let y = c.y0; y <= c.y1; y++)
        for (let x = c.x0; x <= c.x1; x++) {
          const k = (y * p.width + x) * 4;
          if (solid(d, k) && lum(d, k) > 200) hi++;
        }
      return { ...c, hi, w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1 };
    })
    .filter(
      (c) =>
        c.w >= 12 &&
        c.w <= 75 &&
        c.h >= 18 &&
        c.h <= 80 &&
        c.h / c.w >= 0.85 &&
        c.h / c.w <= 2.6 &&
        (c.px.length + c.hi) / (c.w * c.h) > 0.5 &&
        c.hi >= 8 &&
        c.y0 < 330,
    )
    .map((c) => ({
      box: [c.x0 - 1, c.y0 - 1, c.x1 + 1, c.y1 + 1] as const,
      mode: 'mask' as const,
    }));
}

/** The pixels of one eye: dark mask rows filled span-wise (keeps highlights), or the box oval. */
export function eyeGeometry(p: PNG, eye: EyeSpec): EyeGeometry | null {
  const [bx0, by0, bx1, by1] = eye.box;
  const W = p.width,
    d = p.data,
    hole = new Set<number>();
  if (eye.mode === 'patch') {
    const cx = (bx0 + bx1) / 2,
      cy = (by0 + by1) / 2,
      rx = ((bx1 - bx0) / 2) * 0.85,
      ry = ((by1 - by0) / 2) * 0.85;
    for (let y = by0; y <= by1; y++)
      for (let x = bx0; x <= bx1; x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && lum(d, (y * W + x) * 4) > 150)
          hole.add(y * W + x);
    for (const i of [...hole]) for (const n of [i - 1, i + 1, i - W, i + W]) hole.add(n);
    return { hole, x0: bx0, y0: by0, x1: bx1, y1: by1, light: true };
  }
  if (eye.mode === 'oval') {
    const cx = (bx0 + bx1) / 2,
      cy = (by0 + by1) / 2,
      rx = (bx1 - bx0) / 2 + 0.5,
      ry = (by1 - by0) / 2 + 0.5;
    for (let y = by0; y <= by1; y++)
      for (let x = bx0; x <= bx1; x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) hole.add(y * W + x);
  } else {
    // Dark skins (black, navy): the pupil is only what is clearly darker than the box border.
    const border: number[] = [];
    for (let x = bx0; x <= bx1; x++)
      border.push(lum(d, (by0 * W + x) * 4), lum(d, (by1 * W + x) * 4));
    for (let y = by0; y <= by1; y++)
      border.push(lum(d, (y * W + bx0) * 4), lum(d, (y * W + bx1) * 4));
    const limit = Math.min(95, median(border) - 25);
    for (let y = by0; y <= by1; y++) {
      let first = -1,
        last = -1;
      for (let x = bx0; x <= bx1; x++) {
        const k = (y * W + x) * 4;
        if (solid(d, k) && lum(d, k) < limit) {
          if (first < 0) first = x;
          last = x;
        }
      }
      for (let x = first; first >= 0 && x <= last; x++) hole.add(y * W + x);
    }
  }
  if (hole.size === 0) return null;
  // Grow 1 px, then up to 8 px more over the soft rim (skin/pupil blends) and the light glow around
  // the eye: pixels lighter than the face skin further out, or close to it in colour. Outline ink
  // and other features (snout, blush, head outline next to a far eye) stay.
  for (const i of [...hole]) for (const n of [i - 1, i + 1, i - W, i + W]) hole.add(n);
  const far = [...ring(W, hole, 14)].filter((n) => n < W * p.height && solid(d, n * 4));
  const skin = [0, 1, 2].map((c) => median(far.map((n) => d[n * 4 + c]!)));
  const skinLum = 0.299 * skin[0]! + 0.587 * skin[1]! + 0.114 * skin[2]!;
  // Ink of the pupil: the soft edge of a blurry eye is a blend of skin and this colour.
  const core = [...hole]
    .filter((n) => n >= 0 && n < W * p.height)
    .sort((a, b) => lum(d, a * 4) - lum(d, b * 4));
  const dark = core.slice(0, Math.max(1, core.length >> 3));
  const ink = [0, 1, 2].map((c) => dark.reduce((sum, n) => sum + d[n * 4 + c]!, 0) / dark.length);
  const blend = (n: number) => {
    const u = [0, 1, 2].map((c) => ink[c]! - skin[c]!),
      v = [0, 1, 2].map((c) => d[n * 4 + c]! - skin[c]!);
    const uu = u[0]! ** 2 + u[1]! ** 2 + u[2]! ** 2;
    if (uu < 900) return false;
    const t = (u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!) / uu;
    const res = Math.hypot(v[0]! - t * u[0]!, v[1]! - t * u[1]!, v[2]! - t * u[2]!);
    return t > 0.06 && t < 1.2 && res < 22;
  };
  const glow = (n: number) => {
    if (n < 0 || n >= W * p.height || !solid(d, n * 4)) return false;
    if (blend(n)) return true;
    if (lum(d, n * 4) < 80) return false;
    const dist = Math.hypot(
      d[n * 4]! - skin[0]!,
      d[n * 4 + 1]! - skin[1]!,
      d[n * 4 + 2]! - skin[2]!,
    );
    return dist < 28 || lum(d, n * 4) > skinLum + 6;
  };
  for (let r = 0; r < 8; r++)
    for (const i of [...hole])
      for (const n of [i - 1, i + 1, i - W, i + W]) if (glow(n)) hole.add(n);
  // Highlights cut off by the dark eye ring (dark skins): near-white pixels touching the eye.
  const white = (n: number) => {
    if (!glow(n)) return false;
    const k = n * 4;
    const spread = Math.max(d[k]!, d[k + 1]!, d[k + 2]!) - Math.min(d[k]!, d[k + 1]!, d[k + 2]!);
    return lum(d, k) > 200 && spread < 40 && lum(d, k) > skinLum + 40;
  };
  for (let r = 0; r < 6; r++)
    for (const i of [...hole])
      for (const n of [i - 1, i + 1, i - W, i + W]) if (white(n)) hole.add(n);
  let x0 = W,
    y0 = p.height,
    x1 = 0,
    y1 = 0;
  for (const i of hole) {
    const x = i % W,
      y = (i / W) | 0;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { hole, x0, y0, x1, y1 };
}

/** Ring of pixels 2..`width` px outside the hole. */
function ring(W: number, hole: Set<number>, width: number): Set<number> {
  let edge = new Set(hole);
  const all = new Set(hole),
    out = new Set<number>();
  for (let r = 1; r <= width; r++) {
    const next = new Set<number>();
    for (const i of edge)
      for (const n of [i - 1, i + 1, i - W, i + W])
        if (!all.has(n) && n >= 0) {
          all.add(n);
          next.add(n);
          if (r >= 2) out.add(n);
        }
    edge = next;
  }
  return out;
}

const median = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1] ?? 0;

/**
 * Skin under the eye: the hole is solved as a smooth membrane (repeated neighbour averaging) whose
 * border is the surrounding skin only — outline ink, highlights and sclera (far from the ring's
 * median colour) are not used as border, so they never bleed in.
 */
function inpaint(p: PNG, src: Buffer, hole: Set<number>, blocked: Set<number> = hole) {
  if (hole.size === 0) return;
  const W = p.width,
    d = p.data;
  const ringPx = [...ring(W, blocked, 10)].filter((n) => n < W * p.height && solid(src, n * 4));
  // Outline ink / masks around the eye are not skin, unless the skin itself is that dark.
  const light = ringPx.filter((n) => lum(src, n * 4) >= 80);
  const around = light.length >= ringPx.length * 0.5 ? light : ringPx;
  const ref = [0, 1, 2].map((c) => median(around.map((n) => src[n * 4 + c]!)));
  const skin = (n: number) =>
    !blocked.has(n) &&
    n >= 0 &&
    n < W * p.height &&
    solid(src, n * 4) &&
    Math.hypot(src[n * 4]! - ref[0]!, src[n * 4 + 1]! - ref[1]!, src[n * 4 + 2]! - ref[2]!) < 70;
  const px = [...hole];
  const buf = new Float32Array(px.length * 3);
  px.forEach((_, j) => ref.forEach((v, c) => (buf[j * 3 + c] = v)));
  const index = new Map(px.map((i, j) => [i, j]));
  for (let it = 0; it < 1500; it++) {
    px.forEach((i, j) => {
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (const q of [i - 1, i + 1, i - W, i + W]) {
        const k = index.get(q);
        if (k !== undefined) {
          r += buf[k * 3]!;
          g += buf[k * 3 + 1]!;
          b += buf[k * 3 + 2]!;
          n++;
        } else if (skin(q)) {
          r += src[q * 4]!;
          g += src[q * 4 + 1]!;
          b += src[q * 4 + 2]!;
          n++;
        }
      }
      if (n === 0) return;
      buf[j * 3] = r / n;
      buf[j * 3 + 1] = g / n;
      buf[j * 3 + 2] = b / n;
    });
  }
  px.forEach((i, j) => {
    for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.round(buf[j * 3 + c]!);
    d[i * 4 + 3] = 255;
  });
}

const LIGHT_INK: [number, number, number] = [238, 232, 226];

/** Darkest tenth of the eye's own pixels (its outline ink), or the style's dark brown. */
function inkOf(src: Buffer, hole: Set<number>): [number, number, number] {
  const px = [...hole]
    .filter((i) => solid(src, i * 4))
    .sort((a, b) => lum(src, a * 4) - lum(src, b * 4));
  const dark = px.slice(0, Math.max(1, Math.floor(px.length / 10)));
  const avg = [0, 1, 2].map((c) => dark.reduce((s, i) => s + src[i * 4 + c]!, 0) / dark.length);
  return lum(Buffer.from(avg), 0) < 80 ? [avg[0]!, avg[1]!, avg[2]!] : [64, 40, 36];
}

/** Anti-aliased quadratic stroke (round caps) from a to b bending through control c. */
function stroke(
  p: PNG,
  a: [number, number],
  c: [number, number],
  b: [number, number],
  width: number,
  ink: [number, number, number],
) {
  const pts: [number, number][] = [];
  for (let t = 0; t <= 1.0001; t += 1 / 64) {
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ]);
  }
  const pad = width + 2;
  const xs = pts.map((q) => q[0]),
    ys = pts.map((q) => q[1]);
  for (let y = Math.floor(Math.min(...ys) - pad); y <= Math.ceil(Math.max(...ys) + pad); y++)
    for (let x = Math.floor(Math.min(...xs) - pad); x <= Math.ceil(Math.max(...xs) + pad); x++) {
      if (x < 0 || y < 0 || x >= p.width || y >= p.height) continue;
      let dist = Infinity;
      for (const q of pts) dist = Math.min(dist, Math.hypot(x + 0.5 - q[0], y + 0.5 - q[1]));
      const cover = Math.max(0, Math.min(1, width / 2 - dist + 0.5));
      if (cover === 0) continue;
      const k = (y * p.width + x) * 4;
      for (let ch = 0; ch < 3; ch++)
        p.data[k + ch] = p.data[k + ch]! * (1 - cover) + ink[ch]! * cover;
      p.data[k + 3] = Math.max(p.data[k + 3]!, Math.round(255 * cover));
    }
}

/** Closed lids: eye painted over with the surrounding skin, then a soft downward lash curve. */
export function closeEye(p: PNG, src: Buffer, eye: EyeGeometry) {
  const ink = eye.light ? LIGHT_INK : inkOf(src, eye.hole);
  inpaint(p, src, eye.hole);
  const w = eye.x1 - eye.x0,
    h = eye.y1 - eye.y0,
    yc = eye.y0 + h * 0.5,
    t = Math.max(2.5, Math.min(5, w * 0.1));
  stroke(
    p,
    [eye.x0 + w * 0.08, yc],
    [(eye.x0 + eye.x1) / 2, yc + Math.max(4, w * 0.42)],
    [eye.x1 - w * 0.08, yc],
    t,
    ink,
  );
}

/** Heavy lids: the upper half of the eye becomes skin, a lid line sits on what stays open. */
export function droopEye(p: PNG, src: Buffer, eye: EyeGeometry) {
  const ink = eye.light ? LIGHT_INK : inkOf(src, eye.hole);
  const h = eye.y1 - eye.y0,
    cut = eye.y0 + h * 0.5;
  const upper = new Set([...eye.hole].filter((i) => ((i / p.width) | 0) < cut));
  inpaint(p, src, upper, eye.hole);
  const row = eye.light
    ? [eye.x0 + 4, eye.x1 - 4]
    : [...eye.hole].filter((i) => ((i / p.width) | 0) === Math.round(cut)).map((i) => i % p.width);
  if (row.length === 0) return;
  const x0 = Math.min(...row) + 1,
    x1 = Math.max(...row) - 1,
    w = x1 - x0,
    t = Math.max(2.5, Math.min(6, (eye.x1 - eye.x0) * 0.12));
  stroke(p, [x0, cut + 1], [(x0 + x1) / 2, cut - Math.max(1.5, w * 0.1)], [x1, cut + 1], t, ink);
}
