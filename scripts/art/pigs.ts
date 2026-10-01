// Pig sprites (AI pack §3, art standard §4.1): one rig, 17 looks, idle + sleep. Every pig shares the
// same body, head, outline and light so the farm reads as one game; looks only change colours and
// add costume layers. Canvas 512², lowest pixel on the 82 % ground line (y = 420).
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
  rectD,
  setScale,
  starD,
  svgDoc,
} from './kit';

export type Pose = 'idle' | 'sleep';
const SIZE = 512;
const STROKE = 7;
const SHADE = 14;

/** Pose geometry: body outline, its box, and where the head sits. */
interface Rig {
  pose: Pose;
  body: string;
  box: { x0: number; y0: number; x1: number; y1: number };
  head: string; // transform of the head group (head drawn around 0,0)
}

const RIGS: Record<Pose, Rig> = {
  idle: {
    pose: 'idle',
    body: 'M108,294 C108,224 166,198 240,198 C318,198 374,224 376,294 C378,364 330,394 240,394 C150,394 108,366 108,294 Z',
    box: { x0: 108, y0: 198, x1: 376, y1: 394 },
    head: 'translate(342,196) scale(1.08)',
  },
  sleep: {
    pose: 'sleep',
    body: 'M92,350 C92,296 150,272 240,272 C330,272 384,296 386,346 C388,398 330,420 240,420 C150,420 92,402 92,350 Z',
    box: { x0: 92, y0: 272, x1: 386, y1: 420 },
    head: 'translate(372,326) rotate(7) scale(1.08)',
  },
};

// Head-local landmarks (head drawn around 0,0, ellipse 100 × 88).
const HEAD = ellipseD(0, 0, 100, 88);
const FAR_EYE = { x: -36, y: -12, rx: 13, ry: 17 };
const NEAR_EYE = { x: 28, y: -14, rx: 16, ry: 20 };
const SNOUT = { x: 80, y: 20, rx: 34, ry: 26 };

export interface Look {
  body: string;
  snout?: string;
  hoof?: string;
  earInner?: string;
  /** Lighter belly / muzzle tint clipped to the body. */
  belly?: string;
  /** Light ring so dark faces keep readable eyes. */
  eyeRing?: string;
  lightColor?: string;
  mouth?: 'smile' | 'open';
  brows?: boolean;
  /** Layers, bottom to top. Rig-space unless noted. */
  back?: (r: Rig) => string;
  bodyPattern?: (r: Rig) => string; // clipped to the body
  garment?: (r: Rig) => string; // clipped to the body
  overBody?: (r: Rig) => string; // over the body, unclipped
  headPattern?: () => string; // head-local, clipped to the head
  neck?: (pose: Pose) => string; // head-local, over the head
  face?: (pose: Pose) => string; // head-local, over eyes/snout
  hat?: (pose: Pose) => string; // head-local, top
  front?: (r: Rig) => string;
  /** Replaces the whole outfit pass (ghost sheet). */
  cover?: (r: Rig) => string;
}

// ---------- rig parts ----------

const legs = (r: Rig, look: Look, near: boolean) => {
  const hoof = look.hoof ?? PAL.hoof;
  const body = look.body;
  if (r.pose === 'sleep') {
    if (!near) return '';
    // Legs tucked: only front hooves peek out under the chest.
    return [298, 340].map((x) => part(rectD(x, 398, 34, 22, 10), hoof, { shade: 6 })).join('');
  }
  const set = near
    ? [
        [126, 352, 50, 420],
        [284, 352, 50, 420],
      ]
    : [
        [166, 348, 42, 412],
        [326, 348, 42, 412],
      ];
  return set
    .map(([x, y, w, bottom]) => {
      const tone = near ? body : darken(body, 0.12);
      return (
        part(rectD(x!, y!, w!, bottom! - y!, 16), tone, { light: 0 }) +
        part(rectD(x!, bottom! - 17, w!, 17, 8), near ? hoof : darken(hoof, 0.12), { shade: 5 })
      );
    })
    .join('');
};

const tail = (r: Rig, look: Look) => {
  const x = r.box.x0 + 4,
    y = r.pose === 'idle' ? 262 : 322;
  const d = `M${x},${y} c-22,-6 -36,8 -28,22 c7,12 25,7 22,-7 c-2,-9 -13,-9 -15,-2`;
  return line(d, inkOf(look.body), 17) + line(d, look.body, 9);
};

const ears = (look: Look, near: boolean) => {
  const inner = look.earInner ?? look.snout ?? PAL.snoutPink;
  if (!near) {
    // Floppy ears: rise from the crown, tips fold forward (reference sheet).
    const d =
      'M-84,-44 C-96,-92 -72,-130 -36,-124 C-22,-120 -14,-108 -14,-96 C-34,-96 -48,-82 -52,-60 Z';
    return (
      part(d, darken(look.body, 0.1)) +
      flat(
        d,
        darken(inner, 0.1),
        0,
        '',
        'transform="translate(-44,-92) scale(0.6) translate(44,92)"',
      )
    );
  }
  const d = 'M16,-80 C26,-122 70,-142 102,-122 C114,-114 120,-100 116,-86 C96,-90 78,-80 62,-58 Z';
  return (
    part(d, look.body) +
    flat(d, inner, 0, '', 'transform="translate(70,-100) scale(0.6) translate(-70,100)"')
  );
};

const eye = (e: typeof NEAR_EYE, look: Look, pose: Pose) => {
  if (pose === 'sleep') {
    return line(
      `M${e.x - e.rx},${e.y} Q${e.x},${e.y + e.ry * 0.8} ${e.x + e.rx},${e.y}`,
      PAL.eye,
      6,
    );
  }
  return (
    (look.eyeRing ? flat(ellipseD(e.x, e.y, e.rx + 5, e.ry + 5), look.eyeRing) : '') +
    flat(ellipseD(e.x, e.y, e.rx, e.ry), PAL.eye) +
    flat(ellipseD(e.x + 1, e.y + e.ry * 0.35, e.rx * 0.7, e.ry * 0.45), '#6b3d2c') +
    glint(e.x - e.rx * 0.32, e.y - e.ry * 0.4, e.rx * 0.48) +
    glint(e.x + e.rx * 0.4, e.y + e.ry * 0.38, e.rx * 0.2, 0.85)
  );
};

const faceBase = (look: Look, pose: Pose) => {
  const snout = look.snout ?? PAL.snoutPink;
  const blush = PAL.blush;
  let s = '';
  s += flat(ellipseD(-52, 24, 19, 11), blush, 0, '', 'opacity="0.75"');
  s += flat(ellipseD(40, 30, 16, 10), blush, 0, '', 'opacity="0.75"');
  s += eye(FAR_EYE, look, pose) + eye(NEAR_EYE, look, pose);
  if (look.brows && pose === 'idle') {
    s +=
      line('M-52,-40 L-22,-30', inkOf(look.body), 8) + line('M12,-36 L46,-44', inkOf(look.body), 8);
  }
  s += part(ellipseD(SNOUT.x, SNOUT.y, SNOUT.rx, SNOUT.ry), snout, { shade: 8 });
  const nostril = darken(snout, 0.45);
  s += flat(ellipseD(SNOUT.x - 11, SNOUT.y + 1, 5.5, 8.5), nostril);
  s += flat(ellipseD(SNOUT.x + 12, SNOUT.y + 1, 5.5, 8.5), nostril);
  const ink = inkOf(look.body);
  if (pose === 'sleep') {
    s += line('M46,58 Q58,64 70,58', ink, 5);
  } else if (look.mouth === 'open') {
    s += flat('M42,52 Q60,82 80,54 Z', '#8a3a3a', 4, ink);
    s += flat('M52,64 Q61,76 72,64 Q62,60 52,64 Z', '#f07c8a');
  } else {
    s += line('M44,54 Q58,66 74,56', ink, 5);
  }
  return s;
};

function drawPig(look: Look, pose: Pose): string {
  setScale(STROKE, SHADE);
  const r = RIGS[pose];
  const bodyLight = look.lightColor ? { lightColor: look.lightColor } : {};
  let s = '';
  s += look.back?.(r) ?? '';
  s += tail(r, look);
  s += legs(r, look, false);
  s += part(r.body, look.body, bodyLight);
  const onBody =
    (look.belly
      ? flat(ellipseD((r.box.x0 + r.box.x1) / 2 + 20, r.box.y1 - 4, 120, 46), look.belly)
      : '') +
    (look.bodyPattern?.(r) ?? '') +
    (look.garment?.(r) ?? '');
  if (onBody) s += clipTo(r.body, onBody) + line(r.body, inkOf(look.body), STROKE);
  s += look.overBody?.(r) ?? '';
  s += legs(r, look, true);
  let head = ears(look, false);
  head += part(HEAD, look.body, bodyLight);
  if (look.headPattern)
    head += clipTo(HEAD, look.headPattern()) + line(HEAD, inkOf(look.body), STROKE);
  head += look.neck?.(pose) ?? '';
  head += faceBase(look, pose);
  head += look.face?.(pose) ?? '';
  head += ears(look, true);
  head += look.hat?.(pose) ?? '';
  s += g(head, r.head);
  s += look.cover?.(r) ?? '';
  s += look.front?.(r) ?? '';
  // Whole rig at 92 % around the ground line: headroom for tall hats, feet stay on y = 420.
  return svgDoc(SIZE, SIZE, g(s, 'translate(240,420) scale(0.92) translate(-240,-420)'));
}

// ---------- costume helpers ----------

/** A cape / cloak flowing back from the shoulders over the body. */
const cape = (r: Rig, fill: string, long: boolean) => {
  const { x0, y0, x1 } = r.box;
  const sx = x1 - 70,
    sy = y0 + 2;
  const tail = long ? 70 : 40;
  const d =
    `M${sx},${sy} C${sx - 50},${sy - 26} ${x0 + 40},${sy - 30} ${x0 - 18},${sy - 6} ` +
    `C${x0 + 4},${sy + 16} ${x0},${sy + tail * 0.6} ${x0 + 22},${sy + tail} ` +
    `C${x0 + 80},${sy + tail - 12} ${sx - 70},${sy + 46} ${sx + 8},${sy + 42} Z`;
  return part(d, fill);
};

const wing = (x: number, y: number, k: number, fill: string) => {
  const d =
    'M0,0 C-26,-44 -84,-70 -128,-58 C-108,-44 -112,-32 -96,-26 C-112,-14 -106,-2 -88,2 ' +
    'C-100,14 -88,26 -70,22 C-46,26 -16,16 0,0 Z';
  return (
    part(d, fill, { transform: `translate(${x},${y}) scale(${k})` }) +
    line(
      'M-30,-14 C-50,-22 -70,-26 -90,-24',
      darken(fill, 0.35),
      4,
      `transform="translate(${x},${y}) scale(${k})"`,
    )
  );
};

const neckBand = (fill: string, knot: boolean, trim?: string) => {
  let s = part('M-84,50 C-50,84 10,96 52,76 L58,92 C10,114 -56,104 -92,66 Z', fill, { shade: 8 });
  if (trim) s += line('M-90,62 C-54,100 8,110 56,88', trim, 6);
  if (knot) {
    s += part('M-26,90 L-48,128 L-6,116 Z', fill, { shade: 6 });
    s += part('M-14,94 L12,128 L18,100 Z', darken(fill, 0.1), { shade: 6 });
    s += part(ellipseD(-16, 92, 12, 10), fill, { shade: 5 });
  }
  return s;
};

const stars = (pts: [number, number, number][], fill: string) =>
  pts.map(([x, y, s]) => part(starD(x, y, s, s * 0.45), fill, { stroke: 3, shade: 2 })).join('');

const blossom = (x: number, y: number, s: number) => {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    d += flat(
      ellipseD(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.75, s * 0.75),
      '#ffd34d',
      2,
      PAL.goldDark,
    );
  }
  return d + flat(ellipseD(x, y, s * 0.5, s * 0.5), '#e2803a');
};

// ---------- looks ----------

const PINK: Look = { body: PAL.pigPink };

export const LOOKS: Record<string, Look> = {
  pig_classic: PINK,

  pig_watermelon: {
    body: '#94d26a',
    belly: '#dcf2b4',
    earInner: PAL.snoutPink,
    mouth: 'open',
    bodyPattern: (r) =>
      [-100, -50, 0, 50, 100]
        .map((dx) => {
          const x = (r.box.x0 + r.box.x1) / 2 + dx - 20;
          return flat(
            `M${x - 9},${r.box.y0 - 10} C${x - 22},${r.box.y0 + 50} ${x - 14},${r.box.y1 - 40} ${x - 4},${r.box.y1 + 10} L${x + 12},${r.box.y1 + 10} C${x + 2},${r.box.y1 - 40} ${x - 4},${r.box.y0 + 50} ${x + 9},${r.box.y0 - 10} Z`,
            '#4f9b3c',
          );
        })
        .join('') +
      [
        [170, 0],
        [196, 22],
        [150, 30],
      ]
        .map(([x, dy]) => flat(ellipseD(x!, r.box.y0 + 70 + dy!, 4, 7), '#2b2a22'))
        .join(''),
    headPattern: () =>
      [-60, -15, 30]
        .map((x) =>
          flat(
            `M${x - 8},-100 C${x - 16},-60 ${x - 12},-40 ${x - 4},-30 L${x + 8},-30 C${x},-40 ${x - 2},-60 ${x + 8},-100 Z`,
            '#4f9b3c',
          ),
        )
        .join('') +
      [
        [-62, 40],
        [-48, 52],
        [-70, 56],
      ]
        .map(([x, y]) => flat(ellipseD(x!, y!, 3, 5), '#2b2a22'))
        .join(''),
    hat: () =>
      line('M-6,-86 C-8,-104 -4,-114 2,-122', '#4f8a32', 9) +
      part('M2,-120 C-20,-150 -58,-150 -70,-132 C-50,-116 -20,-112 2,-120 Z', '#6cbf4a', {
        stroke: 6,
        shade: 6,
      }) +
      part('M2,-120 C18,-152 54,-158 70,-140 C54,-120 26,-112 2,-120 Z', '#7fcc58', {
        stroke: 6,
        shade: 6,
      }),
  },

  pig_superhero: {
    body: '#9b9be8',
    brows: true,
    overBody: (r) => cape(r, PAL.red, false),
    neck: (pose) =>
      pose === 'sleep'
        ? part(ellipseD(-30, 80, 13, 11), PAL.red, { shade: 5 })
        : part('M-40,78 L-74,104 L-46,112 Z', PAL.red, { shade: 6 }) +
          part('M-24,80 L-6,116 L12,98 Z', darken(PAL.red, 0.1), { shade: 6 }) +
          part(ellipseD(-30, 80, 13, 11), PAL.red, { shade: 5 }),
  },

  pig_thienlong: {
    body: '#f8db92',
    snout: '#f4a5ab',
    hoof: '#a8763e',
    back: (r) => wing(r.box.x1 - 120, r.box.y0 + 20, 1.05, '#f2efe8'),
    overBody: (r) => wing(r.box.x1 - 150, r.box.y0 + 34, 1.15, '#fffdf6'),
    neck: (pose) =>
      part('M-86,54 C-50,86 12,96 54,78 L58,94 C12,114 -56,106 -94,68 Z', PAL.gold, { shade: 6 }) +
      (pose === 'idle'
        ? part(ellipseD(-18, 104, 17, 17), '#f0a63a', { shade: 6 }) + glint(-24, 98, 5)
        : ''),
    hat: () =>
      part(
        polyD(
          [
            [-46, -86],
            [-52, -128],
            [-28, -106],
            [-6, -140],
            [16, -106],
            [40, -128],
            [36, -84],
          ],
          6,
        ),
        PAL.gold,
        { stroke: 6, shade: 7 },
      ) +
      part(ellipseD(-6, -106, 7, 7), '#e9584f', { stroke: 3, shade: 2 }) +
      glint(-30, -98, 3),
  },

  pig_white: { body: '#faf1e6', snout: '#f5c4ca', hoof: '#cfa49b', earInner: '#f5c4ca' },

  pig_black: {
    body: '#4c4855',
    lightColor: '#7c84a6',
    snout: '#f2a0ae',
    hoof: '#2e2a30',
    earInner: '#d98b9a',
    eyeRing: '#77717f',
    bodyPattern: (r) => flat(ellipseD(r.box.x0 + 82, r.box.y0 + 92, 34, 24), '#efe8e2'),
  },

  pig_brown: {
    body: '#b97c4d',
    belly: '#f1dab6',
    snout: '#f0cfae',
    hoof: '#4e2f24',
    earInner: '#e3b48c',
  },

  pig_farmer: {
    ...PINK,
    garment: (r) => {
      const { x0, y0, x1, y1 } = r.box;
      const top = y0 + (y1 - y0) * 0.5;
      return (
        part(rectD(x0 - 10, top, x1 - x0 + 20, 300, 8), '#5b86c9', { stroke: 0 }) +
        line(`M${x0},${top} H${x1}`, darken('#5b86c9', 0.4), 6) +
        part(rectD(x0 + 150, top + 18, 46, 34, 8), '#6f97d6', { stroke: 4, shade: 4 })
      );
    },
    overBody: (r) => {
      const { x0, y0, y1 } = r.box;
      const top = y0 + (y1 - y0) * 0.5;
      return (
        part(
          polyD(
            [
              [x0 + 112, top + 4],
              [x0 + 140, top + 4],
              [x0 + 210, y0 + 6],
              [x0 + 182, y0 + 2],
            ],
            4,
          ),
          '#4f78bb',
          { stroke: 5, shade: 4 },
        ) + part(ellipseD(x0 + 126, top + 8, 9, 9), PAL.gold, { stroke: 4, shade: 3 })
      );
    },
    face: (pose) =>
      pose === 'idle'
        ? part('M66,58 C82,52 104,58 116,74 C98,78 80,72 66,58 Z', '#6cbf4a', {
            stroke: 4,
            shade: 3,
          })
        : '',
    hat: () =>
      g(
        part('M-136,-60 C-60,-82 60,-82 136,-60 C110,-48 -110,-48 -136,-60 Z', '#e7c278', {
          stroke: 6,
          shade: 5,
        }) +
          part('M-118,-66 L-6,-176 L116,-66 C60,-80 -60,-80 -118,-66 Z', '#efd28c', {
            stroke: 6,
            shade: 12,
          }) +
          line(
            'M-80,-78 L-6,-176 M-40,-82 L-6,-176 M28,-82 L-6,-176 M70,-78 L-6,-176',
            '#c9a35e',
            3,
          ) +
          line('M-84,-104 C-30,-112 20,-112 74,-104', '#c9a35e', 3),
        'rotate(-6)',
      ),
  },

  pig_chef: {
    ...PINK,
    neck: (pose) => neckBand('#f39a3c', pose === 'idle'),
    hat: () =>
      part(
        'M-66,-116 C-96,-124 -94,-170 -60,-168 C-54,-196 0,-202 10,-176 C34,-198 82,-180 72,-148 C94,-134 82,-108 58,-114 Z',
        '#ffffff',
        {
          stroke: 6,
          shade: 12,
        },
      ) +
      part(rectD(-62, -124, 124, 40, 10), '#fbfaf6', { stroke: 6, shade: 6 }) +
      line('M-30,-120 V-88 M0,-122 V-86 M30,-120 V-88', '#d9d4cc', 4),
  },

  pig_nerd: {
    ...PINK,
    garment: (r) => {
      const { x0, y0, x1, y1 } = r.box;
      const h = y1 - y0;
      let s = part(rectD(x0 - 10, y0 - 10, x1 - x0 + 20, h * 0.78, 8), '#7fb86b', { stroke: 0 });
      for (let x = x0 + 20; x < x1; x += 46) {
        s += flat(
          polyD([
            [x, y0 + h * 0.3],
            [x + 18, y0 + h * 0.45],
            [x, y0 + h * 0.6],
            [x - 18, y0 + h * 0.45],
          ]),
          '#a3d18c',
        );
      }
      s += part(rectD(x0 - 10, y0 + h * 0.68, x1 - x0 + 20, 22, 4), '#6aa457', {
        stroke: 4,
        shade: 3,
      });
      return s;
    },
    face: (pose) => {
      const c = '#2c2626';
      if (pose === 'sleep') return '';
      return (
        flat(ellipseD(FAR_EYE.x, FAR_EYE.y, 25, 27), '#ffffff', 7, c, 'fill-opacity="0.25"') +
        flat(ellipseD(NEAR_EYE.x, NEAR_EYE.y, 29, 31), '#ffffff', 7, c, 'fill-opacity="0.25"') +
        line('M-11,-14 Q-6,-20 -1,-14', c, 6) +
        line('M-61,-16 L-96,-24', c, 6)
      );
    },
    hat: () =>
      part(
        'M-92,-30 C-104,-76 -60,-104 -6,-98 C40,-96 64,-80 64,-62 C30,-70 -8,-62 -30,-46 C-46,-60 -60,-60 -66,-40 C-74,-46 -84,-42 -92,-30 Z',
        '#8c5a3a',
        {
          stroke: 6,
          shade: 8,
        },
      ),
  },

  pig_knight: {
    ...PINK,
    garment: (r) => {
      const { x1, y0, y1 } = r.box;
      return (
        part(rectD(x1 - 150, y0 - 10, 170, y1 - y0 + 20, 10), '#ccd3dd', { stroke: 0, shade: 18 }) +
        line(`M${x1 - 150},${y0} V${y1}`, '#7f8896', 6) +
        [0, 1, 2].map((i) => flat(ellipseD(x1 - 136, y0 + 40 + i * 40, 4, 4), '#7f8896')).join('')
      );
    },
    overBody: (r) =>
      part(ellipseD(r.box.x1 - 96, r.box.y0 + 22, 56, 36), '#d7dde6', { shade: 12 }) +
      line(
        `M${r.box.x1 - 146},${r.box.y0 + 26} Q${r.box.x1 - 96},${r.box.y0 + 2} ${r.box.x1 - 46},${r.box.y0 + 26}`,
        '#8f98a6',
        4,
      ),
    hat: () =>
      part('M-12,-112 C-30,-160 10,-196 56,-178 C30,-170 20,-150 22,-118 Z', PAL.red, {
        stroke: 6,
        shade: 8,
      }) +
      part('M-96,-26 C-104,-96 -50,-124 0,-124 C56,-124 102,-96 96,-30 Z', '#d3d9e2', {
        stroke: 6,
        shade: 14,
      }) +
      part(rectD(-102, -40, 200, 22, 10), '#b9c1cd', { stroke: 6, shade: 4 }) +
      line('M0,-122 V-42', '#8f98a6', 5),
  },

  pig_wizard: {
    ...PINK,
    overBody: (r) =>
      cape(r, '#7d55bf', true) +
      stars(
        [
          [r.box.x0 + 40, r.box.y0 + 30, 9],
          [r.box.x0 + 100, r.box.y0 + 14, 7],
          [r.box.x0 + 150, r.box.y0 + 34, 8],
          [r.box.x0 + 70, r.box.y0 + 56, 6],
        ],
        PAL.gold,
      ),
    neck: () => part(ellipseD(-30, 84, 12, 12), PAL.gold, { stroke: 4, shade: 3 }),
    hat: () =>
      part(ellipseD(-8, -76, 112, 24), '#6c47ab', { stroke: 6, shade: 6 }) +
      part(
        'M-84,-82 C-64,-124 -30,-160 -4,-186 C14,-176 34,-176 56,-188 C40,-160 44,-124 72,-82 C20,-96 -40,-96 -84,-82 Z',
        '#7d55bf',
        {
          stroke: 6,
          shade: 14,
        },
      ) +
      part('M-82,-84 C-40,-100 30,-100 72,-84 L68,-104 C26,-118 -38,-118 -76,-104 Z', PAL.gold, {
        stroke: 5,
        shade: 4,
      }) +
      part(rectD(-18, -112, 26, 24, 4), '#fff2b8', { stroke: 4, shade: 3 }) +
      stars(
        [
          [-30, -134, 9],
          [22, -156, 7],
        ],
        PAL.gold,
      ),
  },

  pig_cowboy: {
    ...PINK,
    garment: (r) => {
      const { x1, y0, y1 } = r.box;
      return (
        part(rectD(x1 - 170, y0 - 10, 130, y1 - y0 + 20, 8), '#9a6038', { stroke: 0, shade: 14 }) +
        line(`M${x1 - 170},${y0} V${y1}`, '#5e3720', 6) +
        line(`M${x1 - 40},${y0} V${y1}`, '#5e3720', 6) +
        line(`M${x1 - 158},${y0 + 10} V${y1 - 10}`, '#d9a774', 3, 'stroke-dasharray="8 8"')
      );
    },
    neck: (pose) =>
      neckBand(PAL.red, pose === 'idle') +
      [-60, -30, 0, 30]
        .map((x) => flat(ellipseD(x, 78 + Math.abs(x) * 0.05, 3, 3), '#ffffff'))
        .join(''),
    hat: () =>
      g(
        part(
          'M-150,-62 C-120,-44 -60,-50 -10,-52 C60,-54 120,-44 150,-70 C140,-40 100,-24 0,-24 C-100,-24 -140,-36 -150,-62 Z',
          '#c9945a',
          { stroke: 6, shade: 6 },
        ) +
          part(
            'M-80,-50 C-86,-110 -60,-142 -30,-136 C-14,-122 6,-122 20,-136 C56,-142 80,-110 72,-50 C30,-60 -40,-60 -80,-50 Z',
            '#d4a266',
            {
              stroke: 6,
              shade: 12,
            },
          ) +
          part('M-80,-58 C-40,-68 30,-68 72,-58 L72,-76 C30,-86 -40,-86 -80,-76 Z', '#7a4a2a', {
            stroke: 5,
            shade: 3,
          }),
        'rotate(-4)',
      ),
  },

  pig_detective: {
    ...PINK,
    garment: (r) => {
      const { x1, y0, y1 } = r.box;
      return (
        part(rectD(x1 - 200, y0 - 10, 220, y1 - y0 + 20, 8), '#d9c39a', { stroke: 0, shade: 16 }) +
        line(`M${x1 - 200},${y0} V${y1}`, '#8f7650', 6) +
        part(rectD(x1 - 190, y0 + 70, 70, 14, 4), '#b89d6f', { stroke: 4, shade: 3 })
      );
    },
    neck: (pose) =>
      part('M-96,40 C-80,92 -20,112 40,96 L60,70 C20,90 -40,86 -70,50 Z', '#e3cfa6', {
        stroke: 6,
        shade: 8,
      }) +
      (pose === 'sleep'
        ? ''
        : part('M-52,82 L-30,118 L-6,94 Z', '#cdb486', { stroke: 5, shade: 4 }) +
          line('M-18,106 V128', '#7a5b3a', 4) +
          part(ellipseD(-18, 140, 12, 12), '#bfe3f2', { stroke: 5, ink: '#7a5b3a', shade: 3 }) +
          line('M-10,150 L-2,164', '#7a5b3a', 6)),
    hat: () =>
      part(
        'M-108,-52 C-96,-118 -40,-134 4,-132 C60,-130 100,-110 104,-52 C50,-66 -50,-66 -108,-52 Z',
        '#9a6b43',
        {
          stroke: 6,
          shade: 12,
        },
      ) +
      line(
        'M-90,-84 C-40,-98 40,-98 94,-84 M-60,-122 C-70,-100 -74,-80 -74,-60 M-6,-130 V-60 M50,-122 C60,-100 64,-80 64,-60',
        '#7a4f2e',
        4,
      ) +
      part('M70,-58 C96,-56 122,-48 132,-36 C108,-34 86,-38 64,-46 Z', '#8a5d38', {
        stroke: 5,
        shade: 4,
      }) +
      part('M-108,-54 C-126,-50 -140,-40 -144,-30 C-124,-30 -110,-36 -98,-44 Z', '#8a5d38', {
        stroke: 5,
        shade: 4,
      }) +
      part(ellipseD(-4, -134, 9, 6), '#7a4f2e', { stroke: 4, shade: 2 }),
  },

  pig_ghost: {
    ...PINK,
    cover: (r) => {
      const sheet = '#fbf9f6';
      const hem = (x0: number, x1: number, y: number) => {
        let d = '';
        const n = 7;
        for (let i = 0; i < n; i++) {
          const a = x1 - ((x1 - x0) * i) / n,
            b = x1 - ((x1 - x0) * (i + 1)) / n;
          d += ` Q${(a + b) / 2},${y + (i % 2 ? -14 : 14)} ${b},${y}`;
        }
        return d;
      };
      const idle = r.pose === 'idle';
      const d = idle
        ? `M100,396 C92,300 104,236 168,208 C214,192 238,150 262,120 C296,82 404,80 444,124 C476,160 478,226 462,266 C450,316 430,360 418,396${hem(100, 418, 396).replace(/^ /, ' ')} Z`
        : `M84,412 C80,340 120,290 200,276 C250,268 290,262 316,252 C356,238 452,248 476,300 C492,336 486,380 476,412${hem(84, 476, 412)} Z`;
      const [hx, hy, rot] = idle ? [345, 205, 0] : [396, 326, 7];
      const t = `translate(${hx},${hy}) rotate(${rot})`;
      const holes = idle
        ? flat(ellipseD(FAR_EYE.x, FAR_EYE.y, 20, 24), '#3a2a2a') +
          flat(ellipseD(NEAR_EYE.x, NEAR_EYE.y, 24, 28), '#3a2a2a') +
          glint(FAR_EYE.x - 5, FAR_EYE.y - 7, 6) +
          glint(NEAR_EYE.x - 6, NEAR_EYE.y - 8, 7)
        : line(
            `M${FAR_EYE.x - 14},${FAR_EYE.y} Q${FAR_EYE.x},${FAR_EYE.y + 12} ${FAR_EYE.x + 14},${FAR_EYE.y}`,
            '#3a2a2a',
            6,
          ) +
          line(
            `M${NEAR_EYE.x - 16},${NEAR_EYE.y} Q${NEAR_EYE.x},${NEAR_EYE.y + 14} ${NEAR_EYE.x + 16},${NEAR_EYE.y}`,
            '#3a2a2a',
            6,
          );
      const snout =
        part(ellipseD(SNOUT.x, SNOUT.y, SNOUT.rx, SNOUT.ry), PAL.snoutPink, { shade: 8 }) +
        flat(ellipseD(SNOUT.x - 11, SNOUT.y + 1, 5.5, 8.5), darken(PAL.snoutPink, 0.45)) +
        flat(ellipseD(SNOUT.x + 12, SNOUT.y + 1, 5.5, 8.5), darken(PAL.snoutPink, 0.45));
      const bow =
        part('M-6,-96 C-30,-126 -64,-118 -58,-92 C-46,-82 -20,-86 -6,-96 Z', '#ffd84a', {
          stroke: 6,
          shade: 5,
        }) +
        part('M-6,-96 C10,-128 46,-126 46,-100 C36,-86 10,-86 -6,-96 Z', '#ffd84a', {
          stroke: 6,
          shade: 5,
        }) +
        part(ellipseD(-6, -96, 11, 10), '#f4c430', { stroke: 5, shade: 3 });
      return part(d, sheet, { shadeColor: '#dcdde8', shade: 18 }) + g(holes + snout + bow, t);
    },
  },

  pig_christmas: {
    ...PINK,
    neck: (pose) =>
      neckBand(PAL.red, false, '#ffffff') +
      (pose === 'sleep'
        ? ''
        : part('M-60,84 C-70,110 -66,138 -56,156 L-30,150 C-36,130 -36,106 -32,92 Z', PAL.red, {
            stroke: 6,
            shade: 6,
          }) + part(rectD(-62, 146, 36, 14, 5), '#ffffff', { stroke: 5, shade: 3 })),
    hat: () =>
      part(
        'M-84,-66 C-80,-130 -30,-170 30,-160 C70,-150 92,-120 118,-96 C130,-84 136,-60 128,-40 C112,-70 90,-90 70,-92 C70,-80 74,-72 78,-66 Z',
        PAL.red,
        {
          stroke: 6,
          shade: 14,
        },
      ) +
      part(rectD(-100, -84, 184, 36, 18), '#ffffff', { stroke: 6, shade: 6 }) +
      part(ellipseD(118, -40, 20, 20), '#ffffff', { stroke: 6, shade: 5 }),
  },

  pig_tet: {
    ...PINK,
    garment: (r) => {
      const { x0, y0, x1, y1 } = r.box;
      return (
        part(rectD(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 - 14, 8), '#d8343a', {
          stroke: 0,
          shade: 18,
        }) +
        line(`M${x0},${y1 - 26} H${x1}`, PAL.gold, 8) +
        line(
          `M${x1 - 70},${y0} C${x1 - 80},${y0 + 60} ${x1 - 74},${y1 - 60} ${x1 - 60},${y1 - 26}`,
          PAL.gold,
          6,
        ) +
        blossom(x0 + 70, y0 + 60, 10) +
        blossom(x0 + 130, y0 + 96, 8) +
        blossom(x0 + 190, y0 + 52, 9)
      );
    },
    neck: () =>
      part('M-86,54 C-50,86 12,96 54,78 L58,94 C12,114 -56,106 -94,68 Z', PAL.gold, { shade: 6 }),
    hat: () =>
      part('M-100,-44 C-60,-80 40,-84 98,-48 L94,-26 C40,-60 -60,-58 -98,-22 Z', '#d8343a', {
        stroke: 6,
        shade: 6,
      }) +
      part('M-98,-34 C-120,-20 -134,0 -136,22 L-116,18 C-112,0 -104,-14 -92,-22 Z', '#d8343a', {
        stroke: 5,
        shade: 4,
      }) +
      part(ellipseD(34, -66, 17, 17), PAL.gold, { stroke: 5, shade: 5 }) +
      flat(rectD(28, -72, 12, 12, 2), '#b9781e'),
  },
};

export const PIG_IDS = Object.keys(LOOKS);

export function pigSvg(id: string, pose: Pose): string {
  const look = LOOKS[id];
  if (!look) throw new Error(`unknown pig ${id}`);
  return drawPig(look, pose);
}
