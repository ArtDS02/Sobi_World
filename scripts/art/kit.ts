// Shared style kit for generated art (art standard §1, AI pack §1.1): every asset is drawn with these
// primitives so pigs, props, fx and UI share one look — warm pastel fills, an outline in a darker
// warm tone of the fill, soft cel shading with top-left light.

// ---------- colour ----------

type Rgb = [number, number, number];

const hex = (c: string): Rgb => {
  const n = parseInt(c.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: Rgb) =>
  `#${c
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

export const mix = (a: string, b: string, t: number) => {
  const x = hex(a),
    y = hex(b);
  return toHex([0, 1, 2].map((i) => x[i]! + (y[i]! - x[i]!) * t) as Rgb);
};
/** Multiplies toward a warm dark, never toward grey (keeps the palette warm). */
export const darken = (c: string, t: number) => mix(c, '#3a1f1a', t);
export const lighten = (c: string, t: number) => mix(c, '#fffaf0', t);

/** Outline colour of a fill: a deep warm version of it (the reference sheets never use pure black). */
export const inkOf = (fill: string) => mix(darken(fill, 0.62), '#4a2620', 0.35);

/** Shared palette — every asset picks from here so the families stay coherent. */
export const PAL = {
  pigPink: '#f8b6c1',
  snoutPink: '#f39aaa',
  blush: '#f37f95',
  eye: '#3a221d',
  hoof: '#6e4538',
  white: '#fffaf2',
  cream: '#f6e6c4',
  wood: '#c98d55',
  woodDark: '#9c6438',
  woodLight: '#e2b47a',
  roofRed: '#e05a4a',
  grass: '#86c95a',
  grassDark: '#5fa843',
  grassLight: '#b4e07c',
  stone: '#b8b4ae',
  water: '#7cc8ef',
  gold: '#f6c445',
  goldDark: '#d99a24',
  red: '#e2504a',
  blue: '#6f9fe0',
  green: '#7cbf5a',
  purple: '#8a62c9',
  sky: '#a9d8f5',
  dirt: '#9a6a45',
  shadow: '#2e3d1c',
};

// ---------- svg plumbing ----------

let uid = 0;
const nextId = (p: string) => `${p}${++uid}`;

export const svgDoc = (w: number, h: number, body: string) => {
  uid = 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
};

export const g = (body: string, transform?: string, extra = '') =>
  `<g${transform ? ` transform="${transform}"` : ''}${extra ? ` ${extra}` : ''}>${body}</g>`;

const f = (n: number) => +n.toFixed(2);

// ---------- paths ----------

export const ellipseD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)},${f(cy)} a${f(rx)},${f(ry)} 0 1,0 ${f(rx * 2)},0 a${f(rx)},${f(ry)} 0 1,0 ${f(-rx * 2)},0 Z`;

export const rectD = (x: number, y: number, w: number, h: number, r = 0) => {
  const q = Math.min(r, w / 2, h / 2);
  return `M${f(x + q)},${f(y)} H${f(x + w - q)} Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + q)} V${f(y + h - q)} Q${f(x + w)},${f(y + h)} ${f(x + w - q)},${f(y + h)} H${f(x + q)} Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - q)} V${f(y + q)} Q${f(x)},${f(y)} ${f(x + q)},${f(y)} Z`;
};

/** Closed polygon with optional rounding by quadratic corners. */
export const polyD = (pts: [number, number][], round = 0) => {
  if (round <= 0) return `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')} Z`;
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i]!,
      a = pts[(i - 1 + n) % n]!,
      b = pts[(i + 1) % n]!;
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]),
      lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(round, la / 2) / la,
      rb = Math.min(round, lb / 2) / lb;
    const s: [number, number] = [p[0] + (a[0] - p[0]) * ra, p[1] + (a[1] - p[1]) * ra];
    const e: [number, number] = [p[0] + (b[0] - p[0]) * rb, p[1] + (b[1] - p[1]) * rb];
    d += `${i === 0 ? 'M' : 'L'}${f(s[0])},${f(s[1])} Q${f(p[0])},${f(p[1])} ${f(e[0])},${f(e[1])} `;
  }
  return `${d}Z`;
};

/** Five/n-pointed star. */
export const starD = (cx: number, cy: number, ro: number, ri: number, n = 5, rot = -90) =>
  polyD(
    Array.from({ length: n * 2 }, (_, i) => {
      const a = ((rot + (i * 180) / n) * Math.PI) / 180;
      const r = i % 2 === 0 ? ro : ri;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
    }),
    Math.min(ro, ri) * 0.18,
  );

export const heartD = (cx: number, cy: number, s: number) =>
  `M${f(cx)},${f(cy + s * 0.9)} C${f(cx - s * 1.25)},${f(cy + s * 0.05)} ${f(cx - s * 0.95)},${f(cy - s * 0.95)} ${f(cx)},${f(cy - s * 0.35)} C${f(cx + s * 0.95)},${f(cy - s * 0.95)} ${f(cx + s * 1.25)},${f(cy + s * 0.05)} ${f(cx)},${f(cy + s * 0.9)} Z`;

// ---------- the one shaded shape ----------

export interface PartOpts {
  /** Outline width in canvas px (0 = none). */
  stroke?: number;
  ink?: string;
  /** Shade crescent depth (bottom-right) and highlight depth (top-left), in canvas px. */
  shade?: number;
  light?: number;
  shadeColor?: string;
  lightColor?: string;
  opacity?: number;
  transform?: string;
}

/** Default stroke for the current canvas: set once per asset family (see STROKE). */
let defaultStroke = 6;
let defaultShade = 10;
export function setScale(stroke: number, shade: number) {
  defaultStroke = stroke;
  defaultShade = shade;
}

/**
 * A filled shape painted like the reference sheets: a soft radial body gradient lit from the top
 * left, a blurred core shadow along the bottom-right edge, a blurred rim light along the top-left
 * edge, and an even warm outline. Everything is built from this so light and line never drift.
 */
export function part(d: string, fill: string, o: PartOpts = {}): string {
  const stroke = o.stroke ?? defaultStroke;
  const sh = o.shade ?? defaultShade;
  const li = o.light ?? sh * 0.6;
  const shadeColor = o.shadeColor ?? darken(fill, 0.26);
  const lightColor = o.lightColor ?? lighten(fill, 0.6);
  const ink = o.ink ?? inkOf(fill);
  const clip = nextId('c'),
    grad = nextId('r'),
    mShade = nextId('m'),
    mLight = nextId('n'),
    blur = nextId('b'),
    blurL = nextId('l');
  const big = 'maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="9000" height="9000"';
  let defs =
    `<clipPath id="${clip}"><path d="${d}"/></clipPath>` +
    `<radialGradient id="${grad}" cx="0.4" cy="0.34" r="0.78" fx="0.32" fy="0.26">` +
    `<stop offset="0" stop-color="${lighten(fill, 0.3)}"/><stop offset="0.55" stop-color="${fill}"/>` +
    `<stop offset="1" stop-color="${darken(fill, 0.12)}"/></radialGradient>`;
  let fills = `<path d="${d}" fill="url(#${grad})"/>`;
  if (sh > 0) {
    defs +=
      `<mask id="${mShade}" ${big}><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${-sh},${-sh})"/></mask>` +
      `<filter id="${blur}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${f(sh * 0.45)}"/></filter>`;
    fills += `<g filter="url(#${blur})"><path d="${d}" fill="${shadeColor}" opacity="0.8" mask="url(#${mShade})"/></g>`;
  }
  if (li > 0) {
    defs +=
      `<mask id="${mLight}" ${big}><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${f(li)},${f(li)})"/></mask>` +
      `<filter id="${blurL}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${f(li * 0.4)}"/></filter>`;
    fills += `<g filter="url(#${blurL})"><path d="${d}" fill="${lightColor}" opacity="0.75" mask="url(#${mLight})"/></g>`;
  }
  const outline =
    stroke > 0
      ? `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${stroke}" stroke-linejoin="round"/>`
      : '';
  const attrs = [
    o.transform ? `transform="${o.transform}"` : '',
    o.opacity !== undefined ? `opacity="${o.opacity}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<g ${attrs}><defs>${defs}</defs><g clip-path="url(#${clip})">${fills}</g>${outline}</g>`;
}

/** Soft blurred colour spot (blush, glow, painted shadow), clipped by the caller if needed. */
export function softSpot(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  opacity: number,
  blur: number,
) {
  const id = nextId('q');
  return `<defs><filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${f(blur)}"/></filter></defs><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${opacity}" filter="url(#${id})"/>`;
}

/** Flat shape, no shading (small details: nostrils, seeds, patterns). */
export const flat = (d: string, fill: string, stroke = 0, ink = inkOf(fill), extra = '') =>
  `<path d="${d}" fill="${fill}"${stroke > 0 ? ` stroke="${ink}" stroke-width="${stroke}" stroke-linejoin="round"` : ''} ${extra}/>`;

/** Open stroke (mouths, eyebrows, rope, curls). */
export const line = (d: string, color: string, width: number, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

/** Clips `body` to the path `d` (garments on a body, patterns on a melon). */
export function clipTo(d: string, body: string, transform?: string): string {
  const id = nextId('k');
  return `<defs><clipPath id="${id}"><path d="${d}"${transform ? ` transform="${transform}"` : ''}/></clipPath></defs><g clip-path="url(#${id})">${body}</g>`;
}

/** Soft contact shadow under buildings/props (baked, art standard §4.3). */
export const contactShadow = (cx: number, cy: number, rx: number, ry: number, opacity = 0.28) => {
  const id = nextId('s');
  return `<defs><filter id="${id}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${f(ry * 0.35)}"/></filter></defs><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${PAL.shadow}" opacity="${opacity}" filter="url(#${id})"/>`;
};

/** Small white sparkle glint (eyes, coins, gems). */
export const glint = (cx: number, cy: number, r: number, opacity = 0.95) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#ffffff" opacity="${opacity}"/>`;

// ---------- deterministic randomness ----------

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
