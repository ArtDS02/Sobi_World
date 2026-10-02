// Pig sprites (AI pack §3, art standard §4.1) in the chibi look of asset/reference/: a big round
// head about the size of the body, large glossy eyes, rosy cheeks, floppy ears, a small barrel body
// on stubby legs. One rig + a look per species colour, idle and sleep.
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

};

export const PIG_IDS = Object.keys(LOOKS);

export function pigSvg(id: string, pose: Pose): string {
  const look = LOOKS[id];
  if (!look) throw new Error(`unknown pig ${id}`);
  return drawPig(look, pose);
}
