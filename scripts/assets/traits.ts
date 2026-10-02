// Anatomy traits drawn over a reference pig (A3): the cut keeps the reference head, eyes, snout,
// legs and shading; a trait adds what makes the species read at a glance (wool, gills, feathers,
// horns, antlers, quills, shell). Drawn with the art kit (scripts/art/kit.ts) so line weight,
// warm outline and top-left light match. Coordinates are on the final 512² canvas of pig_classic
// (feet on the 82 % line), which every trait species is cut from.
import { PNG } from 'pngjs';
import { darken, inkOf, line, mix, part, polyD, setScale, svgDoc } from '../art/kit';
import { renderSvg } from '../art/render';
import type { Img } from './coats';

type Pt = [number, number];
type PartOpts = NonNullable<Parameters<typeof part>[2]>;
const SIZE = 512;
const STROKE = 6.5;

/** Near ear flap of pig_classic: body traits go behind it. */
const NEAR_EAR: Pt[] = [
  [206, 112],
  [178, 140],
  [172, 178],
  [184, 206],
  [214, 222],
  [256, 216],
  [288, 190],
  [300, 150],
  [286, 118],
  [252, 104],
];

const f = (n: number) => +n.toFixed(1);
const ptsD = (pts: Pt[]) => `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')} Z`;

/** Everything except the near ear (even-odd clip): draws a body trait behind the ear. */
function behindEar(body: string): string {
  const d = `M-10,-10 H${SIZE + 10} V${SIZE + 10} H-10 Z ${ptsD(NEAR_EAR)}`;
  return `<defs><clipPath id="ear"><path d="${d}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#ear)">${body}</g>`;
}

/** Scalloped cloud outline (wool): `n` bumps around an ellipse. */
function cloudD(cx: number, cy: number, rx: number, ry: number, n: number, bump = 0.22): string {
  const at = (a: number, k: number): Pt => [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2,
      a1 = ((i + 1) / n) * Math.PI * 2;
    const p0 = at(a0, 1),
      p1 = at(a1, 1),
      c = at((a0 + a1) / 2, 1 + bump);
    d += `${i === 0 ? `M${f(p0[0])},${f(p0[1])} ` : ''}Q${f(c[0])},${f(c[1])} ${f(p1[0])},${f(p1[1])} `;
  }
  return `${d}Z`;
}

/** Little wool curls for texture inside a cloud. */
const curls = (pts: Pt[], color: string, r = 9) =>
  pts
    .map(([x, y]) => line(`M${x - r},${y} a${r},${r * 0.85} 0 1,1 ${r * 1.2},${r * 0.7}`, color, 3))
    .join('');

/** Teardrop frond (gill, feather, flame) from base `b` to tip `t`, half-width `w`. */
function frondD(b: Pt, t: Pt, w: number): string {
  const dx = t[0] - b[0],
    dy = t[1] - b[1];
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * w,
    ny = (dx / len) * w;
  const m: Pt = [b[0] + dx * 0.45, b[1] + dy * 0.45];
  return `M${f(b[0])},${f(b[1])} Q${f(m[0] + nx)},${f(m[1] + ny)} ${f(t[0])},${f(t[1])} Q${f(m[0] - nx)},${f(m[1] - ny)} ${f(b[0])},${f(b[1])} Z`;
}

/** Horn tapering from width `w` at `b` to a round tip at `t`, bending through `c`. */
function hornD(b: Pt, c: Pt, t: Pt, w: number): string {
  const q = (u: number): Pt => [
    (1 - u) ** 2 * b[0] + 2 * (1 - u) * u * c[0] + u * u * t[0],
    (1 - u) ** 2 * b[1] + 2 * (1 - u) * u * c[1] + u * u * t[1],
  ];
  const left: Pt[] = [],
    right: Pt[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = q(u),
      p2 = q(Math.min(1, u + 0.01)),
      p1 = q(Math.max(0, u - 0.01));
    const dx = p2[0] - p1[0],
      dy = p2[1] - p1[1],
      l = Math.hypot(dx, dy) || 1;
    const half = (w / 2) * (1 - u * 0.82);
    left.push([p[0] - (dy / l) * half, p[1] + (dx / l) * half]);
    right.push([p[0] + (dy / l) * half, p[1] - (dx / l) * half]);
  }
  return polyD([...left, ...right.reverse()], 3);
}

/** Pill shape (shell rim). */
const pillD = (x: number, y: number, w: number, h: number) =>
  `M${x + h / 2},${y} H${x + w - h / 2} A${h / 2},${h / 2} 0 0,1 ${x + w - h / 2},${y + h} H${x + h / 2} A${h / 2},${h / 2} 0 0,1 ${x + h / 2},${y} Z`;

/** Warm red-brown of the reference outline, blended into each trait's own ink. */
const REF_INK = '#9a463e';
const ink = (fill: string) => mix(inkOf(fill), REF_INK, 0.45);
const opts = (fill: string, extra: PartOpts = {}): PartOpts => ({
  stroke: STROKE,
  ink: ink(fill),
  ...extra,
});
/** Thick outlined stroke (antlers): ink underneath, fill on top. */
const limb = (d: string, fill: string, w: number) =>
  line(d, ink(fill), w + STROKE * 1.4) + line(d, fill, w);

/** Fan of fronds from one base (gills, feathers, flames). */
const fan = (b: Pt, tips: Pt[], w: number, fill: string, vein?: string) =>
  tips
    .map(
      (t) =>
        part(frondD(b, t, w), fill, opts(fill, { shade: 6 })) +
        (vein
          ? line(
              `M${f(b[0] + (t[0] - b[0]) * 0.35)},${f(b[1] + (t[1] - b[1]) * 0.35)} L${f(b[0] + (t[0] - b[0]) * 0.8)},${f(b[1] + (t[1] - b[1]) * 0.8)}`,
              vein,
              2.5,
            )
          : ''),
    )
    .join('');

/** Rounded spike row along `path`, spikes pointing away from `centre`; returns an open path. */
function spikesD(path: Pt[], centre: Pt, len: number, width: number): string {
  let d = `M${f(path[0]![0])},${f(path[0]![1])} `;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!,
      b = path[i + 1]!;
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const ox = m[0] - centre[0],
      oy = m[1] - centre[1];
    const k = len / Math.hypot(ox, oy);
    const tip: Pt = [m[0] + ox * k, m[1] + oy * k];
    const s = width / 2 / Math.hypot(b[0] - a[0], b[1] - a[1]);
    const l: Pt = [m[0] - (b[0] - a[0]) * s, m[1] - (b[1] - a[1]) * s];
    d += `L${f(l[0])},${f(l[1])} Q${f(tip[0])},${f(tip[1])} ${f(b[0])},${f(b[1])} `;
  }
  return d;
}

export interface Trait {
  /** Drawn under the pig (crests, gills, horns on the far side, tail feathers). */
  back?: () => string;
  /** Drawn over the pig. */
  front?: () => string;
  /** Regions where the reference pig stays on top of the front layer (its curly tail). */
  keep?: Pt[];
}

/** The curly tail of pig_classic. */
const TAIL: Pt[] = [
  [52, 186],
  [98, 182],
  [104, 214],
  [90, 236],
  [52, 236],
];

const WOOL = '#f7efe2';
const WOOL_INK = '#e8d8c0';

/** Quill line along pig_classic's back, from behind the ear to the rump. */
const QUILLS: Pt[] = [
  [372, 100],
  [320, 92],
  [262, 112],
  [204, 136],
  [150, 166],
  [108, 196],
  [82, 236],
  [74, 278],
  [82, 318],
  [100, 346],
];

/** `pts` resampled to `n` evenly spaced points (spike spacing). */
function resample(pts: Pt[], n: number): Pt[] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / (n - 1)) * total,
      i = 0;
    while (i < seg.length - 1 && d > seg[i]!) d -= seg[i++]!;
    const a = pts[i]!,
      b = pts[i + 1]!,
      t = Math.min(1, d / seg[i]!);
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

export const TRAITS: Record<string, Trait> = {
  /** Cream wool cloud over body and chest, a tuft on the crown; face, ears, tail and legs bare. */
  sheep: {
    front: () => {
      const shadeColor = '#e0cbad';
      const body =
        part(cloudD(170, 268, 108, 100, 20, 0.18), WOOL, opts(WOOL_INK, { shadeColor })) +
        curls(
          [
            [116, 240],
            [170, 218],
            [112, 296],
            [164, 270],
            [218, 304],
            [146, 332],
            [228, 254],
            [196, 338],
          ],
          darken(WOOL, 0.2),
        );
      const tuft =
        part(cloudD(322, 102, 38, 20, 8, 0.3), WOOL, opts(WOOL_INK, { shadeColor })) +
        curls([[318, 102]], darken(WOOL, 0.2), 7);
      return behindEar(body) + tuft;
    },
    keep: TAIL,
  },
  /** Three coral gill fronds each side of the head, behind the ears. */
  axolotl: {
    back: () =>
      fan(
        [404, 118],
        [
          [416, 42],
          [456, 58],
          [482, 96],
        ],
        22,
        '#ec6694',
        '#c0446f',
      ),
    front: () =>
      behindEar(
        fan(
          [236, 116],
          [
            [184, 52],
            [152, 86],
            [138, 128],
          ],
          24,
          '#ec6694',
          '#c0446f',
        ),
      ),
  },
  /** Flame crest, a fan of tail feathers and a folded feather wing. */
  phoenix: {
    back: () =>
      fan(
        [96, 214],
        [
          [14, 150],
          [8, 206],
          [22, 258],
          [52, 296],
        ],
        28,
        '#f59a3a',
      ) +
      fan(
        [96, 214],
        [
          [30, 176],
          [26, 236],
        ],
        16,
        '#ffd25e',
      ) +
      fan(
        [326, 104],
        [
          [296, 40],
          [334, 26],
          [370, 44],
        ],
        26,
        '#e8573e',
      ) +
      fan(
        [326, 104],
        [
          [316, 52],
          [352, 52],
        ],
        13,
        '#ffc94a',
      ),
    front: () =>
      behindEar(
        fan(
          [222, 236],
          [
            [118, 222],
            [126, 262],
            [148, 296],
          ],
          30,
          '#f6a03e',
        ) +
          fan(
            [222, 236],
            [
              [146, 234],
              [160, 272],
            ],
            16,
            '#ffd25e',
          ),
      ),
  },
  /** Crescent water-buffalo horns sweeping back from the crown. */
  buffalo: {
    back: () =>
      part(hornD([388, 112], [452, 52], [470, 104], 42), '#e8dcc4', opts('#cdb995', { shade: 6 })),
    front: () =>
      part(hornD([304, 118], [226, 44], [200, 104], 48), '#efe4ce', opts('#cdb995', { shade: 7 })),
  },
  /** Small branching antlers on the crown. */
  deer: {
    back: () => limb('M390,112 C396,84 404,64 416,42 M402,76 C414,70 428,68 438,58', '#c4936a', 14),
    front: () =>
      limb(
        'M302,116 C294,86 288,64 280,38 M292,76 C278,70 266,66 254,56 M286,58 C296,48 304,42 312,30',
        '#d7a679',
        15,
      ),
  },
  /** Rounded brown quills over the back, a paler inner row; the face stays smooth. */
  hedgehog: {
    front: () => {
      const centre: Pt = [220, 300];
      const line1 = resample(QUILLS, 17);
      const inner = 'L124,334 L136,292 L164,254 L206,228 L254,208 L292,176 L330,132 L374,118 Z';
      const outer = part(`${spikesD(line1, centre, 30, 34)}${inner}`, '#8a5a3c', opts('#8a5a3c'));
      const row2 = resample(
        [
          [340, 112],
          [290, 120],
          [252, 150],
          [196, 172],
          [150, 200],
          [118, 236],
          [104, 278],
          [112, 318],
        ],
        12,
      );
      const innerRow = part(
        `${spikesD(row2, centre, 22, 30)}L132,320 L144,286 L172,256 L212,236 L258,214 L300,170 L344,126 Z`,
        '#b07a52',
        opts('#8a5a3c', { shade: 6 }),
      );
      return behindEar(outer + innerRow);
    },
  },
  /** Domed shell with hexagon scutes and a pale rim on the back. */
  turtle: {
    front: () => {
      const dome = 'M72,300 C66,206 150,150 236,156 C300,160 318,214 312,300 Z';
      const scutes = (
        [
          [
            [150, 200],
            [196, 186],
            [232, 210],
            [222, 256],
            [174, 266],
            [140, 240],
          ],
          [
            [236, 206],
            [282, 196],
            [302, 240],
            [278, 282],
            [232, 274],
            [226, 252],
          ],
          [
            [96, 240],
            [136, 236],
            [164, 272],
            [146, 296],
            [100, 296],
            [84, 270],
          ],
        ] as Pt[][]
      )
        .map((p) => part(polyD(p, 8), '#86b86a', { stroke: 4, ink: '#4f7a3c', shade: 5 }))
        .join('');
      const rim = part(pillD(64, 290, 254, 26), '#e2cf95', opts('#c8b277', { shade: 5 }));
      return behindEar(part(dome, '#6a9f56', opts('#4f7a3c', { shade: 12 })) + scutes + rim);
    },
  },
};

/** Renders a trait layer to RGBA on the 512² canvas. */
function layer(body: string): Img {
  setScale(STROKE, 10);
  const png = PNG.sync.read(renderSvg(svgDoc(SIZE, SIZE, body)));
  return { w: png.width, h: png.height, d: png.data };
}

/** Source-over of `top` onto `bottom` (both 512² RGBA), returned as a new image. */
function over(bottom: Img, top: Img): Img {
  const d = Buffer.alloc(bottom.d.length);
  for (let i = 0; i < d.length; i += 4) {
    const ta = top.d[i + 3]! / 255,
      ba = bottom.d[i + 3]! / 255;
    const a = ta + ba * (1 - ta);
    for (let c = 0; c < 3; c++) {
      d[i + c] =
        a > 0 ? Math.round((top.d[i + c]! * ta + bottom.d[i + c]! * ba * (1 - ta)) / a) : 0;
    }
    d[i + 3] = Math.round(a * 255);
  }
  return { w: bottom.w, h: bottom.h, d };
}

/** `img` with alpha multiplied by the coverage of polygon `pts`. */
function masked(img: Img, pts: Pt[]): Img {
  const m = layer(`<path d="${ptsD(pts)}" fill="#fff"/>`);
  const d = Buffer.from(img.d);
  for (let i = 3; i < d.length; i += 4) d[i] = Math.round((d[i]! * m.d[i]!) / 255);
  return { ...img, d };
}

/** The pig with the trait's back layer under it, front layer over it, `keep` regions on top. */
export function applyTrait(pig: Img, trait: Trait): Img {
  let out = pig;
  if (trait.back) out = over(layer(trait.back()), out);
  if (trait.front) out = over(out, layer(trait.front()));
  if (trait.keep) out = over(out, masked(pig, trait.keep));
  return out;
}
