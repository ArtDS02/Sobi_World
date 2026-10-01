// Pig sprites (AI pack §3, art standard §4.1) in the chibi look of asset/reference/: a big round
// head about the size of the body, large glossy eyes, rosy cheeks, floppy ears, a small barrel body
// on stubby legs. One rig + 17 looks (colours and costume layers), idle and sleep.
// Canvas 512², lowest pixel on the 82 % ground line (y = 420).
import {
  PAL,
  clipTo,
  darken,
  ellipseD,
  flat,
  g,
  glint,
  inkOf,
  line,
  part,
  polyD,
  setScale,
  softSpot,
  starD,
  svgDoc,
} from './kit';

export type Pose = 'idle' | 'sleep';
const SIZE = 512;
const STROKE = 6.5;
const SHADE = 18;

interface Rig {
  pose: Pose;
  body: string;
  box: { x0: number; y0: number; x1: number; y1: number };
  head: string; // transform of the head group (head drawn around 0,0)
}

const RIGS: Record<Pose, Rig> = {
  idle: {
    pose: 'idle',
    body: 'M84,300 C82,246 132,210 205,210 C283,210 334,246 336,300 C338,356 290,386 210,386 C132,386 86,358 84,300 Z',
    box: { x0: 84, y0: 210, x1: 336, y1: 386 },
    head: 'translate(318,200)',
  },
  sleep: {
    pose: 'sleep',
    body: 'M64,364 C62,318 122,298 206,298 C292,298 348,320 350,364 C352,406 296,421 206,421 C118,421 66,404 64,364 Z',
    box: { x0: 64, y0: 298, x1: 350, y1: 421 },
    head: 'translate(338,306) rotate(5)',
  },
};

// ---------- head-local landmarks (head ≈ 128 × 116 around 0,0, facing 3/4 right) ----------

const HEAD =
  'M-126,-6 C-126,-74 -66,-116 4,-116 C76,-116 130,-72 130,-4 C130,62 82,114 2,114 C-74,114 -126,64 -126,-6 Z';
const FAR_EYE = { x: -44, y: -4, rx: 25, ry: 31 };
const NEAR_EYE = { x: 50, y: -4, rx: 28, ry: 34 };
const SNOUT = { x: 104, y: 42, rx: 44, ry: 34 };
const FAR_EAR =
  'M-100,-62 C-120,-110 -104,-150 -70,-158 C-46,-150 -24,-122 -20,-98 C-44,-104 -70,-92 -100,-62 Z';
const NEAR_EAR =
  'M30,-104 C46,-146 92,-164 128,-142 C142,-128 146,-104 138,-82 C120,-94 96,-94 74,-80 C66,-94 50,-104 30,-104 Z';

export interface Look {
  body: string;
  snout?: string;
  hoof?: string;
  earInner?: string;
  belly?: string;
  eyeShine?: string;
  mouth?: 'smile' | 'open';
  brows?: boolean;
  back?: (r: Rig) => string;
  bodyPattern?: (r: Rig) => string; // clipped to the body
  garment?: (r: Rig) => string; // clipped to the body
  overBody?: (r: Rig) => string;
  headPattern?: () => string; // head-local, clipped to the head
  underFace?: (pose: Pose) => string; // head-local, over the head, under eyes/snout
  neck?: (pose: Pose) => string; // head-local, over the face
  face?: (pose: Pose) => string; // head-local, over eyes/snout
  hat?: (pose: Pose) => string; // head-local, on top
  /** Ears hidden under a hood/helmet. */
  noEars?: boolean;
}

// ---------- rig parts ----------

function legs(r: Rig, look: Look, near: boolean) {
  const hoof = look.hoof ?? PAL.hoof;
  if (r.pose === 'sleep') {
    if (!near) return '';
    return [
      [218, 398],
      [254, 402],
    ]
      .map(([x, y]) => part(ellipseD(x!, y!, 20, 14), hoof, { shade: 6 }))
      .join('');
  }
  const set: [number, number, number][] = near
    ? [
        [104, 52, 420],
        [262, 54, 420],
      ]
    : [
        [148, 44, 412],
        [302, 44, 412],
      ];
  return set
    .map(([x, w, bottom]) => {
      const tone = near ? look.body : darken(look.body, 0.14);
      const top = bottom - 60;
      // Stubby rounded leg, slightly wider at the top, with a rounded hoof cap.
      const legD = `M${x - 3},${top} C${x - 4},${top + 24} ${x},${bottom - 18} ${x + 4},${bottom - 6} Q${x + w / 2},${bottom + 4} ${x + w - 4},${bottom - 6} C${x + w},${bottom - 18} ${x + w + 4},${top + 24} ${x + w + 3},${top} Z`;
      const hoofD = `M${x + 1},${bottom - 18} Q${x + w / 2},${bottom - 24} ${x + w - 1},${bottom - 18} C${x + w},${bottom - 10} ${x + w - 4},${bottom - 2} ${x + w / 2},${bottom} C${x + 4},${bottom - 2} ${x},${bottom - 10} ${x + 1},${bottom - 18} Z`;
      return (
        part(legD, tone, { shade: 10 }) +
        part(hoofD, near ? hoof : darken(hoof, 0.15), { shade: 5, stroke: 5.5 }) +
        line(`M${x + w / 2},${bottom - 19} V${bottom - 6}`, darken(hoof, 0.55), 3)
      );
    })
    .join('');
}

function tail(r: Rig, look: Look) {
  const x = r.box.x0 + 6,
    y = r.pose === 'idle' ? 278 : 346;
  const d = `M${x},${y} c-18,-8 -34,4 -28,18 c5,12 22,8 20,-4 c-1,-8 -10,-8 -12,-2`;
  return line(d, inkOf(look.body), 16) + line(d, look.body, 8.5);
}

function ear(look: Look, near: boolean) {
  const inner = look.earInner ?? look.snout ?? PAL.snoutPink;
  if (!near) {
    return (
      part(FAR_EAR, darken(look.body, 0.08), { shade: 10 }) +
      flat(
        'M-92,-74 C-104,-108 -94,-136 -72,-142 C-56,-134 -42,-116 -38,-102 C-58,-104 -76,-94 -92,-74 Z',
        darken(inner, 0.08),
        0,
        '',
        'opacity="0.9"',
      )
    );
  }
  return (
    part(NEAR_EAR, look.body, { shade: 12 }) +
    flat(
      'M48,-104 C62,-134 96,-146 120,-132 C130,-120 132,-104 128,-92 C112,-100 94,-100 78,-90 C70,-100 60,-104 48,-104 Z',
      inner,
      0,
      '',
      'opacity="0.9"',
    ) +
    line('M84,-90 C102,-98 122,-96 136,-86', darken(look.body, 0.3), 3.5, 'opacity="0.6"')
  );
}

function eye(e: typeof NEAR_EYE, look: Look, pose: Pose) {
  if (pose === 'sleep') {
    return line(
      `M${e.x - e.rx * 0.9},${e.y + 4} Q${e.x},${e.y + e.ry * 0.7} ${e.x + e.rx * 0.9},${e.y + 4}`,
      '#3a221d',
      6.5,
    );
  }
  return (
    (look.eyeShine
      ? flat(ellipseD(e.x, e.y, e.rx + 5, e.ry + 5), look.eyeShine, 0, '', 'opacity="0.8"')
      : '') +
    flat(ellipseD(e.x, e.y, e.rx, e.ry), '#2a1612', 2.5, '#1a0c0a') +
    softSpot(e.x + 2, e.y + e.ry * 0.42, e.rx * 0.72, e.ry * 0.4, '#8a4a2c', 0.85, 4) +
    glint(e.x - e.rx * 0.28, e.y - e.ry * 0.36, e.rx * 0.46) +
    glint(e.x + e.rx * 0.38, e.y + e.ry * 0.3, e.rx * 0.18, 0.9) +
    glint(e.x - e.rx * 0.5, e.y + e.ry * 0.2, e.rx * 0.1, 0.7)
  );
}

function faceBase(look: Look, pose: Pose) {
  const snout = look.snout ?? PAL.snoutPink;
  const ink = inkOf(look.body);
  let s =
    softSpot(-58, 48, 26, 15, '#ff6f8f', 0.55, 6) + softSpot(56, 56, 22, 13, '#ff6f8f', 0.55, 6);
  s += eye(FAR_EYE, look, pose) + eye(NEAR_EYE, look, pose);
  if (look.brows && pose === 'idle') {
    s +=
      line('M-70,-46 C-54,-50 -36,-44 -24,-36', ink, 8) +
      line('M24,-42 C40,-52 62,-54 76,-48', ink, 8);
  }
  s += part(ellipseD(SNOUT.x, SNOUT.y, SNOUT.rx, SNOUT.ry), snout, { shade: 10 });
  const nostril = darken(snout, 0.5);
  s +=
    flat(ellipseD(SNOUT.x - 15, SNOUT.y + 2, 7, 11), nostril) +
    flat(ellipseD(SNOUT.x + 15, SNOUT.y + 2, 7, 11), nostril);
  if (pose === 'sleep') {
    s += line('M50,86 Q62,94 74,88', ink, 5);
  } else if (look.mouth === 'open') {
    s += flat('M44,80 Q64,116 88,84 Q66,90 44,80 Z', '#7a2e30', 4, ink);
    s += flat('M54,94 Q66,108 80,94 Q66,90 54,94 Z', '#f27a8c');
  } else {
    s += line('M46,82 Q62,96 80,86', ink, 5);
  }
  return s;
}

function drawPig(look: Look, pose: Pose): string {
  setScale(STROKE, SHADE);
  const r = RIGS[pose];
  let s = '';
  s += look.back?.(r) ?? '';
  s += tail(r, look);
  // Legs sit behind the barrel so only their stubby lower half shows (sleep hooves go in front).
  s += legs(r, look, false);
  if (pose === 'idle') s += legs(r, look, true);
  s += part(r.body, look.body);
  const onBody =
    (look.belly
      ? softSpot((r.box.x0 + r.box.x1) / 2 + 10, r.box.y1 + 4, 120, 52, look.belly, 1, 10)
      : '') +
    (look.bodyPattern?.(r) ?? '') +
    (look.garment?.(r) ?? '');
  if (onBody) s += clipTo(r.body, onBody) + line(r.body, inkOf(look.body), STROKE);
  s += look.overBody?.(r) ?? '';
  if (pose === 'sleep') s += legs(r, look, true);
  let head = '';
  if (!look.noEars) head += ear(look, false);
  head += part(HEAD, look.body, { shade: 22 });
  if (look.headPattern)
    head += clipTo(HEAD, look.headPattern()) + line(HEAD, inkOf(look.body), STROKE);
  head += look.underFace?.(pose) ?? '';
  head += faceBase(look, pose);
  head += look.neck?.(pose) ?? '';
  head += look.face?.(pose) ?? '';
  if (!look.noEars) head += ear(look, true);
  head += look.hat?.(pose) ?? '';
  s += g(head, r.head);
  // Whole rig at 86 % about the ground line, centred: headroom for tall hats.
  return svgDoc(SIZE, SIZE, g(s, 'translate(256,420) scale(0.86) translate(-266,-420)'));
}

// ---------- costume helpers ----------

/** Neck scarf / bandana / collar band around the chin (head-local). */
const collar = (fill: string, trim?: string) =>
  part(
    'M-104,64 C-70,108 10,124 70,104 C80,100 88,96 92,92 L98,110 C60,140 -40,144 -112,86 Z',
    fill,
    { shade: 8 },
  ) + (trim ? line('M-110,80 C-50,132 40,136 96,104', trim, 7) : '');

const knot = (fill: string, x = -20, y = 116) =>
  part(
    `M${x - 4},${y} C${x - 30},${y + 14} ${x - 36},${y + 40} ${x - 22},${y + 50} C${x - 12},${y + 36} ${x - 4},${y + 22} ${x - 4},${y} Z`,
    fill,
    { shade: 6 },
  ) +
  part(
    `M${x + 4},${y} C${x + 30},${y + 10} ${x + 40},${y + 34} ${x + 30},${y + 46} C${x + 18},${y + 32} ${x + 8},${y + 20} ${x + 4},${y} Z`,
    darken(fill, 0.08),
    { shade: 6 },
  ) +
  part(ellipseD(x, y, 15, 12), fill, { shade: 5 });

/** Cape / cloak draped from the neck over the back (rig space). */
function drape(r: Rig, fill: string, len: number) {
  const { x0, y0 } = r.box;
  if (r.pose === 'sleep') {
    return part(
      `M300,318 C250,300 150,300 ${x0 + 6},${y0 + 14} C${x0 - 14},${y0 + 40} ${x0 - 4},${y0 + 62} ${x0 + 14},${y0 + 74} C80,${y0 + 60} 110,${y0 + 76} 140,${y0 + 64} C170,${y0 + 80} 200,${y0 + 66} 228,${y0 + 72} C260,${y0 + 58} 290,${y0 + 52} 306,${y0 + 40} Z`,
      fill,
      { shade: 14 },
    );
  }
  return part(
    `M290,236 C240,214 160,214 ${x0 + 10},${y0 + 22} C${x0 - 16},${y0 + 50} ${x0 - 14},${y0 + 60 + len * 0.4} ${x0 + 4},${y0 + 60 + len} C${x0 + 34},${y0 + 48 + len} ${x0 + 58},${y0 + 66 + len} ${x0 + 86},${y0 + 52 + len} C${x0 + 112},${y0 + 68 + len} ${x0 + 140},${y0 + 50 + len} ${x0 + 168},${y0 + 56 + len} C${x0 + 196},${y0 + 40 + len} 270,${y0 + 30 + len * 0.6} 300,280 Z`,
    fill,
    { shade: 16 },
  );
}

function wing(x: number, y: number, k: number, fill: string) {
  const t = `translate(${x},${y}) scale(${k})`;
  const feathers =
    'M0,0 C-14,-50 -70,-86 -128,-80 C-112,-66 -116,-56 -100,-50 C-118,-38 -112,-24 -94,-22 C-108,-8 -98,4 -80,2 C-90,16 -76,26 -60,20 C-40,26 -12,18 0,0 Z';
  return (
    part(feathers, fill, { transform: t, shade: 10 }) +
    line(
      'M-28,-12 C-52,-24 -76,-30 -100,-36 M-24,-2 C-46,-6 -66,-8 -86,-6',
      darken(fill, 0.25),
      3.5,
      `transform="${t}"`,
    )
  );
}

const sparkleStar = (pts: [number, number, number][], fill: string) =>
  pts.map(([x, y, s]) => part(starD(x, y, s, s * 0.45), fill, { stroke: 3, shade: 2 })).join('');

function blossom(x: number, y: number, s: number) {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    d += flat(
      ellipseD(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.72, s * 0.72),
      '#ffd84d',
      2,
      PAL.goldDark,
    );
  }
  return d + flat(ellipseD(x, y, s * 0.45, s * 0.45), '#e8782e');
}

/** Garment section whose top (and optional bottom) edge curves with the barrel body. */
function curvedBand(
  r: Rig,
  topFrac: number,
  fill: string,
  opts: { bottomFrac?: number; edge?: string } = {},
) {
  const { x0, y0, x1, y1 } = r.box;
  const top = y0 + (y1 - y0) * topFrac;
  const sag = 22;
  const topEdge = `M${x0 - 20},${top + sag} C${x0 + 60},${top - sag} ${x1 - 60},${top - sag} ${x1 + 20},${top + sag}`;
  const d =
    opts.bottomFrac === undefined
      ? `${topEdge} L${x1 + 20},${y1 + 20} L${x0 - 20},${y1 + 20} Z`
      : (() => {
          const b = y0 + (y1 - y0) * opts.bottomFrac;
          return `${topEdge} L${x1 + 20},${b} C${x1 - 60},${b + sag} ${x0 + 60},${b + sag} ${x0 - 20},${b} Z`;
        })();
  return part(d, fill, { stroke: 0, shade: 14 }) + (opts.edge ? line(topEdge, opts.edge, 5) : '');
}

// ---------- looks ----------

const PINK: Look = { body: PAL.pigPink };

export const LOOKS: Record<string, Look> = {
  pig_classic: PINK,

  pig_watermelon: {
    body: '#8fd066',
    belly: '#e2f5c4',
    earInner: '#f3a3b0',
    mouth: 'open',
    bodyPattern: (r) => {
      const cx = (r.box.x0 + r.box.x1) / 2 - 10;
      return [-104, -54, -4, 46, 96]
        .map((dx) => {
          const x = cx + dx;
          return flat(
            `M${x - 10},${r.box.y0 - 10} C${x - 26},${r.box.y0 + 60} ${x - 16},${r.box.y1 - 40} ${x - 4},${r.box.y1 + 10} L${x + 12},${r.box.y1 + 10} C${x},${r.box.y1 - 40} ${x - 6},${r.box.y0 + 60} ${x + 10},${r.box.y0 - 10} Z`,
            '#4f9a3a',
            0,
            '',
            'opacity="0.9"',
          );
        })
        .join('');
    },
    headPattern: () =>
      [-74, -28, 18]
        .map((x) =>
          flat(
            `M${x - 10},-120 C${x - 20},-80 ${x - 14},-56 ${x - 6},-44 L${x + 8},-44 C${x},-56 ${x - 2},-80 ${x + 10},-120 Z`,
            '#4f9a3a',
            0,
            '',
            'opacity="0.9"',
          ),
        )
        .join(''),
    face: (pose) =>
      pose === 'idle'
        ? [
            [-74, 58],
            [-60, 70],
            [-82, 72],
          ]
            .map(([x, y]) => flat(ellipseD(x!, y!, 3.4, 5), '#2b2a22'))
            .join('')
        : '',
    hat: () =>
      line('M-10,-112 C-12,-128 -8,-138 -2,-146', '#3f7f2e', 10) +
      part('M-2,-142 C-26,-178 -72,-176 -84,-152 C-62,-134 -26,-130 -2,-142 Z', '#69bd47', {
        stroke: 5.5,
        shade: 8,
      }) +
      part('M-2,-142 C16,-180 62,-186 80,-162 C62,-138 28,-130 -2,-142 Z', '#7dcc56', {
        stroke: 5.5,
        shade: 8,
      }) +
      line('M-8,-146 C-34,-156 -56,-156 -72,-152 M4,-146 C28,-160 52,-164 70,-160', '#4f8a32', 3),
  },

  pig_superhero: {
    body: '#9a9ce8',
    brows: true,
    overBody: (r) => drape(r, '#e5463f', 30),
    neck: (pose) => collar('#e5463f') + (pose === 'idle' ? knot('#e5463f') : ''),
  },

  pig_thienlong: {
    body: '#f9dc94',
    snout: '#f5a8ac',
    hoof: '#b07a3c',
    earInner: '#f5b9a0',
    back: (r) => wing(r.box.x1 - 120, r.box.y0 + 14, 1.15, '#f1eee8'),
    overBody: (r) => wing(r.box.x1 - 150, r.box.y0 + 30, 1.25, '#fffdf8'),
    neck: (pose) =>
      collar(PAL.gold) +
      (pose === 'idle'
        ? part(ellipseD(-14, 138, 19, 19), '#f2a33a', { shade: 7 }) +
          flat(ellipseD(-14, 144, 6, 4), '#a8601a') +
          glint(-20, 132, 5.5)
        : ''),
    hat: () =>
      part(
        polyD(
          [
            [-48, -108],
            [-56, -156],
            [-30, -130],
            [-6, -170],
            [18, -130],
            [44, -156],
            [38, -106],
          ],
          6,
        ),
        PAL.gold,
        { stroke: 6, shade: 10 },
      ) +
      part(ellipseD(-6, -134, 8, 8), '#e9584f', { stroke: 3, shade: 3 }) +
      [-48, 38]
        .map((x) => part(ellipseD(x, -158, 6, 6), '#fff2a8', { stroke: 3, shade: 2 }))
        .join('') +
      glint(-30, -122, 3.5),
  },

  pig_white: { body: '#fbf3ea', snout: '#f6c3ca', hoof: '#c9a49a', earInner: '#f6c3ca' },

  pig_black: {
    body: '#4b4756',
    snout: '#f2a0ae',
    hoof: '#2a262e',
    earInner: '#d88b9b',
    eyeShine: '#6c6880',
    bodyPattern: (r) =>
      flat(
        'M150,270 C176,258 210,268 206,292 C204,314 168,318 150,304 C136,294 136,278 150,270 Z',
        '#f1ebe6',
        0,
        '',
        `transform="translate(${r.box.x0 - 82},${r.box.y0 - 226})"`,
      ),
  },

  pig_brown: {
    body: '#bd8152',
    belly: '#f3dcb8',
    snout: '#f2d0ae',
    hoof: '#4e2f24',
    earInner: '#e7b58c',
  },

  pig_farmer: {
    ...PINK,
    garment: (r) => {
      const { x0, y0, y1 } = r.box;
      const mid = y0 + (y1 - y0) * 0.48;
      return (
        curvedBand(r, 0.48, '#5c8bd0', { edge: '#2f5590' }) +
        line(
          `M${x0 + 10},${mid + 30} C${x0 + 80},${mid + 6} ${x0 + 180},${mid + 6} ${x0 + 250},${mid + 30}`,
          '#9cc0f0',
          3,
          'stroke-dasharray="7 7"',
        ) +
        part(`M${x0 + 108},${mid + 44} h56 v34 q0,14 -14,14 h-28 q-14,0 -14,-14 Z`, '#6e9ade', {
          stroke: 4,
          shade: 4,
          ink: '#2f5590',
        })
      );
    },
    overBody: (r) =>
      r.pose === 'idle'
        ? part('M196,232 C214,232 232,236 240,242 L238,306 L214,312 Z', '#4f7fc4', {
            stroke: 5,
            shade: 5,
            ink: '#2f5590',
          }) + part(ellipseD(224, 302, 9, 9), PAL.gold, { stroke: 4, shade: 3 })
        : '',
    face: (pose) =>
      pose === 'idle'
        ? part('M84,84 C100,76 124,80 138,96 C118,102 98,98 84,84 Z', '#6cbf4a', {
            stroke: 4,
            shade: 3,
          }) + line('M86,86 C104,88 120,92 134,96', '#4f8a32', 2)
        : '',
    hat: () =>
      g(
        part('M-152,-70 C-80,-100 80,-104 156,-74 C130,-56 -126,-52 -152,-70 Z', '#d9b468', {
          stroke: 6,
          shade: 6,
        }) +
          part('M-138,-74 L2,-200 L142,-78 C70,-96 -66,-96 -138,-74 Z', '#efd28a', {
            stroke: 6,
            shade: 22,
          }) +
          line('M-96,-84 L2,-200 M-46,-90 L2,-200 M50,-90 L2,-200 M98,-84 L2,-200', '#c9a35e', 3) +
          line(
            'M-100,-118 C-40,-128 44,-128 104,-118 M-60,-158 C-20,-164 24,-164 64,-158',
            '#c9a35e',
            3,
          ),
        'rotate(-8)',
      ),
  },

  pig_chef: {
    ...PINK,
    neck: (pose) => collar('#f5973a') + (pose === 'idle' ? knot('#f5973a') : ''),
    hat: () =>
      part(
        'M-78,-134 C-116,-140 -122,-196 -82,-204 C-80,-246 -16,-262 4,-226 C30,-262 96,-248 94,-204 C126,-196 122,-142 82,-136 Z',
        '#ffffff',
        { stroke: 6, shade: 18, shadeColor: '#d9dde8' },
      ) +
      part('M-80,-140 C-30,-150 34,-150 84,-140 L80,-96 C30,-108 -30,-108 -76,-96 Z', '#fbfaf6', {
        stroke: 6,
        shade: 8,
        shadeColor: '#d9dde8',
      }) +
      line('M-40,-142 V-102 M0,-146 V-104 M40,-144 V-104', '#d6d4ce', 3.5),
  },

  pig_nerd: {
    ...PINK,
    garment: (r) => {
      const { x0, y0, x1, y1 } = r.box;
      const h = y1 - y0;
      const hem = y0 + h * 0.78;
      let s = curvedBand(r, -0.2, '#7fbb6a', { bottomFrac: 0.78 });
      for (let x = x0 + 30; x < x1; x += 50) {
        s += flat(
          polyD([
            [x, y0 + h * 0.28],
            [x + 18, y0 + h * 0.42],
            [x, y0 + h * 0.56],
            [x - 18, y0 + h * 0.42],
          ]),
          '#a6d690',
          0,
          '',
          'opacity="0.8"',
        );
      }
      const hemD = `M${x0 - 20},${hem} C${x0 + 60},${hem + 22} ${x1 - 60},${hem + 22} ${x1 + 20},${hem}`;
      return s + line(hemD, '#5e9a4c', 12) + line(hemD, '#88c274', 3, 'stroke-dasharray="4 6"');
    },
    neck: () =>
      part('M-100,72 C-60,108 20,120 80,100 L90,118 C30,142 -60,138 -108,92 Z', '#6aa857', {
        shade: 6,
      }),
    face: (pose) => {
      if (pose === 'sleep') return '';
      const c = '#2b2424';
      return (
        flat(ellipseD(FAR_EYE.x, FAR_EYE.y, 38, 40), '#e8f4ff', 7, c, 'fill-opacity="0.22"') +
        flat(ellipseD(NEAR_EYE.x, NEAR_EYE.y, 42, 44), '#e8f4ff', 7, c, 'fill-opacity="0.22"') +
        line('M-6,-8 Q4,-18 8,-8', c, 6) +
        line('M-82,-12 L-122,-22', c, 6) +
        line(`M${FAR_EYE.x - 18},${FAR_EYE.y - 24} l12,-6`, '#ffffff', 4, 'opacity="0.8"') +
        line(`M${NEAR_EYE.x - 20},${NEAR_EYE.y - 26} l12,-6`, '#ffffff', 4, 'opacity="0.8"')
      );
    },
    hat: () =>
      part(
        'M-124,-30 C-138,-92 -82,-128 -10,-124 C50,-122 92,-104 98,-74 C60,-82 20,-76 -6,-56 C-20,-70 -44,-72 -56,-50 C-70,-60 -96,-56 -124,-30 Z',
        '#8c5a3a',
        { stroke: 6, shade: 12 },
      ) + line('M-90,-92 C-60,-104 -20,-108 20,-100', '#b07a52', 4),
  },

  pig_knight: {
    ...PINK,
    noEars: true,
    overBody: (r) => {
      const { x0, y0, x1 } = r.box;
      if (r.pose === 'sleep') {
        return part(
          `M${x0 + 30},${y0 + 30} C${x0 + 60},${y0 - 14} ${x1 - 80},${y0 - 18} ${x1 - 30},${y0 + 20} C${x1 - 70},${y0 + 50} ${x0 + 80},${y0 + 56} ${x0 + 30},${y0 + 30} Z`,
          '#cfd6e0',
          { shade: 14 },
        );
      }
      return (
        part(
          `M${x0 + 24},${y0 + 60} C${x0 + 40},${y0 - 10} ${x1 - 90},${y0 - 18} ${x1 - 24},${y0 + 30} C${x1 - 70},${y0 + 100} ${x0 + 80},${y0 + 110} ${x0 + 24},${y0 + 60} Z`,
          '#cfd6e0',
          { shade: 16 },
        ) +
        line(
          `M${x0 + 60},${y0 + 40} C${x0 + 100},${y0 + 20} ${x1 - 120},${y0 + 16} ${x1 - 70},${y0 + 36}`,
          '#8f98a8',
          4,
        ) +
        [0, 1, 2, 3]
          .map((i) =>
            flat(
              ellipseD(x0 + 74 + i * 46, y0 + 70 - Math.sin((i / 3) * Math.PI) * 10, 4.5, 4.5),
              '#8f98a8',
            ),
          )
          .join('') +
        part(ellipseD(x1 - 76, y0 + 26, 44, 32), '#dfe5ec', { shade: 12 }) +
        line(`M${x1 - 114},${y0 + 30} Q${x1 - 76},${y0 + 8} ${x1 - 38},${y0 + 30}`, '#8f98a8', 3.5)
      );
    },
    hat: () =>
      part('M-14,-122 C-36,-186 16,-226 68,-204 C40,-196 30,-170 30,-128 Z', '#e5463f', {
        stroke: 6,
        shade: 10,
      }) +
      part(
        'M-132,-8 C-136,-92 -70,-130 2,-130 C76,-130 136,-92 132,-8 C110,-28 60,-40 2,-40 C-58,-40 -110,-28 -132,-8 Z',
        '#d3dae4',
        { stroke: 6, shade: 20 },
      ) +
      part('M-136,-14 C-100,-44 100,-48 138,-14 L132,6 C100,-22 -100,-22 -130,8 Z', '#b6bfcc', {
        stroke: 5,
        shade: 5,
      }) +
      line('M2,-128 V-44', '#8f98a8', 5) +
      [-90, -40, 44, 94]
        .map((x) => flat(ellipseD(x, -24 + Math.abs(x) * 0.08, 4, 4), '#7f8898'))
        .join(''),
  },

  pig_wizard: {
    ...PINK,
    overBody: (r) =>
      drape(r, '#7a52bd', 54) +
      sparkleStar(
        [
          [r.box.x0 + 40, r.box.y0 + 44, 10],
          [r.box.x0 + 104, r.box.y0 + 22, 8],
          [r.box.x0 + 150, r.box.y0 + 56, 9],
          [r.box.x0 + 70, r.box.y0 + 86, 7],
        ],
        PAL.gold,
      ),
    neck: () => part(ellipseD(-34, 112, 14, 14), PAL.gold, { stroke: 4, shade: 4 }),
    hat: () =>
      part('M-150,-84 C-90,-118 80,-122 146,-86 C120,-62 -120,-58 -150,-84 Z', '#6a45a8', {
        stroke: 6,
        shade: 8,
      }) +
      part(
        'M-96,-96 C-70,-150 -34,-196 0,-222 C14,-210 34,-206 58,-218 C40,-188 44,-140 86,-96 C30,-110 -50,-110 -96,-96 Z',
        '#7a52bd',
        { stroke: 6, shade: 20 },
      ) +
      part('M-94,-98 C-46,-114 40,-114 84,-98 L80,-122 C34,-136 -42,-136 -88,-122 Z', PAL.gold, {
        stroke: 5,
        shade: 5,
      }) +
      part('M-22,-134 h30 v30 h-30 Z', '#fff2b8', { stroke: 4, shade: 3 }) +
      sparkleStar(
        [
          [-40, -156, 10],
          [24, -180, 8],
        ],
        PAL.gold,
      ),
  },

  pig_cowboy: {
    ...PINK,
    garment: (r) => {
      const { x1, y0, y1 } = r.box;
      const edge = `M${x1 - 190},${y0 - 10} C${x1 - 170},${y0 + 60} ${x1 - 176},${y1 - 50} ${x1 - 156},${y1 + 10}`;
      return (
        part(`${edge} L${x1 + 20},${y1 + 10} L${x1 + 20},${y0 - 10} Z`, '#9b5f36', {
          stroke: 0,
          shade: 16,
        }) +
        line(edge, '#5e3720', 6) +
        line(
          `M${x1 - 176},${y0 + 4} C${x1 - 158},${y0 + 60} ${x1 - 164},${y1 - 50} ${x1 - 146},${y1}`,
          '#d9a774',
          3,
          'stroke-dasharray="7 7"',
        ) +
        part(ellipseD(x1 - 140, y0 + 80, 6, 6), PAL.gold, { stroke: 3, shade: 2 })
      );
    },
    neck: (pose) =>
      collar('#e5463f') +
      (pose === 'idle' ? knot('#e5463f') : '') +
      [-80, -44, -8, 28, 62]
        .map((x) => flat(ellipseD(x, 100 + Math.abs(x + 10) * 0.12, 3.2, 3.2), '#ffffff'))
        .join(''),
    hat: () =>
      g(
        part(
          'M-176,-74 C-150,-50 -70,-58 0,-60 C80,-62 150,-50 178,-82 C172,-44 120,-28 0,-28 C-120,-28 -170,-42 -176,-74 Z',
          '#c48d52',
          { stroke: 6, shade: 8 },
        ) +
          part(
            'M-90,-58 C-98,-130 -70,-166 -36,-160 C-18,-146 6,-146 22,-160 C62,-166 92,-130 84,-58 C36,-68 -42,-68 -90,-58 Z',
            '#d4a266',
            { stroke: 6, shade: 18 },
          ) +
          part('M-90,-66 C-44,-78 36,-78 84,-66 L84,-88 C36,-100 -44,-100 -90,-88 Z', '#7a4a2a', {
            stroke: 5,
            shade: 4,
          }),
        'translate(0,-12) rotate(-5)',
      ),
  },

  pig_detective: {
    ...PINK,
    overBody: (r) => {
      const coat = drape(r, '#d8c196', 42);
      if (r.pose === 'sleep') return coat;
      const { x0, y0 } = r.box;
      return (
        coat +
        line(
          `M${x0 + 4},${y0 + 70} C${x0 + 60},${y0 + 90} ${x0 + 140},${y0 + 86} 240,${y0 + 64}`,
          '#8f7650',
          7,
        ) +
        part(`M${x0 + 120},${y0 + 74} h20 v14 h-20 Z`, '#c9a24a', { stroke: 3, shade: 2 })
      );
    },
    neck: (pose) =>
      part('M-118,40 C-104,104 -30,128 50,112 L80,84 C30,104 -50,98 -90,54 Z', '#e4d0a8', {
        stroke: 6,
        shade: 10,
      }) +
      part('M-70,98 L-44,140 L-16,110 Z', '#cdb486', { stroke: 5, shade: 5 }) +
      (pose === 'idle'
        ? line('M-26,122 V142', '#7a5b3a', 4) +
          part(ellipseD(-26, 156, 13, 13), '#bfe6f6', { stroke: 5, ink: '#7a5b3a', shade: 3 }) +
          line('M-18,166 L-10,180', '#7a5b3a', 6)
        : ''),
    hat: () =>
      part(
        'M-132,-58 C-122,-136 -50,-156 4,-154 C70,-152 120,-130 126,-58 C60,-74 -60,-74 -132,-58 Z',
        '#9a6b43',
        { stroke: 6, shade: 18 },
      ) +
      line(
        'M-108,-100 C-50,-116 50,-116 112,-100 M-70,-146 C-82,-120 -86,-90 -86,-66 M2,-152 V-66 M66,-142 C78,-116 80,-90 80,-66',
        '#7a4f2e',
        4,
      ) +
      part('M86,-64 C116,-62 146,-52 160,-36 C132,-34 104,-40 78,-50 Z', '#8a5d38', {
        stroke: 5,
        shade: 5,
      }) +
      part('M-130,-60 C-152,-56 -168,-44 -172,-32 C-148,-32 -130,-40 -118,-50 Z', '#8a5d38', {
        stroke: 5,
        shade: 5,
      }) +
      part(ellipseD(2, -156, 10, 7), '#7a4f2e', { stroke: 4, shade: 2 }),
  },

  pig_ghost: {
    ...PINK,
    noEars: true,
    overBody: (r) => {
      // A white sheet over the back with a wavy hem; the face shows through the hood (reference).
      const { x0, y0, y1 } = r.box;
      const hemY = y1 - 6,
        xa = x0 - 14,
        xb = 300,
        n = 7;
      let hem = '';
      for (let i = 0; i < n; i++) {
        const a = xa + ((xb - xa) * i) / n,
          b = xa + ((xb - xa) * (i + 1)) / n;
        hem += ` Q${(a + b) / 2},${hemY + (i % 2 ? -16 : 16)} ${b},${hemY}`;
      }
      return part(
        `M300,${y0 + 10} C260,${y0 - 18} ${x0 + 40},${y0 - 18} ${x0 - 8},${y0 + 40} C${x0 - 24},${y0 + 90} ${x0 - 20},${hemY - 30} ${xa},${hemY}${hem} Z`,
        '#fbfaf8',
        { shade: 18, shadeColor: '#d8dbe8' },
      );
    },
    underFace: () =>
      part(
        'M-150,40 C-160,-80 -90,-150 4,-150 C100,-150 166,-80 156,40 C150,96 120,128 90,132 C70,112 40,100 0,100 C-40,100 -76,116 -100,132 C-128,120 -146,90 -150,40 Z',
        '#fbfaf8',
        { shade: 22, shadeColor: '#d8dbe8' },
      ) +
      part(
        'M-92,0 C-92,-56 -40,-74 18,-74 C88,-74 134,-46 136,10 C136,64 92,94 22,94 C-50,94 -92,62 -92,0 Z',
        PAL.pigPink,
        { shade: 14, stroke: 5, ink: '#b9b4c8' },
      ),
    hat: () =>
      part('M-4,-148 C-34,-186 -82,-176 -74,-144 C-60,-130 -28,-134 -4,-148 Z', '#ffd84a', {
        stroke: 6,
        shade: 8,
      }) +
      part('M-4,-148 C18,-188 70,-184 66,-150 C54,-134 22,-134 -4,-148 Z', '#ffd84a', {
        stroke: 6,
        shade: 8,
      }) +
      part(ellipseD(-4, -148, 13, 12), '#f4c430', { stroke: 5, shade: 4 }),
  },

  pig_christmas: {
    ...PINK,
    neck: (pose) =>
      collar('#e5463f', '#ffffff') +
      (pose === 'idle'
        ? part('M-80,104 C-90,136 -86,168 -76,190 L-48,184 C-56,160 -56,130 -50,112 Z', '#e5463f', {
            stroke: 6,
            shade: 8,
          }) + line('M-80,184 l4,14 M-68,182 l2,14 M-56,180 l2,14', '#ffffff', 4)
        : ''),
    hat: () =>
      part(
        'M-112,-80 C-108,-160 -40,-206 34,-192 C86,-180 116,-140 142,-110 C154,-96 160,-70 150,-50 C134,-80 108,-102 86,-104 C88,-94 92,-86 96,-80 Z',
        '#e5463f',
        { stroke: 6, shade: 20 },
      ) +
      part(
        'M-128,-104 C-60,-124 60,-124 118,-104 C126,-90 124,-74 118,-62 C60,-82 -60,-82 -128,-62 C-134,-76 -134,-92 -128,-104 Z',
        '#ffffff',
        { stroke: 6, shade: 8, shadeColor: '#dde2ee' },
      ) +
      part(ellipseD(150, -46, 24, 24), '#ffffff', { stroke: 6, shade: 8, shadeColor: '#dde2ee' }),
  },

  pig_tet: {
    ...PINK,
    garment: (r) => {
      const { x0, y0, x1, y1 } = r.box;
      const hem = y0 + (y1 - y0) * 0.86;
      return (
        curvedBand(r, -0.2, '#d8343a', { bottomFrac: 0.86 }) +
        line(
          `M${x0 - 20},${hem} C${x0 + 60},${hem + 22} ${x1 - 60},${hem + 22} ${x1 + 20},${hem}`,
          PAL.gold,
          9,
        ) +
        blossom(x0 + 70, y0 + 70, 11) +
        blossom(x0 + 140, y0 + 110, 9) +
        blossom(x0 + 200, y0 + 56, 10) +
        line(
          `M${x0 + 40},${y0 + 120} q14,-10 28,0 M${x0 + 170},${y0 + 140} q14,-10 28,0`,
          '#f2b84a',
          3,
        )
      );
    },
    neck: () => collar('#d8343a') + line('M-110,82 C-50,132 40,136 96,104', PAL.gold, 7),
    hat: () =>
      part('M-128,-60 C-80,-104 70,-108 128,-64 L124,-36 C70,-80 -76,-78 -124,-30 Z', '#d8343a', {
        stroke: 6,
        shade: 8,
      }) +
      part('M-124,-46 C-148,-30 -160,-6 -160,20 L-138,16 C-136,-4 -126,-20 -112,-30 Z', '#d8343a', {
        stroke: 5,
        shade: 5,
      }) +
      part(ellipseD(40, -86, 20, 20), PAL.gold, { stroke: 5, shade: 7 }) +
      flat('M33,-93 h14 v14 h-14 Z', '#b9781e'),
  },
};

export const PIG_IDS = Object.keys(LOOKS);

export function pigSvg(id: string, pose: Pose): string {
  const look = LOOKS[id];
  if (!look) throw new Error(`unknown pig ${id}`);
  return drawPig(look, pose);
}
