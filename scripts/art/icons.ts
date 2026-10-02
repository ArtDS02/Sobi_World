// Shared fx overlays/particles (AI pack §4), UI icons (§6) and the app icon (environment
// catalogue §4.4). Same kit as pigs and props; stroke per canvas so the line reads the same once
// the game scales them down (overlay 256 → 64 px, particle 64 → ~28 px, icon 128 → ~40 px).
import {
  PAL,
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
  setScale,
  starD,
  svgDoc,
} from './kit';

const sparkle4 = (x: number, y: number, s: number, fill = '#ffe27a', stroke = 2.5) =>
  part(
    `M${x},${y - s} Q${x + s * 0.18},${y - s * 0.18} ${x + s},${y} Q${x + s * 0.18},${y + s * 0.18} ${x},${y + s} Q${x - s * 0.18},${y + s * 0.18} ${x - s},${y} Q${x - s * 0.18},${y - s * 0.18} ${x},${y - s} Z`,
    fill,
    { stroke, shade: s * 0.18, ink: PAL.goldDark },
  );

const bubble = (x: number, y: number, r: number, stroke: number) =>
  flat(ellipseD(x, y, r, r), '#d6f0ff', stroke, '#6fa9d6', 'fill-opacity="0.55"') +
  line(
    `M${x - r * 0.55},${y - r * 0.1} A${r * 0.6},${r * 0.6} 0 0 1 ${x - r * 0.05},${y - r * 0.58}`,
    '#ffffff',
    Math.max(1.5, r * 0.18),
  ) +
  glint(x + r * 0.35, y + r * 0.35, r * 0.1, 0.9);

const pigHead = (x: number, y: number, s: number, fill: string, stroke: number, ink?: string) =>
  part(ellipseD(x - s * 0.6, y - s * 0.68, s * 0.34, s * 0.34), fill, {
    stroke,
    shade: 0,
    ...(ink ? { ink } : {}),
  }) +
  part(ellipseD(x + s * 0.6, y - s * 0.68, s * 0.34, s * 0.34), fill, {
    stroke,
    shade: 0,
    ...(ink ? { ink } : {}),
  }) +
  part(ellipseD(x, y, s, s * 0.88), fill, { stroke, shade: 0, ...(ink ? { ink } : {}) }) +
  flat(
    ellipseD(x, y + s * 0.22, s * 0.42, s * 0.3),
    darken(fill, 0.1),
    stroke * 0.7,
    ink ?? darken(fill, 0.5),
  ) +
  flat(ellipseD(x - s * 0.14, y + s * 0.22, s * 0.07, s * 0.11), ink ?? darken(fill, 0.5)) +
  flat(ellipseD(x + s * 0.14, y + s * 0.22, s * 0.07, s * 0.11), ink ?? darken(fill, 0.5)) +
  flat(ellipseD(x - s * 0.38, y - s * 0.2, s * 0.09, s * 0.12), ink ?? darken(fill, 0.5)) +
  flat(ellipseD(x + s * 0.38, y - s * 0.2, s * 0.09, s * 0.12), ink ?? darken(fill, 0.5));

// ---------- fx ----------

const Z_BLUE = '#8fb6f0';
const zShape = (x: number, y: number, s: number, opacity = 1) =>
  part(
    polyD(
      [
        [x - s * 0.5, y - s * 0.5],
        [x + s * 0.5, y - s * 0.5],
        [x + s * 0.5, y - s * 0.28],
        [x - s * 0.12, y + s * 0.3],
        [x + s * 0.5, y + s * 0.3],
        [x + s * 0.5, y + s * 0.5],
        [x - s * 0.5, y + s * 0.5],
        [x - s * 0.5, y + s * 0.28],
        [x + s * 0.12, y - s * 0.3],
        [x - s * 0.5, y - s * 0.3],
      ],
      s * 0.06,
    ),
    Z_BLUE,
    { opacity, stroke: 9, shade: 3, light: 0, ink: '#4f72b0' },
  );

function fxZzz(): string {
  setScale(9, 10);
  const zs: [number, number, number][] = [
    [62, 200, 46],
    [124, 138, 62],
    [192, 66, 82],
  ];
  let s = '';
  for (let frame = 0; frame < 3; frame++) {
    let f = '';
    zs.forEach(([x, y, size], i) => {
      if (i <= frame) f += zShape(x, y, size, i === frame ? 0.8 : 1);
    });
    s += g(f, `translate(${frame * 256},0)`);
  }
  return svgDoc(768, 256, s);
}

function fxSick(): string {
  setScale(9, 14);
  return svgDoc(
    256,
    256,
    part(
      'M100,44 C120,86 156,118 156,156 C156,192 130,214 100,214 C70,214 44,192 44,156 C44,118 80,86 100,44 Z',
      '#a9dcf7',
      { ink: '#4f86ad' },
    ) +
      line('M76,150 C74,170 84,188 100,192', '#ffffff', 9, 'opacity="0.9"') +
      g(
        line(
          'M190,70 C224,66 230,108 204,114 C184,118 178,94 194,90 C204,88 208,98 202,102',
          '#3d6e2c',
          22,
        ) +
          line(
            'M190,70 C224,66 230,108 204,114 C184,118 178,94 194,90 C204,88 208,98 202,102',
            '#9ad66a',
            11,
          ),
        'translate(200,92) scale(1.5) translate(-200,-92)',
      ),
  );
}

function fxPregnant(): string {
  setScale(9, 14);
  return svgDoc(
    256,
    256,
    part(heartD(124, 134, 96), '#f9a9c0', { ink: '#b4566f' }) +
      pigHead(124, 140, 40, '#ffffff', 6, '#c77d92') +
      sparkle4(210, 56, 24, '#ffe27a', 6) +
      sparkle4(40, 66, 16, '#ffe27a', 5),
  );
}

const particle = (body: string) => svgDoc(64, 64, body);
const fxHeart = () => (
  setScale(3.5, 5),
  particle(part(heartD(32, 32, 26), '#f7809c', { ink: '#b4405d' }) + glint(22, 22, 4.5))
);
const fxBubble = () => (setScale(3, 4), particle(bubble(32, 32, 25, 3)));
const fxCrumb = () => (
  setScale(3, 4),
  particle(
    part('M10,34 C10,24 22,18 30,24 C36,30 32,42 22,44 C14,46 10,40 10,34 Z', '#d9a05a', {
      ink: '#8a5a2a',
    }) +
      part('M36,28 C40,20 52,20 56,30 C58,40 50,46 42,44 C36,42 34,34 36,28 Z', '#c78c48', {
        ink: '#8a5a2a',
      }),
  )
);
const fxSparkle = () => (setScale(3, 4), particle(sparkle4(32, 32, 27, '#ffe27a', 3)));
/** U06 gift spawn: a soft cream puff of three round blobs (no hard outline, like a small cloud). */
const fxSmoke = () => (
  setScale(2.5, 4),
  particle(
    part(ellipseD(22, 38, 14, 12), '#fbf3e6', { ink: '#d8c8b4', light: 4 }) +
      part(ellipseD(42, 38, 14, 12), '#fbf3e6', { ink: '#d8c8b4', light: 4 }) +
      part(ellipseD(32, 26, 16, 14), '#fffaf2', { ink: '#d8c8b4', light: 5 }),
  )
);
const fxCoin = () => (
  setScale(3.5, 6),
  particle(
    part(ellipseD(32, 32, 27, 27), PAL.gold, { ink: '#a26a14' }) +
      flat(ellipseD(32, 32, 18, 18), 'none', 3, PAL.goldDark) +
      part(starD(32, 33, 10, 4.5), '#ffe58a', { stroke: 2, shade: 1, ink: PAL.goldDark }) +
      glint(21, 20, 4),
  )
);

// ---------- UI icons (128²) ----------

const ICON_STROKE = 6;
const icon = (body: string) => {
  return svgDoc(128, 128, body);
};

const bowl = (cx: number, cy: number, w: number, fill = '#f6e3bd') =>
  part(
    `M${cx - w},${cy} C${cx - w + 4},${cy + w * 0.62} ${cx + w - 4},${cy + w * 0.62} ${cx + w},${cy} Z`,
    fill,
  ) + part(rectD(cx - w - 4, cy - 6, w * 2 + 8, 12, 6), lighten(fill, 0.2), { shade: 3 });

const coin = (x: number, y: number, rx: number) =>
  part(
    `M${x - rx},${y} L${x - rx},${y + 9} A${rx},${rx * 0.38} 0 0 0 ${x + rx},${y + 9} L${x + rx},${y} Z`,
    PAL.goldDark,
    { shade: 2 },
  ) +
  part(ellipseD(x, y, rx, rx * 0.38), PAL.gold, { shade: 3 }) +
  flat(ellipseD(x, y, rx * 0.62, rx * 0.22), 'none', 2.5, PAL.goldDark);

const brush = (x: number, y: number, rot: number) =>
  g(
    part(rectD(-38, -4, 76, 16, 6), '#f3e4c2') +
      line('M-30,12 V22 M-18,12 V22 M-6,12 V22 M6,12 V22 M18,12 V22 M30,12 V22', '#d9c49a', 4) +
      part(rectD(-42, -22, 84, 20, 9), PAL.wood) +
      part(rectD(-14, -36, 28, 16, 6), PAL.woodDark),
    `translate(${x},${y}) rotate(${rot})`,
  );

const troughSmall = (x: number, y: number, w: number) =>
  part(
    `M${x - w},${y - 6} L${x + w},${y - 6} L${x + w - 8},${y + 26} L${x - w + 8},${y + 26} Z`,
    PAL.wood,
  ) +
  line(`M${x - w + 6},${y + 10} H${x + w - 6}`, darken(PAL.wood, 0.3), 3) +
  part(rectD(x - w - 6, y - 12, 12, 42, 4), PAL.woodDark) +
  part(rectD(x + w - 6, y - 12, 12, 42, 4), PAL.woodDark);

const corn = (x: number, y: number, w: number, h: number) =>
  part(
    `M${x - w},${y} C${x - w * 0.6},${y - h} ${x + w * 0.6},${y - h} ${x + w},${y} Z`,
    PAL.gold,
    { shade: 4 },
  ) +
  [-0.5, -0.15, 0.2, 0.5, -0.3, 0.05, 0.35]
    .map((k, i) =>
      flat(
        ellipseD(x + k * w, y - (i < 4 ? h * 0.25 : h * 0.55), 4, 3.4),
        '#ffe17a',
        1.4,
        PAL.goldDark,
      ),
    )
    .join('');

const ICONS: Record<string, () => string> = {
  ui_icon_hunger: () =>
    icon(
      bowl(64, 74, 46) +
        [-26, -10, 8, 24, -18, 2, 18]
          .map((dx, i) => flat(ellipseD(64 + dx, i < 4 ? 66 : 58, 9, 7), '#a8693e', 2, '#6b3f22'))
          .join('') +
        part(
          'M40,46 C32,40 38,30 46,36 L80,36 C88,30 94,40 86,46 C94,52 88,62 80,56 L46,56 C38,62 32,52 40,46 Z',
          '#fff8ea',
        ),
    ),
  ui_icon_cleanliness: () =>
    icon(
      part(
        polyD(
          [
            [20, 78],
            [76, 64],
            [108, 80],
            [52, 98],
          ],
          8,
        ),
        '#ffffff',
        { shadeColor: '#cfe2ee' },
      ) +
        part(
          polyD(
            [
              [20, 78],
              [52, 98],
              [52, 110],
              [20, 90],
            ],
            4,
          ),
          '#dfeaf2',
        ) +
        part(
          polyD(
            [
              [52, 98],
              [108, 80],
              [108, 92],
              [52, 110],
            ],
            4,
          ),
          '#c9dbe8',
        ) +
        bubble(58, 42, 17, 4) +
        bubble(88, 24, 11, 3.5),
    ),
  ui_icon_health: () =>
    icon(
      part(heartD(64, 66, 52), '#ef4f58') +
        part(rectD(55, 40, 18, 52, 4), '#ffffff', { shade: 3 }) +
        part(rectD(38, 57, 52, 18, 4), '#ffffff', { shade: 3 }) +
        glint(38, 42, 6),
    ),
  ui_icon_happiness: () =>
    icon(
      part(ellipseD(60, 68, 44, 44), '#ffd84d', { ink: '#b98216' }) +
        flat(ellipseD(46, 60, 5, 7), PAL.eye) +
        flat(ellipseD(74, 60, 5, 7), PAL.eye) +
        flat(ellipseD(38, 76, 8, 5), PAL.blush, 0, '', 'opacity="0.8"') +
        flat(ellipseD(82, 76, 8, 5), PAL.blush, 0, '', 'opacity="0.8"') +
        line('M46,82 Q60,96 74,82', '#7a4a20', 5) +
        sparkle4(108, 26, 13, '#ffe27a', 4) +
        sparkle4(112, 62, 8, '#ffe27a', 3),
    ),
  ui_icon_growth: () =>
    icon(
      part(
        polyD(
          [
            [90, 18],
            [118, 50],
            [102, 50],
            [102, 96],
            [78, 96],
            [78, 50],
            [62, 50],
          ],
          4,
        ),
        '#9fdcc6',
        { ink: '#4e9a80' },
      ) +
        part(rectD(28, 92, 72, 22, 10), PAL.dirt) +
        line('M58,96 C58,76 56,62 58,48', '#3f7f2e', 12) +
        line('M58,96 C58,76 56,62 58,48', PAL.green, 6) +
        part('M58,62 C40,64 24,54 22,38 C40,36 54,44 58,62 Z', PAL.green) +
        part('M58,52 C66,36 82,30 96,36 C90,52 74,58 58,52 Z', '#8fd06a'),
    ),
  ui_icon_gold: () =>
    icon(coin(56, 92, 36) + coin(66, 70, 36) + coin(58, 48, 36) + glint(40, 44, 5)),
  ui_icon_xp: () =>
    icon(part(starD(64, 68, 52, 24), '#5aa8f0', { ink: '#2f6aa8' }) + glint(50, 52, 7)),
  ui_icon_trough: () => icon(corn(64, 60, 42, 26) + troughSmall(64, 64, 48) + glint(46, 46, 3)),
  ui_icon_order: () =>
    icon(
      part('M28,26 L92,26 L92,100 C92,110 84,112 78,108 L28,108 Z', '#fff4d8') +
        part(rectD(18, 16, 84, 18, 9), '#f0dfb6') +
        part(rectD(26, 98, 76, 16, 8), '#f0dfb6') +
        line('M40,48 H80 M40,62 H80 M40,76 H66', '#e8d6aa', 4) +
        part(ellipseD(86, 94, 16, 16), '#d9403a') +
        part(starD(86, 94, 8, 4, 6), '#b8302a', { stroke: 0, shade: 0 }),
    ),
  ui_icon_collection: () =>
    icon(
      part(rectD(22, 18, 84, 96, 8), '#a0643a') +
        part(rectD(98, 22, 10, 88, 4), '#f6ead0', { shade: 2 }) +
        line('M30,22 V110', '#7a4524', 4) +
        [
          [22, 18],
          [94, 18],
          [22, 102],
          [94, 102],
        ]
          .map(([x, y]) => part(rectD(x!, y!, 12, 12, 3), PAL.gold, { stroke: 3, shade: 1 }))
          .join('') +
        part(starD(64, 66, 24, 11), PAL.gold, { ink: '#8a5a14' }),
    ),
  ui_btn_feed: () =>
    icon(
      corn(64, 64, 40, 32) +
        bowl(64, 70, 46) +
        part('M76,34 C86,18 106,16 114,22 C106,36 90,40 76,34 Z', PAL.green),
    ),
  ui_btn_clean: () =>
    icon(
      brush(58, 74, -18) + bubble(98, 40, 13, 3.5) + bubble(84, 18, 8, 3) + bubble(108, 74, 9, 3),
    ),
  ui_btn_clean_all: () =>
    icon(
      brush(64, 88, -10) +
        sparkle4(16, 54, 10, '#ffe27a', 3) +
        bubble(30, 28, 9, 3) +
        sparkle4(64, 14, 11, '#ffe27a', 3) +
        bubble(98, 26, 9, 3) +
        sparkle4(114, 56, 10, '#ffe27a', 3) +
        bubble(50, 40, 7, 2.5),
    ),
  ui_btn_heal: () =>
    icon(
      g(
        part(rectD(-48, -14, 96, 28, 10), '#fff2e0') +
          part(rectD(-15, -14, 30, 28, 4), '#f3d9bd', { shade: 2 }) +
          [-6, 6]
            .map(
              (dx) =>
                flat(ellipseD(dx, -5, 2, 2), '#d6b58e') + flat(ellipseD(dx, 6, 2, 2), '#d6b58e'),
            )
            .join(''),
        'translate(64,68) rotate(40)',
      ) +
        g(
          part(rectD(-24, -54, 48, 10, 4), '#b9c3cf') +
            part(rectD(-6, -62, 12, 14, 3), '#b9c3cf') +
            part(rectD(-17, -44, 34, 70, 8), '#eef8ff', { shadeColor: '#cfe2ee' }) +
            part(rectD(-12, -12, 24, 34, 4), '#7fd36a', { stroke: 0, shade: 3 }) +
            line('M-17,-28 H-6 M-17,-14 H-6 M-17,0 H-6', '#8aa0b4', 3) +
            line('M0,26 V50', '#8aa0b4', 4),
          'translate(64,62) rotate(-40)',
        ),
    ),
  ui_btn_breed: () =>
    icon(
      part(heartD(50, 58, 40), '#f48aa6', { ink: '#b4405d' }) +
        part(heartD(80, 78, 30), '#ffb5c8', { ink: '#b4405d' }) +
        glint(36, 42, 5) +
        sparkle4(106, 28, 13, '#ffe27a', 3.5),
    ),
  ui_btn_shop: () =>
    icon(
      part(rectD(26, 50, 10, 60, 3), PAL.woodDark) +
        part(rectD(92, 50, 10, 60, 3), PAL.woodDark) +
        part(rectD(18, 78, 92, 12, 4), PAL.woodLight) +
        part(rectD(24, 88, 80, 26, 4), PAL.wood) +
        [0, 1, 2, 3, 4, 5]
          .map((i) => {
            const x0 = 12 + i * 17.3,
              x1 = x0 + 17.3;
            return part(
              `M${x0 + 6},22 L${x1 + 6 - (i === 5 ? 0 : 0)},22 L${x1},52 Q${(x0 + x1) / 2},62 ${x0},52 Z`,
              i % 2 ? PAL.white : PAL.red,
              { stroke: 3.5, ink: '#8a3a32', shade: 3 },
            );
          })
          .join('') +
        part(ellipseD(44, 72, 7, 7), PAL.red, { stroke: 3, shade: 2 }) +
        part(ellipseD(58, 72, 7, 7), PAL.red, { stroke: 3, shade: 2 }),
    ),
  ui_btn_fill_trough: () =>
    icon(
      g(
        part('M-30,24 C-38,0 -30,-26 -10,-36 L20,-36 C36,-26 40,0 30,24 Z', '#ecd7a8') +
          part(ellipseD(5, -36, 18, 7), '#b89a62', { shade: 2 }),
        'translate(50,46) rotate(-55) scale(0.82)',
      ) +
        [
          [76, 52],
          [82, 64],
          [74, 70],
          [86, 76],
        ]
          .map(([x, y]) => flat(ellipseD(x!, y!, 4, 3.4), '#ffe17a', 1.4, PAL.goldDark))
          .join('') +
        corn(78, 92, 28, 14) +
        troughSmall(78, 94, 34),
    ),
};

/** Square app icon: classic pig head on a rounded warm tile (build/icon.png master). */
export function appIconSvg(size: number): string {
  setScale(18, 24);
  const body =
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6f7"/><stop offset="0.62" stop-color="#e9f6dc"/><stop offset="0.63" stop-color="#9fd57a"/><stop offset="1" stop-color="#7fc05a"/></linearGradient></defs>` +
    `<rect x="40" y="40" width="944" height="944" rx="200" fill="url(#bg)" stroke="#5a8a3a" stroke-width="16"/>` +
    part(ellipseD(310, 300, 120, 140), PAL.pigPink, { transform: 'rotate(-24 310 300)' }) +
    part(ellipseD(714, 300, 120, 140), PAL.pigPink, { transform: 'rotate(24 714 300)' }) +
    flat(ellipseD(310, 310, 70, 90), PAL.snoutPink, 0, '', 'transform="rotate(-24 310 300)"') +
    flat(ellipseD(714, 310, 70, 90), PAL.snoutPink, 0, '', 'transform="rotate(24 714 300)"') +
    part(ellipseD(512, 560, 340, 300), PAL.pigPink) +
    flat(ellipseD(330, 660, 60, 36), PAL.blush, 0, '', 'opacity="0.75"') +
    flat(ellipseD(694, 660, 60, 36), PAL.blush, 0, '', 'opacity="0.75"') +
    flat(ellipseD(390, 500, 46, 58), PAL.eye) +
    flat(ellipseD(634, 500, 46, 58), PAL.eye) +
    glint(374, 478, 20) +
    glint(618, 478, 20) +
    glint(404, 526, 8) +
    glint(648, 526, 8) +
    part(ellipseD(512, 650, 130, 96), PAL.snoutPink, { shade: 16 }) +
    flat(ellipseD(466, 650, 22, 34), darken(PAL.snoutPink, 0.45)) +
    flat(ellipseD(558, 650, 22, 34), darken(PAL.snoutPink, 0.45));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${body}</svg>`;
}

export const ICON_FILES: Record<string, () => string> = {
  fx_sick: fxSick,
  fx_pregnant: fxPregnant,
  fx_zzz: fxZzz,
  fx_heart: fxHeart,
  fx_bubble: fxBubble,
  fx_crumb: fxCrumb,
  fx_sparkle: fxSparkle,
  fx_smoke: fxSmoke,
  fx_coin: fxCoin,
  ...Object.fromEntries(
    Object.entries(ICONS).map(([id, draw]) => [
      id,
      () => {
        setScale(ICON_STROKE, 8);
        return draw();
      },
    ]),
  ),
};
