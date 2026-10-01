// Props, buildings and scene layers (environment catalogue §1, §1A, §2, §3; AI pack §5). Same kit
// as the pigs; outlines are thinner because these draw 1:1 in the 1600 × 900 design space while a
// 512² pig is shown about 200 px tall — on screen the line weight matches.
import {
  PAL,
  contactShadow,
  darken,
  ellipseD,
  flat,
  g,
  glint,
  heartD,
  lighten,
  line,
  part,
  polyD,
  rectD,
  rng,
  setScale,
  svgDoc,
} from './kit';

const PROP_STROKE = 3.2;
const PROP_SHADE = 7;

// ---------- shared pieces ----------

/** Rounded grass patch every structure stands on (environment catalogue §0). */
function grassPatch(cx: number, cy: number, rx: number, ry: number, seed: number, flowers = 3) {
  const r = rng(seed);
  let s = part(ellipseD(cx, cy, rx, ry), PAL.grass, {
    shade: ry * 0.35,
    light: ry * 0.2,
    lightColor: PAL.grassLight,
    shadeColor: PAL.grassDark,
  });
  // Tufts along the rim break the perfect ellipse.
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (0.05 + (0.9 * i) / 13) + (r() - 0.5) * 0.1;
    const x = cx + Math.cos(a) * rx * (0.96 + r() * 0.05),
      y = cy + Math.sin(a) * ry * 0.9;
    s += tuft(x, y, 7 + r() * 5);
  }
  for (let i = 0; i < flowers; i++) {
    const a = Math.PI * (0.15 + r() * 0.7),
      x = cx + Math.cos(a) * rx * (0.7 + r() * 0.2),
      y = cy + Math.sin(a) * ry * 0.55;
    s += daisy(x, y, 4.5);
  }
  return s;
}

export const tuft = (x: number, y: number, h: number, c = PAL.grassDark) =>
  flat(
    `M${x - h * 0.7},${y} Q${x - h * 0.55},${y - h * 0.7} ${x - h * 0.8},${y - h * 1.1} Q${x - h * 0.2},${y - h * 0.6} ${x},${y - h * 1.3} Q${x + h * 0.2},${y - h * 0.6} ${x + h * 0.8},${y - h} Q${x + h * 0.5},${y - h * 0.6} ${x + h * 0.7},${y} Z`,
    c,
  );

export const daisy = (x: number, y: number, s: number) => {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 * Math.PI) / 180;
    d += flat(
      ellipseD(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.8, s * 0.75, s * 0.6),
      '#ffffff',
      1.2,
      '#b9b2a6',
    );
  }
  return d + flat(ellipseD(x, y, s * 0.55, s * 0.5), '#f6c445');
};

/** Horizontal plank lines inside a box (wood walls, crates). */
const planks = (x: number, y: number, w: number, h: number, step: number, c: string) => {
  let s = '';
  for (let yy = y + step; yy < y + h - 2; yy += step)
    s += line(`M${x + 3},${yy} H${x + w - 3}`, c, 2);
  return s;
};

/** Little carved pig face (trough, sack, bowl emblems). */
const pigEmblem = (x: number, y: number, s: number, fill: string, ink: string) =>
  flat(ellipseD(x - s * 0.62, y - s * 0.72, s * 0.32, s * 0.32), fill, 1.6, ink) +
  flat(ellipseD(x + s * 0.62, y - s * 0.72, s * 0.32, s * 0.32), fill, 1.6, ink) +
  flat(ellipseD(x, y, s, s * 0.85), fill, 1.6, ink) +
  flat(ellipseD(x, y + s * 0.22, s * 0.42, s * 0.3), darken(fill, 0.12), 1.4, ink) +
  flat(ellipseD(x - s * 0.13, y + s * 0.22, s * 0.07, s * 0.1), ink) +
  flat(ellipseD(x + s * 0.13, y + s * 0.22, s * 0.07, s * 0.1), ink) +
  flat(ellipseD(x - s * 0.38, y - s * 0.2, s * 0.08, s * 0.1), ink) +
  flat(ellipseD(x + s * 0.38, y - s * 0.2, s * 0.08, s * 0.1), ink);

/** A pile of corn kernels inside a region. */
function kernels(cx: number, cy: number, rx: number, ry: number, n: number, seed: number, k = 5) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2,
      d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d,
      y = cy + Math.sin(a) * ry * d;
    s += flat(ellipseD(x, y, k, k * 0.8), r() < 0.7 ? PAL.gold : '#f8d76a', 1.3, PAL.goldDark);
  }
  return s;
}

// ---------- props ----------

function trough(level: 'empty' | 'half' | 'full'): string {
  setScale(PROP_STROKE, PROP_SHADE);
  const wood = '#d39a5c';
  let s = grassPatch(192, 214, 180, 34, 11, 2);
  s += contactShadow(196, 204, 160, 18, 0.32);
  // Inside of the box (seen from slightly above), back wall, then fill, then the front.
  s += part(
    polyD([
      [52, 122],
      [80, 96],
      [346, 96],
      [318, 122],
    ]),
    darken(wood, 0.45),
    { stroke: PROP_STROKE },
  );
  if (level === 'half') {
    s += part(
      polyD([
        [60, 120],
        [78, 106],
        [338, 106],
        [320, 120],
      ]),
      PAL.gold,
      { shade: 3 },
    );
    s += kernels(200, 112, 120, 5, 46, 3, 4.2);
  }
  if (level === 'full') {
    s += part('M46,124 C70,74 140,64 196,70 C262,64 330,74 350,104 L318,126 Z', PAL.gold, {
      shade: 8,
    });
    s += kernels(198, 96, 132, 22, 120, 4, 5);
  }
  s += part(
    polyD([
      [318, 122],
      [346, 96],
      [346, 178],
      [318, 204],
    ]),
    darken(wood, 0.18),
  );
  s += part(rectD(46, 120, 274, 84, 6), wood);
  s += planks(46, 120, 274, 84, 28, darken(wood, 0.3));
  s += pigEmblem(183, 166, 17, lighten(wood, 0.25), darken(wood, 0.5));
  // End posts with darker banding.
  for (const x of [34, 300]) {
    s += part(rectD(x, 104, 30, 106, 6), PAL.woodDark);
    s += line(
      `M${x + 3},${126} H${x + 27} M${x + 3},${188} H${x + 27}`,
      darken(PAL.woodDark, 0.35),
      3,
    );
  }
  if (level === 'full')
    s += kernels(110, 222, 60, 6, 7, 9, 4.5) + kernels(280, 224, 40, 5, 5, 10, 4.5);
  return svgDoc(384, 256, s);
}

function orderBoard(): string {
  setScale(PROP_STROKE, PROP_SHADE);
  let s = grassPatch(128, 350, 112, 24, 21, 2);
  s += contactShadow(128, 344, 90, 12, 0.3);
  for (const x of [54, 182]) s += part(rectD(x, 120, 22, 232, 6), PAL.woodDark);
  s += part(rectD(26, 118, 204, 172, 10), PAL.wood);
  s += planks(26, 118, 204, 172, 34, darken(PAL.wood, 0.3));
  s += part(rectD(38, 130, 180, 148, 6), lighten(PAL.wood, 0.18), { stroke: 2.2 });
  // Small pitched roof.
  s += part(
    polyD(
      [
        [10, 122],
        [128, 62],
        [246, 122],
        [232, 132],
        [128, 82],
        [24, 132],
      ],
      4,
    ),
    PAL.roofRed,
  );
  // Three blank notes, pinned (no writing, AI pack §5.1).
  const notes: [number, number, number][] = [
    [52, 146, -5],
    [134, 140, 4],
    [92, 206, -2],
  ];
  for (const [x, y, a] of notes) {
    s += g(
      part(rectD(0, 0, 64, 56, 3), '#fff6df', { shade: 4, stroke: 2.4 }) +
        line('M10,46 H54', '#efe0bf', 2) +
        flat(ellipseD(32, 7, 4.5, 4.5), PAL.red, 1.4),
      `translate(${x},${y}) rotate(${a})`,
    );
  }
  return svgDoc(256, 384, s);
}

function waterBowl(): string {
  setScale(PROP_STROKE, 5);
  const blue = '#6aa8e2';
  let s = grassPatch(96, 104, 88, 18, 31, 1);
  s += contactShadow(96, 100, 66, 9, 0.3);
  s += part('M24,60 C26,84 40,98 62,100 L130,100 C152,98 166,84 168,60 Z', blue);
  s += part(ellipseD(96, 60, 72, 22), lighten(blue, 0.2), { shade: 3 });
  s += part(ellipseD(96, 61, 58, 15), PAL.water, { shade: 4, stroke: 2.4, ink: darken(blue, 0.4) });
  s += line('M60,58 Q80,51 104,53', '#ffffff', 3, 'opacity="0.8"');
  s += pigEmblem(96, 82, 9, '#f4fbff', darken(blue, 0.3));
  return svgDoc(192, 128, s);
}

function mudPuddle(): string {
  setScale(PROP_STROKE, 6);
  const r = rng(41);
  let s = '';
  const d =
    'M30,104 C22,80 52,62 90,66 C110,52 150,52 170,64 C206,58 238,76 228,100 C240,120 214,136 180,134 C160,146 120,146 100,136 C66,144 30,132 30,104 Z';
  s += part(d, PAL.dirt, {
    shadeColor: darken(PAL.dirt, 0.25),
    lightColor: lighten(PAL.dirt, 0.2),
  });
  s += flat(
    'M70,98 C80,84 120,80 150,86 C130,92 100,96 70,98 Z',
    '#c4936a',
    0,
    '',
    'opacity="0.8"',
  );
  for (let i = 0; i < 5; i++)
    s += flat(
      ellipseD(70 + r() * 130, 104 + r() * 22, 6 + r() * 6, 3 + r() * 3),
      darken(PAL.dirt, 0.3),
    );
  s += glint(156, 92, 4) + glint(170, 96, 2.5);
  for (const [x, y] of [
    [26, 112],
    [40, 86],
    [226, 92],
    [214, 128],
    [120, 144],
  ])
    s += tuft(x!, y!, 10, PAL.grass) + tuft(x! + 8, y! + 2, 7);
  return svgDoc(256, 160, s);
}

function foodSack(): string {
  setScale(PROP_STROKE, PROP_SHADE);
  const burlap = '#ecd7a8';
  let s = grassPatch(96, 202, 86, 17, 51, 1);
  s += contactShadow(96, 196, 64, 9, 0.3);
  s += part(
    'M40,196 C24,170 26,118 56,86 C62,80 64,74 62,68 L130,68 C128,74 130,80 136,86 C166,118 168,170 152,196 Z',
    burlap,
  );
  s += line(
    'M70,110 C66,140 68,170 76,190 M120,108 C128,140 126,170 118,190',
    darken(burlap, 0.15),
    2,
  );
  s += part(ellipseD(96, 64, 40, 13), darken(burlap, 0.35), { shade: 3 });
  s += part('M58,64 C66,36 126,36 134,64 C116,70 76,70 58,64 Z', PAL.gold, { shade: 4 });
  s += kernels(96, 54, 30, 10, 26, 52, 4.2);
  s += line('M56,82 C80,90 112,90 138,82', '#a07a46', 5);
  s += pigEmblem(96, 146, 18, '#e6bfa0', '#a0684a');
  s += kernels(150, 200, 18, 4, 5, 53, 4.2) + kernels(38, 202, 12, 3, 3, 54, 4.2);
  return svgDoc(192, 224, s);
}

// ---------- buildings ----------

function pigHouse(): string {
  setScale(PROP_STROKE, 9);
  const wall = '#ecd2a2';
  const wallSide = '#d9b781';
  let s = grassPatch(256, 400, 240, 40, 61, 5);
  s += contactShadow(262, 386, 200, 22, 0.32);
  // Low fence at the left.
  s +=
    part(rectD(12, 352, 64, 10, 3), PAL.woodLight) + part(rectD(12, 330, 64, 10, 3), PAL.woodLight);
  for (const x of [16, 52])
    s += part(
      polyD(
        [
          [x, 384],
          [x, 322],
          [x + 8, 312],
          [x + 16, 322],
          [x + 16, 384],
        ],
        2,
      ),
      PAL.wood,
    );
  // Side wall, front gable wall.
  s += part(
    polyD([
      [72, 252],
      [234, 236],
      [234, 386],
      [72, 374],
    ]),
    wallSide,
  );
  s += planks(72, 252, 162, 124, 24, darken(wallSide, 0.25));
  s +=
    part(rectD(118, 286, 44, 38, 4), '#7b5236') + line('M140,288 V322 M120,305 H160', wallSide, 3);
  s += part(
    polyD([
      [234, 236],
      [334, 140],
      [434, 236],
      [434, 386],
      [234, 386],
    ]),
    wall,
  );
  s += planks(234, 236, 200, 150, 26, darken(wall, 0.22));
  // Heart window in the gable, arched doorway with straw, ramp.
  s += part(heartD(334, 196, 20), '#6b4430', { shade: 3 });
  s += part('M290,386 L290,306 C290,262 378,262 378,306 L378,386 Z', '#6b4430', { shade: 4 });
  s += part('M296,386 C300,360 330,350 344,352 C362,350 374,366 374,386 Z', PAL.gold, { shade: 4 });
  s += part(
    polyD(
      [
        [286, 384],
        [382, 384],
        [404, 424],
        [266, 424],
      ],
      3,
    ),
    PAL.woodLight,
  );
  s += line('M282,396 H386 M276,410 H394', darken(PAL.woodLight, 0.3), 2.2);
  // Roof: side plane, front trim, chimney.
  s +=
    part(rectD(108, 118, 32, 64, 3), PAL.stone) +
    part(rectD(102, 110, 44, 14, 3), darken(PAL.stone, 0.15));
  s += part(
    polyD(
      [
        [50, 264],
        [172, 104],
        [336, 116],
        [226, 252],
      ],
      3,
    ),
    PAL.roofRed,
    { shade: 12 },
  );
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const ax = 172 + (50 - 172) * t,
      ay = 104 + (264 - 104) * t,
      bx = 336 + (226 - 336) * t,
      by = 116 + (252 - 116) * t;
    s += line(`M${ax + 4},${ay} L${bx - 4},${by}`, darken(PAL.roofRed, 0.3), 2.4);
  }
  s += part(
    polyD(
      [
        [216, 258],
        [334, 108],
        [462, 258],
        [440, 266],
        [334, 136],
        [238, 266],
      ],
      3,
    ),
    darken(PAL.roofRed, 0.08),
  );
  return svgDoc(512, 448, s);
}

function hayBale(cx: number, cy: number, r: number) {
  return (
    part(ellipseD(cx, cy, r, r * 0.92), '#f0c85a', { shade: 8 }) +
    line(
      `M${cx - r * 0.5},${cy - r * 0.2} C${cx - r * 0.2},${cy - r * 0.55} ${cx + r * 0.35},${cy - r * 0.35} ${cx + r * 0.3},${cy + r * 0.05} C${cx + r * 0.25},${cy + r * 0.35} ${cx - r * 0.2},${cy + r * 0.35} ${cx - r * 0.15},${cy}`,
      '#c99a2e',
      2.4,
    ) +
    line(
      `M${cx - r * 0.75},${cy + r * 0.3} L${cx - r * 0.55},${cy + r * 0.2} M${cx + r * 0.6},${cy - r * 0.5} L${cx + r * 0.75},${cy - r * 0.35}`,
      '#c99a2e',
      2,
    )
  );
}

function hayShed(): string {
  setScale(PROP_STROKE, 9);
  let s = grassPatch(192, 344, 180, 34, 71, 3);
  s += contactShadow(196, 330, 150, 18, 0.32);
  s += part(rectD(80, 150, 240, 160, 4), darken(PAL.wood, 0.25));
  s += planks(80, 150, 240, 160, 26, darken(PAL.wood, 0.45));
  for (const x of [96, 304]) s += part(rectD(x, 150, 18, 160, 4), darken(PAL.woodDark, 0.15));
  s += hayBale(146, 284, 52) + hayBale(250, 288, 50) + hayBale(198, 222, 46);
  for (const x of [56, 314]) s += part(rectD(x, 150, 22, 184, 5), PAL.woodDark);
  s += part(
    polyD(
      [
        [30, 172],
        [104, 64],
        [282, 64],
        [356, 172],
      ],
      4,
    ),
    PAL.roofRed,
    { shade: 12 },
  );
  for (let i = 1; i < 4; i++) {
    const y = 64 + (108 * i) / 4;
    const k = (y - 64) / 108;
    s += line(`M${104 - 74 * k + 6},${y} H${282 + 74 * k - 6}`, darken(PAL.roofRed, 0.3), 2.4);
  }
  s += part(
    polyD(
      [
        [22, 176],
        [364, 176],
        [356, 190],
        [30, 190],
      ],
      3,
    ),
    darken(PAL.roofRed, 0.12),
  );
  return svgDoc(384, 384, s);
}

function waterWell(): string {
  setScale(PROP_STROKE, 8);
  let s = grassPatch(128, 352, 114, 24, 81, 2);
  s += contactShadow(128, 340, 92, 12, 0.32);
  for (const x of [48, 192]) s += part(rectD(x, 104, 16, 160, 4), PAL.woodDark);
  // Stone cylinder.
  s += part('M44,252 L44,322 C44,344 212,344 212,322 L212,252 Z', PAL.stone);
  const r = rng(82);
  for (let row = 0; row < 3; row++) {
    const y = 270 + row * 22;
    s += line(`M46,${y} C80,${y + 8} 176,${y + 8} 210,${y}`, darken(PAL.stone, 0.3), 2);
    for (let x = 60 + (row % 2) * 20; x < 200; x += 40)
      s += line(`M${x + r() * 4},${y - 18} V${y + 4}`, darken(PAL.stone, 0.3), 2);
  }
  s += part(ellipseD(128, 252, 86, 22), lighten(PAL.stone, 0.15), { shade: 4 });
  s += part(ellipseD(128, 253, 68, 15), PAL.water, { shade: 4, stroke: 2.4, ink: '#4f7f9a' });
  s += glint(108, 249, 4);
  // Axle, pulley, rope, bucket.
  s += part(rectD(56, 124, 144, 10, 4), PAL.wood);
  s += part(ellipseD(128, 129, 15, 15), '#9a9a9a') + flat(ellipseD(128, 129, 5, 5), '#5c5c5c');
  s += line('M128,144 V196', '#b9925a', 3);
  s += part(
    polyD(
      [
        [108, 196],
        [148, 196],
        [142, 228],
        [114, 228],
      ],
      3,
    ),
    PAL.wood,
  );
  s += line('M110,206 H146 M112,220 H144', '#7b7b7b', 2.4);
  // Wooden roof.
  s += part(
    polyD(
      [
        [24, 118],
        [128, 44],
        [232, 118],
        [216, 126],
        [128, 66],
        [40, 126],
      ],
      4,
    ),
    PAL.woodDark,
    { shade: 6 },
  );
  s += part(
    polyD(
      [
        [40, 118],
        [128, 56],
        [216, 118],
        [128, 96],
      ],
      3,
    ),
    PAL.wood,
  );
  s += line('M84,88 L128,60 L172,88', darken(PAL.wood, 0.3), 2);
  return svgDoc(256, 384, s);
}

function fenceSection(): string {
  setScale(PROP_STROKE, 6);
  // Tiles left/right: the grass strip and rails run to both edges, posts sit inside.
  let s = part(rectD(-20, 132, 296, 40, 16), PAL.grass, {
    shade: 8,
    lightColor: PAL.grassLight,
    shadeColor: PAL.grassDark,
  });
  for (let x = 6; x < 256; x += 22) s += tuft(x, 138, 8 + ((x * 7) % 5));
  s += contactShadow(128, 138, 128, 5, 0.25);
  for (const y of [66, 100]) s += part(rectD(-10, y, 276, 16, 4), PAL.woodLight);
  for (const x of [20, 115, 210])
    s += part(
      polyD(
        [
          [x, 140],
          [x, 46],
          [x + 13, 32],
          [x + 26, 46],
          [x + 26, 140],
        ],
        3,
      ),
      PAL.wood,
    );
  return svgDoc(256, 160, s);
}

function shopStall(): string {
  setScale(PROP_STROKE, 9);
  let s = grassPatch(192, 346, 180, 32, 91, 3);
  s += contactShadow(192, 330, 150, 16, 0.32);
  for (const x of [66, 300]) s += part(rectD(x, 98, 18, 230, 4), PAL.woodDark);
  // Goods on the counter: apples and a basket of corn.
  for (const [x, y] of [
    [96, 206],
    [118, 202],
    [140, 206],
    [106, 188],
    [130, 186],
  ])
    s +=
      part(ellipseD(x!, y!, 13, 12), PAL.red, { shade: 4, stroke: 2.4 }) +
      line(`M${x},${y! - 12} l2,-6`, '#6b4430', 2.4);
  s += part(
    polyD(
      [
        [226, 186],
        [306, 186],
        [298, 216],
        [234, 216],
      ],
      4,
    ),
    '#c58b4f',
  );
  s += kernels(266, 182, 34, 8, 30, 92, 4.2);
  s += part(rectD(48, 212, 288, 24, 6), PAL.woodLight);
  s += part(rectD(60, 234, 264, 94, 6), PAL.wood);
  s += planks(60, 234, 264, 94, 30, darken(PAL.wood, 0.3));
  s += pigEmblem(192, 282, 18, lighten(PAL.wood, 0.25), darken(PAL.wood, 0.5));
  // Striped awning with a scalloped edge.
  const top = 62,
    bottom = 140,
    l = 36,
    rr = 348,
    n = 8;
  for (let i = 0; i < n; i++) {
    const x0 = l + ((rr - l) * i) / n,
      x1 = l + ((rr - l) * (i + 1)) / n;
    const t0 = 70 + ((314 - 70) * i) / n,
      t1 = 70 + ((314 - 70) * (i + 1)) / n;
    const fill = i % 2 === 0 ? PAL.red : PAL.white;
    s += part(
      `M${t0},${top} L${t1},${top} L${x1},${bottom} Q${(x0 + x1) / 2},${bottom + 22} ${x0},${bottom} Z`,
      fill,
      { stroke: 2.6, ink: '#8a3a32', shade: 6 },
    );
  }
  s += part(rectD(64, 52, 256, 14, 6), PAL.woodDark);
  return svgDoc(384, 384, s);
}

// ---------- scene layers ----------

function sky(): string {
  return svgDoc(
    1600,
    500,
    '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcdf2"/><stop offset="0.65" stop-color="#cdeaf7"/><stop offset="1" stop-color="#fdf0d6"/></linearGradient></defs><rect width="1600" height="500" fill="url(#sky)"/>',
  );
}

function cloud(seed: number): string {
  setScale(3, 10);
  const r = rng(seed);
  const puffs: [number, number, number][] = [];
  for (let i = 0; i < 6; i++)
    puffs.push([
      70 + i * 48 + r() * 12,
      92 - Math.sin((i / 5) * Math.PI) * 30 + r() * 8,
      34 + Math.sin((i / 5) * Math.PI) * 18 + r() * 6,
    ]);
  let d = '';
  for (const [x, y, rad] of puffs) d += ellipseD(x, y, rad, rad * 0.92) + ' ';
  d += rectD(56, 96, 272, 34, 17);
  return svgDoc(
    384,
    160,
    part(d, '#ffffff', { stroke: 0, shade: 14, shadeColor: '#dbe9f6', light: 0 }) +
      line('M60,128 C120,136 260,136 326,128', '#bcd3ea', 3),
  );
}

function hillsFar(): string {
  const back =
    'M0,150 C160,96 300,86 470,128 C620,164 760,92 930,84 C1100,76 1240,140 1380,118 C1480,102 1560,96 1600,104 L1600,300 L0,300 Z';
  const front =
    'M0,206 C140,170 280,160 420,186 C580,214 700,170 860,166 C1020,162 1120,206 1280,196 C1420,186 1520,166 1600,172 L1600,300 L0,300 Z';
  let s = part(back, '#b5dba0', {
    stroke: 2.5,
    ink: '#8fbd84',
    shade: 10,
    light: 6,
    shadeColor: '#a3cf92',
    lightColor: '#cbe8b8',
  });
  const r = rng(101);
  for (let i = 0; i < 26; i++) {
    const x = 20 + r() * 1560,
      y = 160 + r() * 30;
    s += flat(ellipseD(x, y, 10 + r() * 8, 8 + r() * 6), '#94c486', 0, '', 'opacity="0.8"');
  }
  s += part(front, '#9fd084', {
    stroke: 2.5,
    ink: '#7fb46e',
    shade: 10,
    light: 6,
    shadeColor: '#8cc173',
    lightColor: '#b7df9f',
  });
  return svgDoc(1600, 300, s);
}

function treesMid(): string {
  setScale(2.8, 10);
  const r = rng(111);
  let s = '';
  // Trees spaced across the width, bushes in between, all sitting on one ground strip.
  const trees: [number, number][] = [];
  for (let x = 30; x < 1600; x += 110 + r() * 90) trees.push([x, 0.8 + r() * 0.4]);
  for (const [x, k] of trees) {
    const h = 150 * k;
    s += part(rectD(x - 9 * k, 236 - h * 0.45, 18 * k, h * 0.45 + 10, 5), '#9b6a45');
    const cy = 236 - h * 0.62,
      rad = 54 * k;
    const canopy = `${ellipseD(x, cy - rad * 0.35, rad * 0.75, rad * 0.7)} ${ellipseD(x - rad * 0.55, cy + rad * 0.1, rad * 0.62, rad * 0.55)} ${ellipseD(x + rad * 0.55, cy + rad * 0.1, rad * 0.62, rad * 0.55)}`;
    s += part(canopy, r() < 0.5 ? '#6fbb57' : '#79c25e', {
      shadeColor: '#56a046',
      lightColor: '#a2d982',
      ink: '#4c8a3c',
    });
  }
  for (let x = 0; x < 1640; x += 70 + r() * 50) {
    const rad = 26 + r() * 14;
    s += part(
      `${ellipseD(x, 236, rad, rad * 0.8)} ${ellipseD(x + rad * 0.8, 240, rad * 0.8, rad * 0.65)}`,
      '#86c95e',
      { shadeColor: '#68b04c', lightColor: '#b0de8a', ink: '#4c8a3c' },
    );
    if (r() < 0.4) s += daisy(x + 6, 230, 4);
  }
  s += part(rectD(-10, 240, 1620, 40, 0), '#86c95e', { stroke: 0, shade: 0 });
  return svgDoc(1600, 260, s);
}

function groundGrass(): string {
  const r = rng(121);
  let s = `<rect width="512" height="512" fill="${PAL.grass}"/>`;
  // Every element is drawn at ±512 offsets so the tile wraps seamlessly.
  const wrap = (x: number, y: number, draw: (x: number, y: number) => string) => {
    let out = '';
    for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) out += draw(x + dx, y + dy);
    return out;
  };
  for (let i = 0; i < 18; i++) {
    const x = r() * 512,
      y = r() * 512,
      rx = 40 + r() * 60;
    const c = r() < 0.5 ? '#93d068' : '#7fc055';
    s += wrap(x, y, (a, b) => flat(ellipseD(a, b, rx, rx * 0.5), c, 0, '', 'opacity="0.7"'));
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * 512,
      y = r() * 512,
      h = 6 + r() * 6;
    s += wrap(x, y, (a, b) => tuft(a, b, h, r() < 0.5 ? PAL.grassDark : '#6fb34d'));
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * 512,
      y = r() * 512,
      yellow = r() < 0.35;
    s += wrap(x, y, (a, b) =>
      yellow ? flat(ellipseD(a, b, 3.5, 3.5), '#f8d65a', 1, '#c99a2e') : daisy(a, b, 3.6),
    );
  }
  return svgDoc(512, 512, s);
}

/** Every world file, keyed by the inbox stem (= target file name). */
export const WORLD: Record<string, () => string> = {
  prop_feed_trough_empty: () => trough('empty'),
  prop_feed_trough_half: () => trough('half'),
  prop_feed_trough_full: () => trough('full'),
  prop_order_board: orderBoard,
  prop_water_bowl: waterBowl,
  prop_mud_puddle: mudPuddle,
  prop_food_sack: foodSack,
  prop_pig_house: pigHouse,
  prop_hay_shed: hayShed,
  prop_water_well: waterWell,
  prop_fence_section: fenceSection,
  prop_shop_stall: shopStall,
  env_sky: sky,
  env_cloud_1: () => cloud(131),
  env_cloud_2: () => cloud(137),
  env_hills_far: hillsFar,
  env_trees_mid: treesMid,
  env_ground_grass: groundGrass,
};
